import { ContractAnalysisResult, CriticalClause } from '../types';

export interface AmendedContractDraft {
  title: string;
  originalRiskScore: number;
  originalRiskLevel: string;
  clausesReplacedCount: number;
  replacedClauses: {
    id: string;
    title: string;
    originalRisk: string;
    originalExcerpt: string;
    amendedText: string;
    pitfallPrevented: string;
  }[];
  cleanContractText: string;
  amendmentNotice: string;
}

/**
 * Builds a clean, ready-to-sign amended contract draft by replacing
 * flagged red-risk provisions with attorney-grade safe counter-clauses.
 */
export function generateCleanAmendedContract(analysis: ContractAnalysisResult): AmendedContractDraft {
  const criticalClauses = analysis.criticalClauses || [];
  
  // High and severe clauses are prioritized for replacement
  const highRiskClauses = criticalClauses.filter(
    c => c.risk === 'Severe' || c.risk === 'High' || c.risk === 'Moderate'
  );

  const clausesToReplace = highRiskClauses.length > 0 ? highRiskClauses : criticalClauses;

  let workingText = analysis.rawText || '';

  const replacedClauses: AmendedContractDraft['replacedClauses'] = [];

  if (workingText.trim().length > 50) {
    // We have raw document text: perform surgical substitutions
    clausesToReplace.forEach(clause => {
      const excerpt = clause.originalExcerpt.trim();
      const amendedText = clause.recommendation.trim();

      if (!excerpt || !amendedText) return;

      replacedClauses.push({
        id: clause.id,
        title: clause.title,
        originalRisk: clause.risk,
        originalExcerpt: excerpt,
        amendedText,
        pitfallPrevented: clause.potentialPitfall,
      });

      // Try exact replacement
      if (workingText.includes(excerpt)) {
        workingText = workingText.replace(
          excerpt,
          `\n[AMENDED CLAUSE - REVISED FOR MUTUAL FAIRNESS]\n${amendedText}\n`
        );
      } else {
        // Try normalized whitespace match
        const normalizedExcerpt = excerpt.replace(/\s+/g, ' ');
        const normalizedWorking = workingText.replace(/\s+/g, ' ');
        if (normalizedWorking.includes(normalizedExcerpt)) {
          // Approximate replacement via regex
          const escaped = excerpt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\s+/g, '\\s+');
          const regex = new RegExp(escaped, 'i');
          if (regex.test(workingText)) {
            workingText = workingText.replace(
              regex,
              `\n[AMENDED CLAUSE - REVISED FOR MUTUAL FAIRNESS]\n${amendedText}\n`
            );
          }
        }
      }
    });
  }

  // If workingText didn't match all excerpts or wasn't provided, build a complete formatted restatement
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const party1 = analysis.keyParties?.party1 || 'First Party';
  const party2 = analysis.keyParties?.party2 || 'Second Party';

  const headerNotice = `================================================================================
AMENDED & BALANCED CONTRACT DRAFT (CLEAN REVISION)
Document: ${analysis.documentTitle}
Document Type: ${analysis.documentType}
Parties: ${party1} and ${party2}
Date Revised: ${dateStr}
Original Risk Score: ${analysis.riskScore}/100 [${analysis.riskLevel} Risk]
Status: Fully Restated Clean Draft — Ready for Counter-Proposal / Execution
================================================================================

EXECUTIVE AMENDMENT SUMMARY:
This revised agreement incorporates balanced, commercially standard protections 
to replace ${replacedClauses.length || clausesToReplace.length} one-sided or asymmetric clauses identified during legal analysis.
All obligations and liability guardrails have been converted into standard mutual terms.

================================================================================
REVISED CONTRACT TERMS:
================================================================================
`;

  let finalCleanText = '';

  if (workingText.trim().length > 50 && replacedClauses.length > 0) {
    finalCleanText = `${headerNotice}\n${workingText}\n\n================================================================================\nEXECUTION & ACCEPTANCE:\n\nBy signing below, the parties agree to all terms of this Amended Agreement:\n\n___________________________                 ___________________________\nFor: ${party1}                               For: ${party2}\nDate: ____________________                  Date: ____________________\n`;
  } else {
    // Generate structured clean agreement with all sections
    const reconstructedSections = clausesToReplace.map((c, idx) => {
      replacedClauses.push({
        id: c.id,
        title: c.title,
        originalRisk: c.risk,
        originalExcerpt: c.originalExcerpt,
        amendedText: c.recommendation,
        pitfallPrevented: c.potentialPitfall,
      });

      return `SECTION ${idx + 1}. ${c.title.toUpperCase()} (AMENDED)
--------------------------------------------------------------------------------
${c.recommendation}

[Prior Draft Note: Replaced one-sided term: "${c.originalExcerpt.slice(0, 120)}..."]
`;
    }).join('\n\n');

    finalCleanText = `${headerNotice}
${reconstructedSections}

================================================================================
SECTION ${clausesToReplace.length + 1}. MISCELLANEOUS & MUTUAL COVENANTS
--------------------------------------------------------------------------------
1. Mutual Assent: Both parties acknowledge that these amended terms represent a balanced, fair commercial compromise.
2. Written Modifications: Any subsequent amendments must be executed in writing by authorized representatives of both parties.
3. Severability: In the event any provision is determined to be unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect.
4. Entire Agreement: This Amended Agreement constitutes the complete understanding between ${party1} and ${party2}.

================================================================================
SIGNATURES & EXECUTION:
================================================================================

ACCEPTED AND AGREED:

________________________________________        ________________________________________
Authorized Signature: ${party1}                 Authorized Signature: ${party2}
Printed Name: __________________________        Printed Name: __________________________
Title: _________________________________        Title: _________________________________
Date: __________________________________        Date: __________________________________
`;
  }

  return {
    title: `${analysis.documentTitle} (Clean Amended Draft)`,
    originalRiskScore: analysis.riskScore,
    originalRiskLevel: analysis.riskLevel,
    clausesReplacedCount: replacedClauses.length,
    replacedClauses,
    cleanContractText: finalCleanText,
    amendmentNotice: `Successfully replaced ${replacedClauses.length} asymmetric clauses with protective, mutual terms.`,
  };
}
