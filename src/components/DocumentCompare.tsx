import React, { useState } from 'react';
import { 
  GitCompare, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw, 
  Copy, 
  Check,
  Scale,
  Columns,
  Rows,
  Download,
  FileDown,
  Printer
} from 'lucide-react';
import { DocumentComparisonResult } from '../types';
import { SAMPLE_COMPARISON_PAIRS } from '../data/sampleContracts';

interface DocumentCompareProps {
  currentComparison: DocumentComparisonResult | null;
  onCompare: (docA: { title: string; content: string }, docB: { title: string; content: string }) => Promise<void>;
  isLoading: boolean;
  onReset: () => void;
}

export const DocumentCompare: React.FC<DocumentCompareProps> = ({
  currentComparison,
  onCompare,
  isLoading,
  onReset,
}) => {
  const [docATitle, setDocATitle] = useState('Document A (Original / Standard)');
  const [docAContent, setDocAContent] = useState('');
  const [docBTitle, setDocBTitle] = useState('Document B (Revised / Counter-Draft)');
  const [docBContent, setDocBContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedRedlines, setCopiedRedlines] = useState(false);

  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_COMPARISON_PAIRS.find((p) => p.id === presetId);
    if (preset) {
      setDocATitle(preset.docA.title);
      setDocAContent(preset.docA.content);
      setDocBTitle(preset.docB.title);
      setDocBContent(preset.docB.content);
    }
  };

  const handleRunCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docAContent.trim() || !docBContent.trim()) return;
    onCompare(
      { title: docATitle.trim() || 'Document A', content: docAContent },
      { title: docBTitle.trim() || 'Document B', content: docBContent }
    );
  };

  const handleCopySummary = () => {
    if (!currentComparison) return;
    const text = `ClarifyLegal Comparison: ${currentComparison.docATitle} vs ${currentComparison.docBTitle}\nVerdict: ${currentComparison.verdict}\n\nKey Takeaways:\n${currentComparison.keyTakeaways.map((t) => `• ${t}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRedlines = () => {
    if (!currentComparison) return;
    const clauseDiffs = currentComparison.clauseComparisons.map((c, i) => {
      return `[Clause Comparison #${i + 1}] ${c.clauseTopic}
CHANGE TYPE: ${c.changeType.toUpperCase()}
SIGNIFICANCE: ${c.significance.toUpperCase()}

ORIGINAL (${currentComparison.docATitle}):
"${c.docAText}"

REVISED (${currentComparison.docBTitle}):
"${c.docBText}"

IMPACT & CONSEQUENCE:
${c.impact}

RECOMMENDED NEXT STEP:
${c.recommendation}
`;
    }).join('\n' + '—'.repeat(45) + '\n\n');

    const fullRedlinesText = `=== ClarifyLegal Comparative Redlines Analysis ===
Document A: ${currentComparison.docATitle}
Document B: ${currentComparison.docBTitle}
Verdict: ${currentComparison.verdict}
Net Risk Shift: ${currentComparison.riskShift}
Compared Date: ${new Date(currentComparison.comparedAt).toLocaleDateString()}

KEY TAKEAWAYS:
${currentComparison.keyTakeaways.map(t => `• ${t}`).join('\n')}

==================================================
CLAUSE-BY-CLAUSE COMPARATIVE MARKUP:
==================================================

${clauseDiffs}
`;
    navigator.clipboard.writeText(fullRedlinesText);
    setCopiedRedlines(true);
    setTimeout(() => setCopiedRedlines(false), 2500);
  };

  const handleDownloadExecutiveBrief = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* If No Comparison Result: Input Form */}
      {!currentComparison && !isLoading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                <GitCompare className="w-3.5 h-3.5" />
                <span>Side-by-Side Document & Clause Comparator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Compare Two Contracts or Draft Revisions
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Wondering what changed between the landlord's original lease and your proposed rider? Or evaluating two vendor NDAs? ClarifyLegal identifies altered obligations, detects liability shifts, and tells you who wins or loses in the markup.
              </p>
            </div>

            {/* Presets */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Quick Start with Comparison Presets:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_COMPARISON_PAIRS.map((pair) => (
                  <button
                    key={pair.id}
                    type="button"
                    onClick={() => handleSelectPreset(pair.id)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900 mb-1">
                      {pair.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2">
                      {pair.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRunCompare} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document A */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document A Title
                  </label>
                  <input
                    type="text"
                    value={docATitle}
                    onChange={(e) => setDocATitle(e.target.value)}
                    placeholder="e.g. Landlord's Original Lease Draft"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document A Content
                  </label>
                  <textarea
                    rows={12}
                    value={docAContent}
                    onChange={(e) => setDocAContent(e.target.value)}
                    placeholder="Paste original version or standard terms..."
                    className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Document B */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document B Title
                  </label>
                  <input
                    type="text"
                    value={docBTitle}
                    onChange={(e) => setDocBTitle(e.target.value)}
                    placeholder="e.g. Tenant's Proposed Rider & Amendments"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document B Content
                  </label>
                  <textarea
                    rows={12}
                    value={docBContent}
                    onChange={(e) => setDocBContent(e.target.value)}
                    placeholder="Paste revised version, counter-offer, or vendor redlines..."
                    className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 leading-relaxed"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDocAContent('');
                  setDocBContent('');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Clear Both
              </button>
              <button
                type="submit"
                disabled={!docAContent.trim() || !docBContent.trim() || isLoading}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <GitCompare className="w-4 h-4 text-blue-400" />
                <span>Compare & Detect Risk Shifts</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 animate-pulse">
            <GitCompare className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Comparing Document Revisions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Detecting subtle wording alterations, calculating liability reallocation, and analyzing clause-by-clause impact...
            </p>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {currentComparison && !isLoading && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {currentComparison.docATitle} <span className="text-slate-400 font-normal">vs</span> {currentComparison.docBTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  Compared {new Date(currentComparison.comparedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="compare-download-pdf-btn"
                onClick={handleDownloadExecutiveBrief}
                className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                title="Download PDF or Print Executive Comparison Brief"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF / Executive Brief</span>
              </button>

              <button
                id="compare-copy-redlines-btn"
                onClick={handleCopyRedlines}
                className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200"
                title="Copy side-by-side comparative redlines to clipboard"
              >
                {copiedRedlines ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{copiedRedlines ? 'Redlines Copied!' : 'Copy Redlines'}</span>
              </button>

              <button
                onClick={handleCopySummary}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Verdict'}</span>
              </button>

              <button
                onClick={onReset}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Comparison</span>
              </button>
            </div>
          </div>

          {/* Verdict & Overview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Risk Shift Gauge */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Net Balance Shift
                </span>

                <div className={`p-4 rounded-xl border text-center my-3 ${
                  currentComparison.riskShift === 'More Favorable to You'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : currentComparison.riskShift === 'More Risky for You'
                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  <Scale className="w-6 h-6 mx-auto mb-1.5 opacity-80" />
                  <div className="text-base font-extrabold">{currentComparison.riskShift}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">Comparison Verdict:</span>
                {currentComparison.verdict}
              </div>
            </div>

            {/* Right: Key Takeaways (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Summary of Major Differences
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                  {currentComparison.overview}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-2">
                  Crucial Takeaways Before Signing:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {currentComparison.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Clause-by-Clause Side-by-Side Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Detailed Clause Differences & Impact Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Examine specific wording modifications and how they alter legal obligations and risk allocations.
              </p>
            </div>

            <div className="space-y-4">
              {currentComparison.clauseComparisons.map((item, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.clauseTopic}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.changeType === 'added'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.changeType === 'removed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.changeType}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500">
                      Significance: <strong className="text-slate-800 uppercase">{item.significance}</strong>
                    </span>
                  </div>

                  {/* Side-by-side text columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">
                        {currentComparison.docATitle}
                      </span>
                      <p className="text-slate-700 leading-relaxed font-mono text-[11px]">
                        {item.docAText || '(Not present in Document A)'}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-blue-600 text-[10px] uppercase block mb-1">
                        {currentComparison.docBTitle}
                      </span>
                      <p className="text-slate-700 leading-relaxed font-mono text-[11px]">
                        {item.docBText || '(Not present in Document B)'}
                      </p>
                    </div>
                  </div>

                  {/* Impact & Recommendation */}
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60 text-xs space-y-1">
                    <p className="text-slate-800">
                      <strong>Legal Consequence:</strong> {item.impact}
                    </p>
                    <p className="text-blue-950 font-semibold text-[11px]">
                      <strong>Recommendation:</strong> {item.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
