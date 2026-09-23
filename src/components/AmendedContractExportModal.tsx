import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  FileCheck, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';
import { ContractAnalysisResult } from '../types';
import { generateCleanAmendedContract, AmendedContractDraft } from '../utils/amendedContract';

interface AmendedContractExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ContractAnalysisResult | null;
}

export const AmendedContractExportModal: React.FC<AmendedContractExportModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'draft' | 'diff'>('draft');

  if (!isOpen || !analysis) return null;

  const amendedDraft: AmendedContractDraft = generateCleanAmendedContract(analysis);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(amendedDraft.cleanContractText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    const safeTitle = (analysis.documentTitle || 'Amended_Contract')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const fileName = `${safeTitle}_Clean_Amended_Draft.txt`;
    
    const blob = new Blob([amendedDraft.cleanContractText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-linear-to-r from-emerald-50/60 via-white to-slate-50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>One-Click Clean Amended Draft Generator</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Export Clean Amended Contract
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All {amendedDraft.clausesReplacedCount} flagged one-sided clauses have been replaced with attorney-grade, fair mutual terms. Ready to copy, export, or send to counterparty.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & View Mode Switcher */}
        <div className="px-6 py-3 border-b border-slate-200/80 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveView('draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'draft'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Clean Draft</span>
            </button>
            <button
              onClick={() => setActiveView('diff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'diff'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Replaced Clauses Summary ({amendedDraft.clausesReplacedCount})</span>
            </button>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="copy-clean-draft-btn"
              onClick={handleCopyDraft}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Clean Draft!' : '1-Click Copy Draft'}</span>
            </button>

            <button
              id="download-clean-draft-btn"
              onClick={handleDownloadFile}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeView === 'draft' ? (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {amendedDraft.amendmentNotice}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Ready to sign / attach to counter-email
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                  {amendedDraft.cleanContractText}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 mb-2">
                Review each asymmetric clause that was purged from the original document and replaced with a fair, balanced commercial term:
              </div>

              <div className="space-y-4">
                {amendedDraft.replacedClauses.map((clause, idx) => (
                  <div 
                    key={clause.id || idx}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">
                        {idx + 1}. {clause.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        Replaced {clause.originalRisk} Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Old language */}
                      <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                          ❌ Original Predatory Language (Removed)
                        </span>
                        <p className="text-slate-600 text-[11px] italic leading-relaxed line-clamp-4">
                          "{clause.originalExcerpt}"
                        </p>
                      </div>

                      {/* New language */}
                      <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                          ✅ Protective Counter-Clause (Inserted)
                        </span>
                        <p className="text-slate-800 text-[11px] font-medium leading-relaxed">
                          "{clause.amendedText}"
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Pitfall Avoided:</span>
                      <span>{clause.pitfallPrevented}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            ClarifyLegal AI • Clean Contract Restatement Engine
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDraft}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownloadFile}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Download File (.txt)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
