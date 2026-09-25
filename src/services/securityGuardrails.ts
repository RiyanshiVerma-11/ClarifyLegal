/**
 * ClarifyLegal - Security Guardrails & Input Sanitization Service
 * Protects contract evaluation endpoints against prompt injection,
 * oversized payloads, denial-of-service, and malicious input vectors.
 */

export interface ValidationResult {
  isValid: boolean;
  sanitizedText: string;
  error?: string;
  metrics: {
    characterCount: number;
    wordCount: number;
    truncated: boolean;
  };
}

export const SECURITY_LIMITS = {
  MAX_CONTRACT_CHARS: 250000, // ~50,000 words
  MIN_CONTRACT_CHARS: 10,
  MAX_PROMPT_CHARS: 8000,
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 60,
};

// Simple in-memory sliding window rate limiter
const ipRequestHistory = new Map<string, number[]>();

/**
 * Validates whether an incoming IP request conforms to rate limits
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS;

  const timestamps = ipRequestHistory.get(ip) || [];
  const recentTimestamps = timestamps.filter(t => t > windowStart);

  if (recentTimestamps.length >= SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, recentTimestamps);
    return { allowed: false, remaining: 0 };
  }

  recentTimestamps.push(now);
  ipRequestHistory.set(ip, recentTimestamps);

  return {
    allowed: true,
    remaining: SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW - recentTimestamps.length,
  };
}

/**
 * Sanitizes input contract text by:
 * - Neutralizing prompt injection attempt delimiters (e.g. system instructions override phrases)
 * - Stripping HTML/script tags and null bytes
 * - Normalizing irregular unicode whitespace
 * - Enforcing character bounds
 */
export function sanitizeContractInput(rawText: unknown): ValidationResult {
  if (typeof rawText !== "string" || !rawText.trim()) {
    return {
      isValid: false,
      sanitizedText: "",
      error: "Contract text must be a non-empty string.",
      metrics: { characterCount: 0, wordCount: 0, truncated: false },
    };
  }

  let text = rawText;

  // Strip null bytes and control characters
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Strip script/html tags
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");

  // Neutralize common prompt injection markers
  text = text.replace(/ignore\s+previous\s+instructions/gi, "[Filtered Directive]");
  text = text.replace(/disregard\s+all\s+prior\s+prompts/gi, "[Filtered Directive]");
  text = text.replace(/system\s*:\s*you\s+are\s+now/gi, "[Filtered Directive]");

  let truncated = false;
  if (text.length > SECURITY_LIMITS.MAX_CONTRACT_CHARS) {
    text = text.slice(0, SECURITY_LIMITS.MAX_CONTRACT_CHARS);
    truncated = true;
  }

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (charCount < SECURITY_LIMITS.MIN_CONTRACT_CHARS) {
    return {
      isValid: false,
      sanitizedText: "",
      error: `Contract text is too short (minimum ${SECURITY_LIMITS.MIN_CONTRACT_CHARS} characters).`,
      metrics: { characterCount: charCount, wordCount, truncated },
    };
  }

  return {
    isValid: true,
    sanitizedText: text.trim(),
    metrics: { characterCount: charCount, wordCount, truncated },
  };
}

/**
 * Sanitizes user prompt and chat messages
 */
export function sanitizeUserMessage(rawMessage: unknown): { isValid: boolean; sanitized: string; error?: string } {
  if (typeof rawMessage !== "string" || !rawMessage.trim()) {
    return { isValid: false, sanitized: "", error: "Message cannot be empty." };
  }

  let text = rawMessage.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (text.length > SECURITY_LIMITS.MAX_PROMPT_CHARS) {
    text = text.slice(0, SECURITY_LIMITS.MAX_PROMPT_CHARS);
  }

  return { isValid: true, sanitized: text };
}
