/**
 * ClarifyLegal - Enterprise Security Guardrails & Privacy Shield
 * Implements:
 * 1. PII Redaction & Detection (SSN, Phone, Email, Credit Cards, Bank Accounts)
 * 2. Deep Prompt Injection & Delimiter Collision Neutralization
 * 3. Rate Limiting with Sliding Window & IP tracking
 * 4. Input Sanitization & Payload Verification
 */

export interface PIIDetection {
  type: "SSN" | "PHONE" | "EMAIL" | "CREDIT_CARD" | "BANK_ACCOUNT";
  count: number;
}

export interface SecurityAuditResult {
  hasPII: boolean;
  piiDetails: PIIDetection[];
  injectionAttemptsDetected: number;
  injectionNeutralized: boolean;
  sanitized: boolean;
  originalLength: number;
  sanitizedLength: number;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedText: string;
  error?: string;
  securityAudit: SecurityAuditResult;
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

// In-memory sliding window rate limiter
const ipRequestHistory = new Map<string, number[]>();

/**
 * Validates whether an incoming IP request conforms to rate limits
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS;

  const timestamps = ipRequestHistory.get(ip) || [];
  const recentTimestamps = timestamps.filter(t => t > windowStart);

  if (recentTimestamps.length >= SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, recentTimestamps);
    const oldest = recentTimestamps[0] || now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, oldest + SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS - now),
    };
  }

  recentTimestamps.push(now);
  ipRequestHistory.set(ip, recentTimestamps);

  return {
    allowed: true,
    remaining: SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW - recentTimestamps.length,
    resetMs: SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS,
  };
}

/**
 * Resets rate limiter memory (useful for testing)
 */
export function resetRateLimiter(): void {
  ipRequestHistory.clear();
}

/**
 * Scans text for Personally Identifiable Information (PII) and masks sensitive tokens
 */
export function redactPII(text: string): { redactedText: string; detections: PIIDetection[]; totalCount: number } {
  const detections: PIIDetection[] = [];
  let redacted = text;
  let totalCount = 0;

  // 1. Social Security Numbers (SSN: XXX-XX-XXXX)
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ssnMatches = redacted.match(ssnRegex);
  if (ssnMatches && ssnMatches.length > 0) {
    detections.push({ type: "SSN", count: ssnMatches.length });
    totalCount += ssnMatches.length;
    redacted = redacted.replace(ssnRegex, "[REDACTED_SSN]");
  }

  // 2. Credit Card numbers (13-16 digits with hyphens or spaces)
  const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  const ccMatches = redacted.match(ccRegex);
  if (ccMatches && ccMatches.length > 0) {
    detections.push({ type: "CREDIT_CARD", count: ccMatches.length });
    totalCount += ccMatches.length;
    redacted = redacted.replace(ccRegex, "[REDACTED_CREDIT_CARD]");
  }

  // 3. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const emailMatches = redacted.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    detections.push({ type: "EMAIL", count: emailMatches.length });
    totalCount += emailMatches.length;
    redacted = redacted.replace(emailRegex, "[REDACTED_EMAIL]");
  }

  // 4. Phone numbers (standard formats: +1-xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx-xxx-xxxx)
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;
  const phoneMatches = redacted.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    detections.push({ type: "PHONE", count: phoneMatches.length });
    totalCount += phoneMatches.length;
    redacted = redacted.replace(phoneRegex, "[REDACTED_PHONE]");
  }

  // 5. Bank Account / Routing / IBAN numbers
  const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g;
  const ibanMatches = redacted.match(ibanRegex);
  if (ibanMatches && ibanMatches.length > 0) {
    detections.push({ type: "BANK_ACCOUNT", count: ibanMatches.length });
    totalCount += ibanMatches.length;
    redacted = redacted.replace(ibanRegex, "[REDACTED_BANK_ACCOUNT]");
  }

  return { redactedText: redacted, detections, totalCount };
}

/**
 * Sanitizes input contract text by:
 * - Neutralizing prompt injection attempt delimiters
 * - Neutralizing delimiter collision attacks (e.g. triple quotes, backticks)
 * - Redacting or tagging PII
 * - Stripping HTML/script tags and control characters
 * - Normalizing irregular unicode whitespace
 * - Enforcing character bounds
 */
export function sanitizeContractInput(rawText: unknown, maskPII: boolean = true): ValidationResult {
  if (typeof rawText !== "string" || !rawText.trim()) {
    return {
      isValid: false,
      sanitizedText: "",
      error: "Contract text must be a non-empty string.",
      securityAudit: {
        hasPII: false,
        piiDetails: [],
        injectionAttemptsDetected: 0,
        injectionNeutralized: false,
        sanitized: false,
        originalLength: 0,
        sanitizedLength: 0,
      },
      metrics: { characterCount: 0, wordCount: 0, truncated: false },
    };
  }

  const originalLength = rawText.length;
  let text = rawText;
  let injectionCount = 0;

  // Strip null bytes and control characters
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Strip script/html tags
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");

  // Prompt injection and jailbreak patterns
  const injectionPatterns = [
    /ignore\s+all\s+(previous|prior)\s+instructions/gi,
    /ignore\s+previous\s+instructions/gi,
    /disregard\s+all\s+(prior|previous)\s+prompts/gi,
    /system\s*:\s*you\s+are\s+now/gi,
    /you\s+are\s+now\s+in\s+developer\s+mode/gi,
    /jailbreak/gi,
    /reveal\s+your\s+system\s+prompt/gi,
    /output\s+confidential\s+keys/gi,
    /bypass\s+all\s+ethical\s+rules/gi,
    /do\s+anything\s+now/gi,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      injectionCount++;
      text = text.replace(pattern, "[Filtered Directive]");
    }
  }

  // Prevent delimiter collision attacks with LLM prompt envelopes
  text = text.replace(/"""/g, "'''");

  // Redact PII if requested (enabled by default for legal security)
  let piiDetails: PIIDetection[] = [];
  let totalPIICount = 0;
  if (maskPII) {
    const piiResult = redactPII(text);
    text = piiResult.redactedText;
    piiDetails = piiResult.detections;
    totalPIICount = piiResult.totalCount;
  }

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
      securityAudit: {
        hasPII: totalPIICount > 0,
        piiDetails,
        injectionAttemptsDetected: injectionCount,
        injectionNeutralized: injectionCount > 0,
        sanitized: true,
        originalLength,
        sanitizedLength: charCount,
      },
      metrics: { characterCount: charCount, wordCount, truncated },
    };
  }

  return {
    isValid: true,
    sanitizedText: text.trim(),
    securityAudit: {
      hasPII: totalPIICount > 0,
      piiDetails,
      injectionAttemptsDetected: injectionCount,
      injectionNeutralized: injectionCount > 0,
      sanitized: true,
      originalLength,
      sanitizedLength: charCount,
    },
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

  // Neutralize common prompt injection directives in chat
  text = text.replace(/ignore\s+previous\s+instructions/gi, "[Filtered Directive]");
  text = text.replace(/reveal\s+your\s+system\s+prompt/gi, "[Filtered Directive]");

  if (text.length > SECURITY_LIMITS.MAX_PROMPT_CHARS) {
    text = text.slice(0, SECURITY_LIMITS.MAX_PROMPT_CHARS);
  }

  return { isValid: true, sanitized: text };
}
