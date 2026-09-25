import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  HelpCircle, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  ShieldAlert, 
  DollarSign, 
  CheckSquare, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ContractAnalysisResult } from '../types';
import { 
  generateAttorneyPrepSheet, 
  formatPrepSheetAsMarkdown, 
  AttorneyPrepSheet 
} from '../services/attorneyPrepService';

interface AttorneyPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ContractAnalysisResult;
}

export const AttorneyPrepModal: React.FC<AttorneyPrepModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const [objective, setObjective] = useState(
    'Identify severe liabilities, cap indemnities, and negotiate fair notice/cure periods before signing'
  );
  const [jurisdiction, setJurisdiction] = useState('Standard State / Commercial Law');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'brief' | 'questions' | 'evidence' | 'preview'>('brief');

  if (!isOpen) return null;

  const prepSheet: AttorneyPrepSheet = generateAttorneyPrepSheet(analysis, objective, jurisdiction);
  const markdownContent = formatPrepSheetAsMarkdown(prepSheet);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.documentTitle.replace(/\s+/g, '_')}_Attorney_Prep_Sheet.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attorney-prep-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="attorney-prep-title" className="text-xl font-bold">
                  Attorney Consultation Prep Sheet
                </h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                  Saves ~45 Min Billable Time
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Organize your case facts, priority risks, and high-impact questions before meeting legal counsel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-indigo-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex gap-2">
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'brief'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            1. Case Brief & Objectives
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'questions'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            2. Top Questions to Ask ({prepSheet.targetedQuestionsForAttorney.length})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            3. Evidence Checklist & Tips
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Full Markdown Preview
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-700">

          {/* TAB 1: BRIEF */}
          {activeTab === 'brief' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="client-objective" className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Primary Objective for the Attorney
                  </label>
                  <input
                    id="client-objective"
                    type="text"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Prevent deposit forfeiture, negotiate mutual indemnity"
                  />
                </div>
                <div>
                  <label htmlFor="jurisdiction-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Governing Jurisdiction / State
                  </label>
                  <input
                    id="jurisdiction-input"
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. California Housing Law, New York Commercial Code"
                  />
                </div>
              </div>

              {/* Case Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Executive Briefing for Legal Counsel
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    analysis.riskLevel === 'Severe' 
                      ? 'bg-rose-100 text-rose-700' 
                      : analysis.riskLevel === 'High' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Risk Tier: {analysis.riskLevel || 'Moderate'} ({analysis.riskScore || 50}/100)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {analysis.summary || 'Summary of agreement terms and liability exposure.'}
                </p>
              </div>

              {/* Priority Issues */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Priority Issues Flagged for Attorney Attention ({prepSheet.priorityIssuesForCounsel.length})
                </h3>
                <div className="space-y-2.5">
                  {prepSheet.priorityIssuesForCounsel.map((issue, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">{issue.title}</span>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-semibold text-[10px]">
                          {issue.severity} Severity
                        </span>
                      </div>
                      <p className="text-slate-700 italic border-l-2 border-amber-300 pl-2">
                        "{issue.excerpt}"
                      </p>
                      <div className="text-[11px] text-slate-600 pt-1">
                        <strong>Identified Risk:</strong> {issue.identifiedRisk}
                      </div>
                      <div className="text-[11px] text-indigo-700">
                        <strong>Suggested Counter-Action:</strong> {issue.suggestedAttorneyAction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Billable Efficiency Tip:</span> Lawyers typically bill in 6-minute increments ($30–$75 per increment). Asking targeted, specific questions about exact clauses prevents 20 minutes of vague exploratory discussion.
                </div>
              </div>

              <div className="space-y-3">
                {prepSheet.targetedQuestionsForAttorney.map((item, idx) => (
                  <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Question {idx + 1} &bull; {item.category}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        {item.potentialCostSavings}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      "{item.question}"
                    </div>
                    <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                      Reference Excerpt: "{item.contextClauseExcerpt}"
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Why Ask This:</strong> {item.whyAskThis}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE & TIPS */}
          {activeTab === 'evidence' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  What to Bring to Your Consultation (Evidence Checklist)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {prepSheet.evidenceChecklist.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-2 text-slate-700">
                      <div className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center text-slate-400 shrink-0">
                        &bull;
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Smart Strategies to Reduce Attorney Costs
                </h3>
                <div className="space-y-2">
                  {prepSheet.billableHoursSavingTips.map((tip, idx) => (
                    <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-indigo-950 flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">💡</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MARKDOWN PREVIEW */}
          {activeTab === 'preview' && (
            <div className="animate-fadeIn">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[50vh] leading-relaxed">
                {markdownContent}
              </pre>
            </div>
          )}

          {/* Mandatory Ethical Legal Disclaimer */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-500 leading-normal">
            <strong>Mandatory Legal Notice:</strong> {prepSheet.formalLegalDisclaimer}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Export ready in <span className="font-semibold text-slate-700">Markdown & Print formats</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Brief!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download .MD Brief
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors hidden sm:flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
