import { describe, it, expect } from "vitest";
import { 
  generateAttorneyPrepSheet, 
  formatPrepSheetAsMarkdown 
} from "../src/services/attorneyPrepService";
import { ContractAnalysisResult } from "../src/types";

describe("Attorney Consultation Preparation Sheet Generator", () => {
  const mockAnalysis: Partial<ContractAnalysisResult> = {
    documentTitle: "Commercial Office Lease",
    documentType: "Commercial Lease",
    summary: "A 3-year commercial lease with uncapped tenant indemnification and immediate landlord forfeiture rights.",
    riskScore: 82,
    riskLevel: "Severe",
    keyParties: {
      party1: "Metropolitan Towers LLC",
      party2: "BrightByte Software Inc.",
      userPerspective: "Signer / Tenant bearing structural repair liabilities",
    },
    criticalClauses: [
      {
        id: "c-1",
        title: "Uncapped Broad-Form Indemnification",
        originalExcerpt: "Tenant indemnifies Landlord against all claims without limit.",
        simplifiedMeaning: "You pay for all lawsuits against the landlord even if not your fault.",
        risk: "Severe",
        obligationType: "Your Obligation",
        potentialPitfall: "Catastrophic exposure from third-party accidents.",
        recommendation: "Cap indemnification at insurance coverage or 1 year rent.",
      },
      {
        id: "c-2",
        title: "Immediate Right of Re-Entry Without Notice",
        originalExcerpt: "Landlord may re-enter and terminate tenancy immediately upon any covenant breach.",
        simplifiedMeaning: "Landlord can kick you out without giving you time to fix minor errors.",
        risk: "High",
        obligationType: "Counterparty Right",
        potentialPitfall: "Loss of premises without opportunity to cure.",
        recommendation: "Demand mandatory 30-day written notice and cure window.",
      }
    ],
  };

  it("generates a structured attorney consultation prep brief", () => {
    const sheet = generateAttorneyPrepSheet(
      mockAnalysis, 
      "Cap liability and secure standard 30-day cure period", 
      "New York Commercial Law"
    );

    expect(sheet.id).toBeDefined();
    expect(sheet.documentTitle).toBe("Commercial Office Lease");
    expect(sheet.caseBrief.clientObjective).toContain("Cap liability");
    expect(sheet.caseBrief.governingLawOrJurisdiction).toBe("New York Commercial Law");
    expect(sheet.caseBrief.overallRiskTier).toBe("Severe");
    expect(sheet.priorityIssuesForCounsel.length).toBe(2);
    expect(sheet.targetedQuestionsForAttorney.length).toBeGreaterThanOrEqual(2);
  });

  it("includes high-impact targeted questions specifically tailored to clause risk categories", () => {
    const sheet = generateAttorneyPrepSheet(mockAnalysis);
    const questions = sheet.targetedQuestionsForAttorney;

    const liabilityQuestion = questions.find(q => q.category === "Liability Cap");
    expect(liabilityQuestion).toBeDefined();
    expect(liabilityQuestion?.question).toContain("liability cap");
    expect(liabilityQuestion?.whyAskThis).toBeDefined();
    expect(liabilityQuestion?.potentialCostSavings).toBeDefined();
  });

  it("includes comprehensive evidence checklist and billable hours saving strategies", () => {
    const sheet = generateAttorneyPrepSheet(mockAnalysis);

    expect(sheet.evidenceChecklist.length).toBeGreaterThanOrEqual(4);
    expect(sheet.billableHoursSavingTips.length).toBeGreaterThanOrEqual(3);
    expect(sheet.billableHoursSavingTips.some(t => t.includes("6-minute"))).toBe(true);
  });

  it("strictly enforces ethical legal disclaimers distinguishing informational tools from legal advice", () => {
    const sheet = generateAttorneyPrepSheet(mockAnalysis);

    expect(sheet.formalLegalDisclaimer).toContain("does NOT constitute legal advice");
    expect(sheet.formalLegalDisclaimer).toContain("attorney-client relationship");
  });

  it("formats the brief into clean, attorney-ready Markdown", () => {
    const sheet = generateAttorneyPrepSheet(mockAnalysis);
    const markdown = formatPrepSheetAsMarkdown(sheet);

    expect(markdown).toContain("# ATTORNEY CONSULTATION PREPARATION BRIEF");
    expect(markdown).toContain("CLIENT OBJECTIVES & CASE SUMMARY");
    expect(markdown).toContain("TOP TARGETED QUESTIONS FOR YOUR ATTORNEY");
    expect(markdown).toContain("EVIDENCE CHECKLIST");
    expect(markdown).toContain("ETHICAL LEGAL DISCLAIMER");
  });
});
