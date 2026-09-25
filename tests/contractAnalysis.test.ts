import { describe, it, expect } from "vitest";
import {
  classifyRiskLevel,
  calculateContractRiskScore,
  detectPredatoryClauses,
  computeLeverageShift,
  generateAmendedContractText,
} from "../src/services/contractAnalysis";

describe("Contract Analysis & Risk Scoring Engine", () => {
  it("correctly stratifies risk score into legal severity tiers", () => {
    expect(classifyRiskLevel(85)).toBe("Severe");
    expect(classifyRiskLevel(76)).toBe("Severe");
    expect(classifyRiskLevel(65)).toBe("High");
    expect(classifyRiskLevel(51)).toBe("High");
    expect(classifyRiskLevel(40)).toBe("Moderate");
    expect(classifyRiskLevel(26)).toBe("Moderate");
    expect(classifyRiskLevel(15)).toBe("Low");
    expect(classifyRiskLevel(0)).toBe("Low");
  });

  it("calculates weighted risk score based on clause severity distribution", () => {
    const highRiskClauses = [
      { severity: "Severe", riskScore: 90 },
      { severity: "High", riskScore: 75 },
      { severity: "Medium", riskScore: 50 },
    ];
    const score = calculateContractRiskScore(highRiskClauses);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(100);

    const safeClauses = [
      { severity: "Low", riskScore: 10 },
      { severity: "Low", riskScore: 15 },
    ];
    const lowScore = calculateContractRiskScore(safeClauses);
    expect(lowScore).toBeLessThanOrEqual(30);
  });

  it("detects broad-form uncapped indemnification in commercial clauses", () => {
    const clauseText =
      "Tenant shall indemnify, defend and hold harmless Landlord at Tenant's sole cost and expense from all claims regardless of gross negligence.";
    const findings = detectPredatoryClauses(clauseText);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].name).toContain("Indemnification");
    expect(findings[0].severity).toBe("Severe");
  });

  it("detects automatic renewal traps with narrow cancellation windows", () => {
    const renewalText =
      "This lease shall automatic renew for a subsequent term of twelve months unless written notice is received 90 days prior.";
    const findings = detectPredatoryClauses(renewalText);
    expect(findings.some(f => f.name.includes("Automatic Renewal"))).toBe(true);
  });

  it("computes leverage shift accurately across two agreement revisions", () => {
    const favorableShift = computeLeverageShift(80, 50);
    expect(favorableShift.shift).toBe("More Favorable to You");
    expect(favorableShift.delta).toBe(-30);

    const adverseShift = computeLeverageShift(40, 75);
    expect(adverseShift.shift).toBe("More Favorable to Counterparty (High Risk)");
    expect(adverseShift.delta).toBe(35);

    const neutralShift = computeLeverageShift(50, 52);
    expect(neutralShift.shift).toBe("Neutral / Balanced");
  });

  it("surgically substitutes predatory terms with safe counter-clauses", () => {
    const originalContract = "The company retains sole and unlimited ownership of all intellectual property.";
    const replacements = [
      {
        originalExcerpt: "The company retains sole and unlimited ownership of all intellectual property.",
        suggestedCounter: "The company owns deliverables upon final payment; Consultant retains background IP.",
      },
    ];

    const result = generateAmendedContractText(originalContract, replacements);
    expect(result.replacementCount).toBe(1);
    expect(result.amendedText).toContain("Consultant retains background IP");
    expect(result.amendedText).not.toContain("sole and unlimited ownership");
  });
});
