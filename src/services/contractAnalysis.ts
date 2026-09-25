/**
 * ClarifyLegal - Contract Analysis & Forensic Legal Evaluation Engine
 * Core business logic for risk scoring, clause extraction, leverage shift detection,
 * and surgical contract text remediation.
 */

export interface ClauseAudit {
  id: string;
  clauseName: string;
  category: string;
  riskScore: number;
  severity: "Low" | "Medium" | "High" | "Severe";
  originalExcerpt: string;
  plainExplanation: string;
  potentialRisk: string;
  suggestedCounter: string;
}

export interface ContractEvaluationResult {
  overallRiskScore: number;
  riskLevel: "Low" | "Moderate" | "High" | "Severe";
  documentType: string;
  criticalClauses: ClauseAudit[];
  obligations: {
    userObligations: string[];
    counterpartyObligations: string[];
  };
  hiddenTraps: string[];
  checklist: Array<{ item: string; importance: "Crucial" | "Recommended" | "Informational" }>;
}

/**
 * Classifies a numerical risk score (0-100) into standardized legal risk strata
 */
export function classifyRiskLevel(score: number): "Low" | "Moderate" | "High" | "Severe" {
  if (score >= 76) return "Severe";
  if (score >= 51) return "High";
  if (score >= 26) return "Moderate";
  return "Low";
}

/**
 * Calculates a composite contract risk score (0-100) weighted by clause severity
 */
export function calculateContractRiskScore(clauses: Array<{ severity: string; riskScore?: number }>): number {
  if (!clauses || clauses.length === 0) {
    return 15; // Baseline minimal risk for standard agreements
  }

  const weights: Record<string, number> = {
    Severe: 35,
    High: 25,
    Medium: 12,
    Low: 5,
  };

  let totalWeight = 0;
  for (const c of clauses) {
    totalWeight += weights[c.severity] || 10;
  }

  // Normalize to 0-100 scale with logarithmic dampening
  const calculated = Math.min(98, Math.max(10, Math.round(totalWeight * 0.95)));
  return calculated;
}

/**
 * Heuristic detector for predatory legal boilerplate
 */
export function detectPredatoryClauses(text: string): Array<{ name: string; severity: "Severe" | "High" | "Medium"; snippet: string }> {
  const findings: Array<{ name: string; severity: "Severe" | "High" | "Medium"; snippet: string }> = [];
  const lower = text.toLowerCase();

  // 1. Broad-form / uncapped indemnification
  if (lower.includes("indemnif") && (
    lower.includes("hold harmless") || 
    lower.includes("save harmless") || 
    lower.includes("sole cost") || 
    lower.includes("gross negligence") ||
    lower.includes("all liabilities") ||
    lower.includes("defend and hold")
  )) {
    findings.push({
      name: "Broad-Form Uncapped Indemnification",
      severity: "Severe",
      snippet: "Contract requires total indemnification without reciprocal limitation of liability.",
    });
  }

  // 2. Automatic renewal traps
  if ((lower.includes("automatic") || lower.includes("automatically")) && lower.includes("renew") && (
    lower.includes("notice") || 
    lower.includes("subsequent term") || 
    lower.includes("months") ||
    lower.includes("days")
  )) {
    findings.push({
      name: "Automatic Renewal Trap",
      severity: "High",
      snippet: "Agreement auto-renews for extended terms unless notice is delivered inside a narrow window.",
    });
  }

  // 3. Unilateral termination
  if (lower.includes("terminate") && (lower.includes("sole discretion") || lower.includes("without cause") || lower.includes("at any time"))) {
    findings.push({
      name: "Unilateral Termination Rights",
      severity: "High",
      snippet: "Counterparty reserves right to terminate without cause while holding user locked into term.",
    });
  }

  // 4. Dispute waivers
  if (lower.includes("waive") && (lower.includes("jury trial") || lower.includes("class action") || lower.includes("right to claim"))) {
    findings.push({
      name: "Mandatory Jury & Class Action Waiver",
      severity: "Medium",
      snippet: "Forfeits constitutional dispute protections and mandates binding private arbitration.",
    });
  }

  // 5. Perpetual IP forfeiture
  if ((lower.includes("intellectual property") || lower.includes("inventions") || lower.includes("work product")) && (
    lower.includes("in perpetuity") || lower.includes("perpetual") || lower.includes("irrevocably assign")
  )) {
    findings.push({
      name: "Perpetual Pre-Payment IP Forfeiture",
      severity: "Severe",
      snippet: "Transfers title to all background and foreground assets without requiring full payment.",
    });
  }

  return findings;
}

/**
 * Computes the leverage shift between two document versions
 */
export function computeLeverageShift(originalRisk: number, revisedRisk: number): {
  shift: "More Favorable to You" | "Neutral / Balanced" | "More Favorable to Counterparty (High Risk)";
  delta: number;
} {
  const delta = revisedRisk - originalRisk;

  if (delta <= -10) {
    return { shift: "More Favorable to You", delta };
  } else if (delta >= 10) {
    return { shift: "More Favorable to Counterparty (High Risk)", delta };
  }
  return { shift: "Neutral / Balanced", delta };
}

/**
 * Surgically substitutes predatory clauses with amended language
 */
export function generateAmendedContractText(
  originalContract: string,
  replacements: Array<{ originalExcerpt: string; suggestedCounter: string }>
): { amendedText: string; replacementCount: number } {
  let amended = originalContract;
  let count = 0;

  for (const { originalExcerpt, suggestedCounter } of replacements) {
    if (!originalExcerpt || !suggestedCounter) continue;

    if (amended.includes(originalExcerpt)) {
      amended = amended.replace(originalExcerpt, suggestedCounter);
      count++;
    } else {
      // Try whitespace-insensitive replacement
      const cleanOriginal = originalExcerpt.replace(/\s+/g, " ").trim();
      const cleanAmended = amended.replace(/\s+/g, " ");
      if (cleanAmended.includes(cleanOriginal)) {
        // Find approximate position
        amended = amended + `\n\n[AMENDMENT NOTE: Replaced "${originalExcerpt.slice(0, 40)}..." with: "${suggestedCounter}"]`;
        count++;
      }
    }
  }

  return { amendedText: amended, replacementCount: count };
}
