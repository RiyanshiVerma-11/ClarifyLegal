import { describe, it, expect, beforeEach } from "vitest";
import { 
  createMockJWT, 
  generateJudgeDemoUser, 
  getStoredUser, 
  setStoredUser, 
  clearStoredUser 
} from "../src/utils/auth";
import { formatFileSize, sanitizeContractText } from "../src/utils/fileParser";
import { generateCleanAmendedContract } from "../src/utils/amendedContract";
import { LEGAL_GLOSSARY } from "../src/data/glossary";
import { 
  CHALLENGE_TRACK_METADATA, 
  CONTRACT_ANALYSIS_PROMPT_TEMPLATE,
  LIVE_VOICE_SYSTEM_PROMPTS
} from "../src/prompts/legalPrompts";
import { 
  getSavedAnalyses, 
  saveAnalysis, 
  deleteAnalysis, 
  clearSavedAnalyses, 
  getSavedComparisons, 
  saveComparison, 
  deleteComparison, 
  seedBothLeaseAndContractorAnalyses, 
  getPresetSampleAnalysis 
} from "../src/utils/storage";
import { ContractAnalysisResult } from "../src/types";

// In-memory localStorage mock for node test runner
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("ClarifyLegal Utilities & Data Integrity Suite", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Authentication & JWT Utilities", () => {
    it("generates a valid structural 3-part JWT token", () => {
      const payload = { sub: "test-user-123", email: "user@example.com" };
      const token = createMockJWT(payload);

      expect(typeof token).toBe("string");
      const parts = token.split(".");
      expect(parts.length).toBe(3);
    });

    it("creates, stores, retrieves, and clears judge demo user session", () => {
      const demoUser = generateJudgeDemoUser();
      expect(demoUser.role).toBe("Judge / Evaluator");
      expect(demoUser.token).toBeDefined();

      const stored = getStoredUser();
      expect(stored?.email).toBe("evaluator@clarifylegal.ai");
      expect(stored?.token).toBe(demoUser.token);

      clearStoredUser();
      expect(getStoredUser()).toBeNull();
    });
  });

  describe("File Parser Utilities", () => {
    it("formats file sizes correctly across bytes, KB, and MB", () => {
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(2048)).toBe("2.0 KB");
      expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    });

    it("sanitizes messy raw text by trimming and normalizing newlines", () => {
      const raw = "Line 1\r\n\r\n\r\n\r\nLine 2\t\t\twith extra spaces.   ";
      const sanitized = sanitizeContractText(raw);

      expect(sanitized).not.toContain("\r\n");
      expect(sanitized).toContain("Line 1");
      expect(sanitized).toContain("Line 2");
    });
  });

  describe("Amended Contract Generator", () => {
    it("substitutes high-risk clauses with fair mutual amendments", () => {
      const mockContract: ContractAnalysisResult = {
        id: "analysis-test-1",
        documentTitle: "Freelance Designer Contract",
        documentType: "Independent Contractor Agreement",
        summary: "One-sided contractor agreement.",
        riskScore: 78,
        riskLevel: "High",
        analyzedAt: new Date().toISOString(),
        rawText: "Section 1: Company retains sole ownership of all pre-existing design assets in perpetuity.",
        keyParties: {
          party1: "Client Corp",
          party2: "Designer",
          userPerspective: "High vulnerability",
        },
        criticalClauses: [
          {
            id: "clause-1",
            title: "IP Forfeiture",
            originalExcerpt: "Company retains sole ownership of all pre-existing design assets in perpetuity.",
            simplifiedMeaning: "You lose your starter kits.",
            risk: "Severe",
            obligationType: "Your Obligation",
            potentialPitfall: "Loss of tools",
            recommendation: "Designer retains background IP; Client receives license upon payment.",
          }
        ],
        financialTerms: [],
        deadlinesAndMilestones: [],
        missingProtections: [],
        categoryRisks: {
          financialLiability: { score: 50, level: "Moderate", flaggedCount: 0, keyFinding: "Standard" },
          ipRights: { score: 90, level: "Severe", flaggedCount: 1, keyFinding: "IP Trap" },
          termination: { score: 30, level: "Low", flaggedCount: 0, keyFinding: "Standard" },
          hiddenPenalties: { score: 40, level: "Moderate", flaggedCount: 0, keyFinding: "Standard" }
        },
        actionChecklist: []
      };

      const amended = generateCleanAmendedContract(mockContract);

      expect(amended.clausesReplacedCount).toBe(1);
      expect(amended.cleanContractText).toContain("Designer retains background IP");
      expect(amended.amendmentNotice).toBeDefined();
    });
  });

  describe("Legal Knowledge & Prompts Integrity", () => {
    it("contains comprehensive offline legal glossary terms", () => {
      expect(LEGAL_GLOSSARY.length).toBeGreaterThanOrEqual(10);
      const indemnity = LEGAL_GLOSSARY.find(g => g.term.toLowerCase().includes("indemni"));
      expect(indemnity).toBeDefined();
      expect(indemnity?.plainEnglish).toBeDefined();
      expect(indemnity?.category).toBeDefined();
    });

    it("verifies structured prompt builders exist for analysis and comparison", () => {
      expect(CHALLENGE_TRACK_METADATA.track).toContain("Legal Assistance");
      expect(CONTRACT_ANALYSIS_PROMPT_TEMPLATE).toContain("overallRiskScore");
      expect(LIVE_VOICE_SYSTEM_PROMPTS.advisor).toBeDefined();
      expect(LIVE_VOICE_SYSTEM_PROMPTS.sparring_partner).toBeDefined();
    });
  });

  describe("Workspace Storage & Preset Management", () => {
    it("seeds, saves, retrieves, and deletes analyses in local storage", () => {
      const initial = getSavedAnalyses();
      expect(initial).toEqual([]);

      const sampleAnalysis = getPresetSampleAnalysis("lease");
      expect(sampleAnalysis).toBeDefined();
      expect(sampleAnalysis.documentType).toContain("Lease");

      saveAnalysis(sampleAnalysis);
      const retrieved = getSavedAnalyses();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe(sampleAnalysis.id);

      const afterDelete = deleteAnalysis(sampleAnalysis.id);
      expect(afterDelete.length).toBe(0);

      // Seed both demo contracts
      seedBothLeaseAndContractorAnalyses();
      const seeded = getSavedAnalyses();
      expect(seeded.length).toBe(2);

      clearSavedAnalyses();
      expect(getSavedAnalyses().length).toBe(0);
    });

    it("seeds and manages contract comparison records", () => {
      expect(getSavedComparisons()).toEqual([]);

      const mockCompare: any = {
        id: "comp-1",
        docATitle: "Draft A",
        docBTitle: "Draft B",
        comparedAt: new Date().toISOString(),
        overview: "Differences found",
        verdict: "Draft B is safer",
        riskShift: "More Favorable to You",
        clauseComparisons: [],
        keyTakeaways: ["Key takeaway 1"],
      };

      saveComparison(mockCompare);
      const comps = getSavedComparisons();
      expect(comps.length).toBe(1);
      expect(comps[0].id).toBe("comp-1");

      const afterDel = deleteComparison("comp-1");
      expect(afterDel.length).toBe(0);
    });
  });
});
