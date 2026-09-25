import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LandingNavbar } from './components/LandingNavbar';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { LegalDisclaimerModal } from './components/LegalDisclaimerModal';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';

// High-Efficiency Code-Splitting with Dynamic Lazy Loading
const DashboardHub = lazy(() => import('./components/DashboardHub').then(m => ({ default: m.DashboardHub })));
const DocumentAnalyzer = lazy(() => import('./components/DocumentAnalyzer').then(m => ({ default: m.DocumentAnalyzer })));
const DocumentCompare = lazy(() => import('./components/DocumentCompare').then(m => ({ default: m.DocumentCompare })));
const JargonDecoder = lazy(() => import('./components/JargonDecoder').then(m => ({ default: m.JargonDecoder })));
const ActionPlaybook = lazy(() => import('./components/ActionPlaybook').then(m => ({ default: m.ActionPlaybook })));
const LegalNavigator = lazy(() => import('./components/LegalNavigator').then(m => ({ default: m.LegalNavigator })));
const GeminiChatbot = lazy(() => import('./components/GeminiChatbot').then(m => ({ default: m.GeminiChatbot })));
const VoiceLiveAssistant = lazy(() => import('./components/VoiceLiveAssistant').then(m => ({ default: m.VoiceLiveAssistant })));
import { 
  ActiveTab, 
  AuthUser,
  ContractAnalysisResult, 
  DocumentComparisonResult, 
  CriticalClause, 
  DecodedClauseResult 
} from './types';
import { 
  getSavedAnalyses, 
  saveAnalysis, 
  getSavedComparisons, 
  saveComparison,
  seedDemoAnalysesIfEmpty,
  seedBothLeaseAndContractorAnalyses,
  getPresetSampleAnalysis
} from './utils/storage';
import { 
  getStoredUser, 
  clearStoredUser, 
  generateJudgeDemoUser 
} from './utils/auth';
import { SAMPLE_CONTRACTS } from './data/sampleContracts';
import { Scale, ShieldCheck } from 'lucide-react';

