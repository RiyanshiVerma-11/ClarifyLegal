import { ContractAnalysisResult, CriticalClause } from "../types";

export interface AttorneyQuestion {
  id: string;
  category: "Enforceability" | "Liability Cap" | "Ambiguity" | "Statutory Rights" | "Negotiation Strategy";
  question: string;
  contextClauseExcerpt: string;
  whyAskThis: string;
  potentialCostSavings: string;
}

export interface AttorneyPrepSheet {
  id: string;
  documentTitle: string;
  documentType: string;
  clientPerspective: string;
  generatedAt: string;
  estimatedConsultationDurationMinutes: number;
  caseBrief: {
    clientObjective: string;
    summaryOfExposure: string;
    governingLawOrJurisdiction: string;
    overallRiskTier: "Low" | "Moderate" | "High" | "Severe";
  };
  priorityIssuesForCounsel: Array<{
    title: string;
    severity: "Low" | "Moderate" | "High" | "Severe";
    excerpt: string;
    identifiedRisk: string;
    suggestedAttorneyAction: string;
  }>;
  targetedQuestionsForAttorney: AttorneyQuestion[];
  evidenceChecklist: string[];
  billableHoursSavingTips: string[];
  formalLegalDisclaimer: string;
}

/**
 * Generates an attorney consultation prep sheet from an analyzed contract
 * Formats information systematically to minimize billable attorney hours.
 */
export function generateAttorneyPrepSheet(
  analysis: Partial<ContractAnalysisResult>,
  clientObjective: string = "Review contract before signing and remove high-risk one-sided provisions",
  jurisdiction: string = "Standard Commercial / Local State Law"
): AttorneyPrepSheet {
  const clauses = analysis.criticalClauses || [];
  const highRiskClauses = clauses.filter(c => c.risk === "Severe" || c.risk === "High");
  const targetClauses = highRiskClauses.length > 0 ? highRiskClauses : clauses.slice(0, 3);

  const targetedQuestions: AttorneyQuestion[] = targetClauses.map((clause, idx) => {
    let category: AttorneyQuestion["category"] = "Liability Cap";
    let question = `Is this ${clause.title.toLowerCase()} clause enforceable under current law?`;
    let whyAsk = `Identified potential pitfall: ${clause.potentialPitfall || "Asymmetrical risk for client"}`;
    let savings = "Saves 15-30 minutes of attorney research time by pointing directly to clause text.";

    if (clause.title.toLowerCase().includes("indemnif") || clause.title.toLowerCase().includes("liab")) {
      category = "Liability Cap";
      question = "Can we enforce an aggregate liability cap equal to fees paid, or is this uncapped indemnity enforceable?";
      whyAsk = "Uncapped indemnification exposes the client to catastrophic third-party damages.";
      savings = "Directly clarifies commercial risk parameters in the first 5 minutes of consultation.";
    } else if (clause.title.toLowerCase().includes("renew") || clause.title.toLowerCase().includes("terminat")) {
      category = "Statutory Rights";
      question = "Does state statute require specific advance notice before automatic renewal clauses can trigger?";
      whyAsk = "Automatic renewal provisions often face statutory restrictions in consumer/tenant contracts.";
      savings = "Avoids costly dispute litigation upon lease/contract termination.";
    } else if (clause.title.toLowerCase().includes("ip") || clause.title.toLowerCase().includes("property")) {
      category = "Ambiguity";
      question = "Does the assignment language inadvertently encompass my pre-existing background intellectual property or tools?";
      whyAsk = "Broad IP assignment clauses can cause inadvertent forfeiture of proprietary tools.";
      savings = "Protects core client business assets without extensive title drafting.";
    }

    return {
      id: `q-${idx + 1}`,
      category,
      question,
      contextClauseExcerpt: clause.originalExcerpt || clause.simplifiedMeaning,
      whyAskThis: whyAsk,
      potentialCostSavings: savings,
    };
  });

  // Always ensure at least 3 high-impact questions
  if (targetedQuestions.length < 3) {
    targetedQuestions.push({
      id: "q-default-1",
      category: "Enforceability",
      question: "Are there any provisions in this agreement that are void or unconscionable under governing law?",
      contextClauseExcerpt: "General contract boilerplate and arbitration clauses",
      whyAskThis: "Identifies whether one-sided terms can be legally struck down without lengthy negotiation.",
      potentialCostSavings: "Quickly narrows focus to valid, actionable terms.",
    });
    targetedQuestions.push({
      id: "q-default-2",
      category: "Negotiation Strategy",
      question: "What specific alternative language would you recommend proposing to balance this agreement?",
      contextClauseExcerpt: "Remedies and dispute resolution section",
      whyAskThis: "Secures attorney-drafted counter language ready for counterparty submission.",
      potentialCostSavings: "Direct drop-in language prevents multiple back-and-forth drafting cycles.",
    });
  }

  const priorityIssues = targetClauses.map(clause => ({
    title: clause.title,
    severity: (clause.risk as any) || "High",
    excerpt: clause.originalExcerpt || clause.simplifiedMeaning,
    identifiedRisk: clause.potentialPitfall || clause.simplifiedMeaning,
    suggestedAttorneyAction: clause.recommendation || "Request striking or substituting with mutual standard terms.",
  }));

  return {
    id: `prep-${Date.now()}`,
    documentTitle: analysis.documentTitle || "Legal Agreement",
    documentType: analysis.documentType || "Commercial Contract",
    clientPerspective: (analysis.keyParties as any)?.userPerspective || "Signer / Client",
    generatedAt: new Date().toISOString(),
    estimatedConsultationDurationMinutes: 30, // Targeted brief saves 30-60 mins of discovery time
    caseBrief: {
      clientObjective,
      summaryOfExposure: analysis.summary || "Client is seeking legal advice to identify and remediate asymmetric legal and financial risks prior to execution.",
      governingLawOrJurisdiction: jurisdiction,
      overallRiskTier: (analysis.riskLevel as any) || "High",
    },
    priorityIssuesForCounsel: priorityIssues,
    targetedQuestionsForAttorney: targetedQuestions,
    evidenceChecklist: [
      "Original un-executed contract draft (.pdf or printed copy)",
      "All prior written correspondence (email chains, term sheets, promises made by counterparty)",
      "Any exhibits, fee schedules, or referenced external policies",
      "List of pre-existing intellectual property, inventory, or security deposits involved",
      "Timestamped move-in photos/video (if residential tenancy)",
    ],
    billableHoursSavingTips: [
      "Send this 1-page Brief to your attorney 24 hours ahead of your consultation so they read it beforehand.",
      "Jump straight to the 'Targeted Questions' section during the first 5 minutes rather than reading the entire contract aloud.",
      "Ask your attorney to mark up the 'Suggested Drop-in Counter-Language' directly.",
      "Clarify their billing increment (e.g. 6-minute tenths of an hour) and keep conversations focused strictly on the 3 priority issues."
    ],
    formalLegalDisclaimer: "IMPORTANT NOTICE: This Attorney Consultation Prep Sheet is an educational information preparation tool generated by ClarifyLegal AI. It is designed to assist users in organizing facts, identifying potential issues, and framing questions for a licensed attorney. It does NOT constitute legal advice, legal representation, or the creation of an attorney-client relationship. Always consult a licensed attorney in your jurisdiction for legal advice tailored to your specific circumstances.",
  };
}

