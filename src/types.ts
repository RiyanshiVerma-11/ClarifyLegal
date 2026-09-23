export type DocumentRiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface CriticalClause {
  id: string;
  title: string;
  originalExcerpt: string;
  simplifiedMeaning: string;
  risk: DocumentRiskLevel;
  obligationType: 'Your Obligation' | 'Your Right' | 'Counterparty Right' | 'Shared Obligation';
  potentialPitfall: string;
  recommendation: string;
}

export interface FinancialTerm {
  item: string;
  amountOrFormula: string;
  condition: string;
  isUnusualOrAggressive: boolean;
}

export interface DeadlineMilestone {
  event: string;
  timeline: string;
  consequenceIfMissed: string;
}

export interface ActionChecklistItem {
  id: string;
  action: string;
  priority: 'urgent' | 'recommended' | 'optional';
  explanation: string;
  completed?: boolean;
}

export interface CategoryRiskItem {
  score: number; // 0 - 100
  level: DocumentRiskLevel;
  flaggedCount: number;
  keyFinding: string;
}

export interface CategoryRiskBreakdown {
  financialLiability: CategoryRiskItem;
  ipRights: CategoryRiskItem;
  termination: CategoryRiskItem;
  hiddenPenalties: CategoryRiskItem;
}

export type CounterProposalTone = 'Diplomatic' | 'Firm' | 'Collaborative';

export interface ContractAnalysisResult {
  id: string;
  documentTitle: string;
  documentType: string;
  analyzedAt: string;
  summary: string;
  riskScore: number; // 0 - 100
  riskLevel: DocumentRiskLevel;
  keyParties: {
    party1: string;
    party2: string;
    userPerspective: string;
  };
  criticalClauses: CriticalClause[];
  financialTerms: FinancialTerm[];
  deadlinesAndMilestones: DeadlineMilestone[];
  missingProtections: string[];
  actionChecklist: ActionChecklistItem[];
  rawText?: string;
  categoryRisks?: CategoryRiskBreakdown;
}

export interface ClauseComparisonItem {
  clauseTopic: string;
  docAText: string;
  docBText: string;
  changeType: 'added' | 'removed' | 'modified' | 'identical';
  significance: 'high' | 'medium' | 'low';
  impact: string;
  recommendation: string;
}

export interface DocumentComparisonResult {
  id: string;
  docATitle: string;
  docBTitle: string;
  comparedAt: string;
  overview: string;
  verdict: string;
  riskShift: 'More Favorable to You' | 'Equal/Neutral' | 'More Risky for You';
  clauseComparisons: ClauseComparisonItem[];
  keyTakeaways: string[];
}

export interface DecodedClauseResult {
  plainEnglish: string;
  riskAssessment: string;
  riskLevel: DocumentRiskLevel;
  redFlags: string[];
  fairAlternative: string;
  questionsToAsk: string[];
}

export interface GlossaryTerm {
  term: string;
  pronunciation?: string;
  category: 'Contract Basics' | 'Liability & Risk' | 'Dispute Resolution' | 'Real Estate' | 'Employment & IP';
  definition: string;
  plainEnglish: string;
  realWorldExample: string;
  watchOutFor: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedQuestions?: string[];
  actionChecklist?: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Judge / Evaluator' | 'Pro Member' | 'Guest';
  token: string;
  createdAt: string;
}

export interface CounterpartySimulationResult {
  counterpartyPersona: string;
  scenarioTitle: string;
  counterpartyStance: 'Strict Resistance' | 'Conditional Pushback' | 'Open to Compromise';
  simulatedResponseEmail: string;
  coreObjections: string[];
  underlyingMotivation: string;
  rebuttalStrategy: string;
  winningRebuttalScript: string;
  concessionLikelihood: string;
  keyLeveragePoints: string[];
}

export type ActiveTab = 
  | 'landing'
  | 'dashboard'
  | 'analyzer'
  | 'compare'
  | 'decoder'
  | 'playbook'
  | 'navigator'
  | 'chatbot'
  | 'voice';

export interface ChatbotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  rolePreset?: 'complex' | 'general' | 'fast';
}

export type ChatbotRolePreset = 'complex' | 'general' | 'fast';

export interface LiveVoiceTranscriptItem {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}