export default function App() {
  // Auth state: check localStorage for existing JWT user session
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [disclaimerModalOpen, setDisclaimerModalOpen] = useState(false);

  // Workspace tab router (dashboard is the primary default when authenticated)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Analysis and comparison state
  const [currentAnalysis, setCurrentAnalysis] = useState<ContractAnalysisResult | null>(null);
  const [currentComparison, setCurrentComparison] = useState<DocumentComparisonResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<ContractAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [prefilledPlaybookClause, setPrefilledPlaybookClause] = useState<CriticalClause | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize saved analyses from localStorage on mount
  useEffect(() => {
    seedDemoAnalysesIfEmpty();
    const saved = getSavedAnalyses();
    setRecentAnalyses(saved);
    if (saved.length > 0 && !currentAnalysis) {
      setCurrentAnalysis(saved[0]);
    }
  }, []);

  // Authentication Handlers
  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
    seedDemoAnalysesIfEmpty();
    const saved = getSavedAnalyses();
    setRecentAnalyses(saved);
    if (saved.length > 0 && !currentAnalysis) {
      setCurrentAnalysis(saved[0]);
    }
    setActiveTab('dashboard');
  };

  const handleJudgeDemoLogin = () => {
    const judgeUser = generateJudgeDemoUser();
    setUser(judgeUser);
    setAuthModalOpen(false);
    seedBothLeaseAndContractorAnalyses();
    const saved = getSavedAnalyses();
    setRecentAnalyses(saved);
    if (saved.length > 0) {
      setCurrentAnalysis(saved[0]);
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    setActiveTab('dashboard');
  };

  // Handler to analyze a contract via backend API
  const handleAnalyzeContract = async (text: string, title: string, perspective: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({
          documentText: text,
          documentTitle: title,
          userPerspective: perspective,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      const analysis: ContractAnalysisResult = data.analysis || (data.summary ? data : null);
      if (analysis) {
        setCurrentAnalysis(analysis);
        saveAnalysis(analysis);
        setRecentAnalyses(getSavedAnalyses());
        setActiveTab('analyzer');
      } else {
        throw new Error(data.message || data.error || 'Failed to analyze contract.');
      }
    } catch (err: any) {
      console.error('Contract analysis error:', err);
      setErrorMessage(err.message || 'An error occurred while analyzing the document.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler to compare two documents via backend API
  const handleCompareContracts = async (
    docA: { title: string; content: string },
    docB: { title: string; content: string }
  ) => {
    setIsComparing(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/compare-documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({ docA, docB }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      const comparison: DocumentComparisonResult = data.comparison || (data.overview || data.clauseComparisons ? data : null);
      if (comparison) {
        setCurrentComparison(comparison);
        saveComparison(comparison);
        setActiveTab('compare');
      } else {
        throw new Error(data.message || data.error || 'Failed to compare documents.');
      }
    } catch (err: any) {
      console.error('Document comparison error:', err);
      setErrorMessage(err.message || 'An error occurred while comparing the documents.');
    } finally {
      setIsComparing(false);
    }
  };

  // Handler to decode a legal clause via backend API
  const handleDecodeClause = async (clauseText: string): Promise<DecodedClauseResult> => {
    const response = await fetch('/api/decode-jargon', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user?.token ? `Bearer ${user.token}` : ''
      },
      body: JSON.stringify({ clauseText }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    const decoded: DecodedClauseResult = data.decoded || (data.plainEnglish ? data : null);
    if (decoded) {
      return decoded;
    }
    throw new Error(data.message || data.error || 'Failed to decode clause.');
  };

  // Handler to generate a counter-proposal / negotiation email
  const handleGenerateCounterProposal = async (params: {
    originalClause: string;
    issueIdentified: string;
    desiredOutcome: string;
    recipientRole: string;
    tone?: 'Diplomatic' | 'Firm' | 'Collaborative';
  }) => {
    const response = await fetch('/api/generate-counter-proposal', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user?.token ? `Bearer ${user.token}` : ''
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  };

  // Handler to ask legal navigator Q&A
  const handleAskNavigator = async (
    question: string,
    context?: string
  ): Promise<{
    content: string;
    suggestedQuestions?: string[];
    actionChecklist?: string[];
  }> => {
    const response = await fetch('/api/ask-navigator', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': user?.token ? `Bearer ${user.token}` : ''
      },
      body: JSON.stringify({
        question,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  };

  // Helper when selecting a sample template
  const handleSelectSample = (sampleId: string) => {
    const preset = getPresetSampleAnalysis(sampleId);
    if (preset) {
      setCurrentAnalysis(preset);
      saveAnalysis(preset);
      setRecentAnalyses(getSavedAnalyses());
      setActiveTab('analyzer');
      return;
    }
    const sample = SAMPLE_CONTRACTS.find((s) => s.id === sampleId);
    if (sample) {
      setActiveTab('analyzer');
      handleAnalyzeContract(sample.content, sample.title, 'Self / Signer');
    }
  };

  // Helper to prefill a clause into the Action Playbook
  const handleSelectClauseForPlaybook = (clause: CriticalClause) => {
    setPrefilledPlaybookClause(clause);
    setActiveTab('playbook');
  };

  // -------------------------------------------------------------
  // VIEW 1: PUBLIC / UNAUTHENTICATED LANDING PAGE
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
        <LandingNavbar
          onOpenAuth={handleOpenAuth}
          onJudgeDemoLogin={handleJudgeDemoLogin}
        />

        <main className="flex-1">
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onJudgeDemoLogin={handleJudgeDemoLogin}
          />
        </main>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUTHENTICATED WORKSPACE (PROTECTED BEHIND JWT)
  // Modern SaaS Left Sidebar + Minimalist Top Header
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Accessibility: Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none text-xs font-bold"
      >
        Skip to main content
      </a>

      {/* Sleek Vertical Left Sidebar */}
      <WorkspaceSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onOpenDisclaimer={() => setDisclaimerModalOpen(true)}
      />

      {/* Main Workspace Content Area (Permanently offset by w-64 on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Minimalist Top Header */}
        <WorkspaceHeader
          activeTab={activeTab}
          user={user}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenDisclaimer={() => setDisclaimerModalOpen(true)}
        />

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-3 text-xs flex items-center justify-between" role="alert">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-900 font-bold ml-4 cursor-pointer"
                aria-label="Dismiss error notification"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Router with Dynamic Code-Splitting Suspense */}
        <main 
          id="main-content" 
          tabIndex={-1} 
          role="main" 
          aria-label="ClarifyLegal Document & Negotiation Workspace"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto focus:outline-none"
        >
          <Suspense fallback={
            <div className="w-full py-20 flex flex-col items-center justify-center space-y-3" role="status" aria-live="polite">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500">Loading ClarifyLegal workspace view...</span>
            </div>
          }>
            {activeTab === 'dashboard' && (
              <DashboardHub
                setActiveTab={setActiveTab}
                onSelectSample={handleSelectSample}
                recentAnalyses={recentAnalyses}
                onOpenAnalysis={(item) => {
                  setCurrentAnalysis(item);
                  setActiveTab('analyzer');
                }}
              />
            )}

            {activeTab === 'analyzer' && (
              <DocumentAnalyzer
                currentAnalysis={currentAnalysis}
                onAnalyze={handleAnalyzeContract}
                isLoading={isAnalyzing}
                onReset={() => setCurrentAnalysis(null)}
                onSelectForPlaybook={handleSelectClauseForPlaybook}
              />
            )}

            {activeTab === 'compare' && (
              <DocumentCompare
                currentComparison={currentComparison}
                onCompare={handleCompareContracts}
                isLoading={isComparing}
                onReset={() => setCurrentComparison(null)}
              />
            )}

            {activeTab === 'decoder' && (
              <JargonDecoder onDecodeClause={handleDecodeClause} />
            )}

            {activeTab === 'playbook' && (
              <ActionPlaybook
                currentAnalysis={currentAnalysis}
                prefilledClause={prefilledPlaybookClause}
                onClearPrefill={() => setPrefilledPlaybookClause(null)}
                onGenerateCounterProposal={handleGenerateCounterProposal}
              />
            )}

            {activeTab === 'chatbot' && (
              <GeminiChatbot
                currentAnalysis={currentAnalysis}
                onNavigateToAnalyzer={() => setActiveTab('analyzer')}
              />
            )}

            {activeTab === 'voice' && (
              <VoiceLiveAssistant
                currentAnalysis={currentAnalysis}
              />
            )}

            {activeTab === 'navigator' && (
              <LegalNavigator
                onAskQuestion={handleAskNavigator}
                currentDocumentContext={
                  currentAnalysis
                    ? `Current Document: ${currentAnalysis.documentTitle}\nRisk Score: ${currentAnalysis.riskScore}/100\nSummary: ${currentAnalysis.summary.slice(0, 400)}`
                    : undefined
                }
              />
            )}
          </Suspense>
        </main>

        {/* Clean Minimalist Workspace Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-8 text-slate-500 text-xs mt-auto print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">ClarifyLegal Workspace</span>
              <span>• GenAI Legal Literacy & Risk Analysis</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button
                onClick={() => setDisclaimerModalOpen(true)}
                className="hover:text-slate-700 transition-colors cursor-pointer underline decoration-slate-300"
              >
                Educational Disclaimer
              </button>
              <span>•</span>
              <span>Session: {user.role}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Legal Disclaimer Modal */}
      <LegalDisclaimerModal
        isOpen={disclaimerModalOpen}
        onClose={() => setDisclaimerModalOpen(false)}
      />
    </div>
  );
}