/**
 * Converts the prep sheet into formatted Markdown ready for copy/print
 */
export function formatPrepSheetAsMarkdown(sheet: AttorneyPrepSheet): string {
  return `# ATTORNEY CONSULTATION PREPARATION BRIEF
**Document**: ${sheet.documentTitle} (${sheet.documentType})
**Generated via ClarifyLegal**: ${new Date(sheet.generatedAt).toLocaleDateString()}
**Estimated Consultation Optimization**: Saves ~30-45 minutes in discovery billing

---

## 1. CLIENT OBJECTIVES & CASE SUMMARY
- **Primary Objective**: ${sheet.caseBrief.clientObjective}
- **Client Perspective / Role**: ${sheet.clientPerspective}
- **Governing Law / Jurisdiction**: ${sheet.caseBrief.governingLawOrJurisdiction}
- **Overall Forensic Risk Tier**: ${sheet.caseBrief.overallRiskTier}

### Summary of Exposure
${sheet.caseBrief.summaryOfExposure}

---

## 2. TOP TARGETED QUESTIONS FOR YOUR ATTORNEY
*(Ask these directly during your consultation to maximize billable efficiency)*

${sheet.targetedQuestionsForAttorney.map((q, idx) => `### Question ${idx + 1}: ${q.question}
- **Category**: ${q.category}
- **Clause Excerpt**: "${q.contextClauseExcerpt}"
- **Why This Matters**: ${q.whyAskThis}
- **Efficiency Value**: ${q.potentialCostSavings}
`).join("\n")}

---

## 3. PRIORITY CLAUSES FOR COUNSEL REVIEW
${sheet.priorityIssuesForCounsel.map((issue, idx) => `### Issue ${idx + 1}: ${issue.title} [Severity: ${issue.severity}]
- **Excerpt**: "${issue.excerpt}"
- **Identified Risk**: ${issue.identifiedRisk}
- **Proposed Counter-Direction**: ${issue.suggestedAttorneyAction}
`).join("\n")}

---

## 4. WHAT TO BRING TO YOUR CONSULTATION (EVIDENCE CHECKLIST)
${sheet.evidenceChecklist.map(item => `- [ ] ${item}`).join("\n")}

---

## 5. BILLABLE HOUR REDUCTION STRATEGIES
${sheet.billableHoursSavingTips.map(tip => `- 💡 ${tip}`).join("\n")}

---

### ETHICAL LEGAL DISCLAIMER
> ${sheet.formalLegalDisclaimer}
`;
}
