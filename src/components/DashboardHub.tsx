import React from 'react';
import { 
  FileText, 
  GitCompare, 
  BookOpen, 
  CheckSquare, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Bot,
  Mic,
  Radio,
  Zap
} from 'lucide-react';
import { ActiveTab, ContractAnalysisResult } from '../types';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

interface DashboardHubProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSample: (sampleId: string) => void;
  recentAnalyses: ContractAnalysisResult[];
  onOpenAnalysis: (analysis: ContractAnalysisResult) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({
  setActiveTab,
  onSelectSample,
  recentAnalyses,
  onOpenAnalysis,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner - Compact & Focused */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GenAI Legal Intelligence Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Welcome to ClarifyLegal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Legal contracts are written by lawyers for lawyers. ClarifyLegal translates dense legalese into plain English, uncovers hidden liabilities, and generates attorney-grade counter-proposals in seconds.
          </p>
        </div>
      </div>

      {/* Interactive AI Studios: Chatbot & Live Voice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gemini Chatbot Feature Card */}
        <div 
          onClick={() => setActiveTab('chatbot')}
          className="group relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-white border border-indigo-200/90 hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold">
                Multi-Turn • Pro & Flash
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center justify-between">
              <span>Gemini Legal Chatbot</span>
              <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-turn interactive advisor with role-based system instructions: Complex Reasoning (Gemini Pro), General Tasks (3.5 Flash), and Rapid Clause Checks (Flash-Lite).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
            <span>Open Interactive Chatbot &rarr;</span>
            <span className="text-[11px] font-normal text-slate-500">Context-aware</span>
          </div>
        </div>

        {/* Gemini 3.8 Live Voice Studio Feature Card */}
        <div 
          onClick={() => setActiveTab('voice')}
          className="group relative overflow-hidden bg-gradient-to-br from-teal-50/70 via-white to-white border border-teal-200/90 hover:border-teal-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 border border-teal-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 font-semibold flex items-center space-x-1">
                <Radio className="w-2.5 h-2.5 text-teal-600 animate-pulse" />
                <span>Live API • 3.8 Live</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center justify-between">
              <span>Voice Live Assistant</span>
              <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time spoken conversations with model <code className="text-teal-700 font-mono font-semibold">gemini-3.8-live</code>. Practice negotiations, ask contract questions aloud, and listen to natural synthetic voice responses.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-600 group-hover:text-teal-800">
            <span>Launch Live Voice Studio &rarr;</span>
            <span className="text-[11px] font-normal text-slate-500">Low-latency</span>
          </div>
        </div>
      </div>

      {/* Core Workflow Cards (4 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div 
          onClick={() => setActiveTab('analyzer')}
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Contract Analyzer</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload any agreement. Receive executive summaries, 0-100 risk score, financial commitments, and missing safeguards.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] text-indigo-600 font-semibold">
            Summarize & Score &rarr;
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => setActiveTab('compare')}
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Document Compare</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Side-by-side diff between v1 and v2 or standard vs vendor terms. Discover which party gains legal leverage.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] text-blue-600 font-semibold">
            Compare Versions &rarr;
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => setActiveTab('decoder')}
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Jargon Decoder</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Translate confusing clauses into 5th-grade English and search our plain-language glossary of common legal traps.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] text-amber-600 font-semibold">
            Translate Legalese &rarr;
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => setActiveTab('playbook')}
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Action Playbook</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Draft diplomatic counter-proposal emails with redlined text, actionable checklists, and attorney questions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] text-emerald-600 font-semibold">
            Draft Counter-Proposal &rarr;
          </div>
        </div>
      </div>

      {/* Instant 1-Click Samples Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>1-Click Real-World Contract Samples</span>
            </h2>
            <p className="text-xs text-slate-500">
              Test ClarifyLegal immediately with curated contracts containing common real-world traps.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Ready to Analyze
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_CONTRACTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider group-hover:bg-indigo-100">
                    {sample.category}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    sample.riskExpectation === 'High' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {sample.riskExpectation} Risk
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 mb-1">{sample.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSample(sample.id);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instant 1-Click Analysis</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Recent Analyses & Legal Literacy Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Analyses (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Your Recent Analyses</h3>
            </div>
            {recentAnalyses.length > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                {recentAnalyses.length} Saved in Session
              </span>
            )}
          </div>

          {recentAnalyses.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700">No documents analyzed yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Try one of our 1-click samples above or paste your own rental lease, freelance contract, or terms of service.
              </p>
              <button
                onClick={() => {
                  onSelectSample('residential-lease');
                  setActiveTab('analyzer');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Analyze Residential Lease Demo &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onOpenAnalysis(item);
                    setActiveTab('analyzer');
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.documentTitle}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.riskLevel === 'High' || item.riskLevel === 'Severe'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.riskLevel === 'Moderate'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        Score: {item.riskScore} • {item.riskLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.documentType} • {new Date(item.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 flex items-center gap-1">
                    <span>View Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Legal Trap Spotlight */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Legal Trap Spotlight</span>
            </div>

            <h3 className="text-base font-bold text-white leading-snug">
              Beware the "Uncapped Indemnification" Clause
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              When a client or landlord inserts broad indemnification, you might agree to pay for their legal defense in lawsuits brought by strangers—even if you had nothing to do with the issue.
            </p>

            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-200 space-y-1.5">
              <div className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Actionable Redline Fix:</span>
              </div>
              <p className="italic text-slate-300">
                "Liability under this section shall be strictly limited to direct damages and capped at total fees paid under this Agreement."
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('decoder')}
              className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse All 12 Jargon Decoders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
