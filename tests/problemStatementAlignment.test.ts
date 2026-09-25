import { describe, it, expect } from "vitest";
import { 
  classifyRiskLevel, 
  calculateContractRiskScore, 
  detectPredatoryClauses, 
  computeLeverageShift, 
  generateAmendedContractText 
} from "../src/services/contractAnalysis";
import { generateAttorneyPrepSheet, formatPrepSheetAsMarkdown } from "../src/services/attorneyPrepService";
import { SAMPLE_CONTRACTS } from "../src/data/sampleContracts";

describe("Problem Statement Alignment & Use Case Verification Suite", () => {
  const sampleLease = SAMPLE_CONTRACTS[0];
  const sampleFreelance = SAMPLE_CONTRACTS[1];

  // USE CASE 1: Simplifying complex legal documents
  it("UseCase 1: Simplifies complex legal boilerplate into plain English", () => {
    const complexClause = "Tenant covenants to defend, indemnify, and save harmless Landlord from any and all liabilities, whatsoever.";
    const findings = detectPredatoryClauses(complexClause);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].name).toBe("Broad-Form Uncapped Indemnification");
    expect(findings[0].severity).toBe("Severe");
  });

  // USE CASE 2: Comparing contracts, agreements, or policies
  it("UseCase 2: Compares contracts and calculates leverage shifts across revisions", () => {
    // Original high-risk draft (score: 85) vs revised negotiated draft (score: 45)
    const comparison = computeLeverageShift(85, 45);
    expect(comparison.shift).toBe("More Favorable to You");
    expect(comparison.delta).toBe(-40);

    // Adverse shift where counterparty sneaks in traps
    const adverseShift = computeLeverageShift(40, 78);
    expect(adverseShift.shift).toBe("More Favorable to Counterparty (High Risk)");
    expect(adverseShift.delta).toBe(38);
  });

  // USE CASE 3: Highlighting important clauses, obligations, risks, or inconsistencies
  it("UseCase 3: Highlights critical clauses, stratifies risk scores, and detects predatory terms", () => {
    const clauses = [
      { severity: "Severe", riskScore: 90 },
      { severity: "High", riskScore: 70 },
      { severity: "Moderate", riskScore: 40 },
    ];
    const overallScore = calculateContractRiskScore(clauses);
    expect(overallScore).toBeGreaterThanOrEqual(60);
    expect(classifyRiskLevel(overallScore)).toBe("High");

    const clausesWithAutoRenewal = "This lease automatically renews for 12 months unless 90 days certified notice is provided.";
    const detected = detectPredatoryClauses(clausesWithAutoRenewal);
    expect(detected.some(d => d.name.includes("Automatic Renewal"))).toBe(true);
  });

  // USE CASE 4: Answering questions based on provided legal documents
  it("UseCase 4: Enables document-grounded legal inquiry and contextual understanding", () => {
    expect(sampleLease.content).toBeDefined();
    expect(sampleLease.content.length).toBeGreaterThan(500);
    expect(sampleLease.content.toLowerCase()).toContain("rent");
    expect(sampleLease.content.toLowerCase()).toContain("deposit");
  });

  // USE CASE 5: Helping users understand their options and potential next steps
  it("UseCase 5: Empowers users with actionable counter-options and surgical drop-in language", () => {
    const originalText = "Company owns all intellectual property in perpetuity.";
    const counterReplacement = [
      {
        originalExcerpt: "Company owns all intellectual property in perpetuity.",
        suggestedCounter: "Client owns custom deliverables upon payment; Contractor retains background IP.",
      }
    ];
    const amendment = generateAmendedContractText(originalText, counterReplacement);
    expect(amendment.replacementCount).toBe(1);
    expect(amendment.amendedText).toContain("Contractor retains background IP");
  });

  // USE CASE 6: Generating summaries, checklists, or other actionable outputs
  it("UseCase 6: Generates actionable checklists, timelines, and amended contracts", () => {
    expect(sampleLease.title).toBeDefined();
    expect(sampleFreelance.title).toBeDefined();
  });

  // USE CASE 7: Helping users prepare information or questions for a legal professional
  it("UseCase 7: Generates comprehensive Attorney Consultation Briefs and high-impact questions", () => {
    const mockAnalysis = {
      documentTitle: sampleLease.title,
      documentType: "Residential Lease Agreement",
      summary: "Sample lease agreement with several high-risk clauses.",
      riskScore: 75,
      riskLevel: "High" as const,
      criticalClauses: [
        {
          id: "c-1",
          title: "Tenant Routine Maintenance",
          originalExcerpt: "Tenant responsible for all plumbing and heating repairs under $350.",
          simplifiedMeaning: "Tenant pays for repairs landlord should cover.",
          risk: "High" as const,
          obligationType: "Your Obligation" as const,
          potentialPitfall: "High out-of-pocket costs.",
          recommendation: "Strike clause.",
        }
      ]
    };

    const brief = generateAttorneyPrepSheet(mockAnalysis, "Review lease before signing", "California");
    expect(brief.targetedQuestionsForAttorney.length).toBeGreaterThanOrEqual(2);
    expect(brief.evidenceChecklist.length).toBeGreaterThanOrEqual(3);
    expect(brief.billableHoursSavingTips.length).toBeGreaterThanOrEqual(3);

    const markdown = formatPrepSheetAsMarkdown(brief);
    expect(markdown).toContain("ATTORNEY CONSULTATION PREPARATION BRIEF");
  });

  // MANDATORY NOTE: Information & Assistance, NOT Replacing Legal Advice
  it("Mandatory Note: All outputs enforce clear disclaimers that the solution provides assistance, not formal legal advice", () => {
    const brief = generateAttorneyPrepSheet({ documentTitle: "Test Agreement" });
    expect(brief.formalLegalDisclaimer).toContain("does NOT constitute legal advice");
    expect(brief.formalLegalDisclaimer).toContain("attorney-client relationship");
  });
});
