import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  AlertTriangle, 
  Lightbulb, 
  Copy, 
  Check, 
  ArrowRight, 
  HelpCircle,
  Volume2,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { DecodedClauseResult, GlossaryTerm } from '../types';
import { LEGAL_GLOSSARY } from '../data/glossary';

interface JargonDecoderProps {
  onDecodeClause: (clauseText: string) => Promise<DecodedClauseResult>;
}

export const JargonDecoder: React.FC<JargonDecoderProps> = ({ onDecodeClause }) => {
  const [activeSubTab, setActiveSubTab] = useState<'translator' | 'glossary'>('translator');
  const [clauseInput, setClauseInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState<DecodedClauseResult | null>(null);
  const [copiedAlternative, setCopiedAlternative] = useState(false);

  // Glossary search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const sampleClauses = [
    {
      title: 'Broad Indemnification',
      clause: 'Party B shall defend, indemnify, and hold harmless Party A, its affiliates, contractors, and agents from and against any and all claims, liabilities, losses, damages, and reasonable attorney fees arising out of or related to this Agreement without limitation.'
    },
    {
      title: 'Liquidated Damages',
      clause: 'In the event of any early termination or failure to surrender premises by the designated hour, Tenant shall pay Landlord liquidated damages in the amount of $2,500.00 in addition to all accrued damages, without requiring Landlord to prove actual loss.'
    },
    {
      title: 'Force Majeure & Non-Performance',
      clause: 'Neither party shall be liable for failure to perform due to acts of God, civil strife, or labor disputes; provided, however, that the duty to make monetary payments on scheduled due dates shall in no event be suspended or excused.'
    }
  ];

  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clauseInput.trim()) return;
    setIsDecoding(true);
    try {
      const result = await onDecodeClause(clauseInput);
      setDecodedResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleCopyAlternative = () => {
    if (!decodedResult?.fairAlternative) return;
    navigator.clipboard.writeText(decodedResult.fairAlternative);
    setCopiedAlternative(true);
    setTimeout(() => setCopiedAlternative(false), 2000);
  };

  const categories = ['All', 'Contract Basics', 'Liability & Risk', 'Dispute Resolution', 'Real Estate', 'Employment & IP'];

  const filteredGlossary = LEGAL_GLOSSARY.filter((term) => {
    const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
    const matchesSearch = 
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.plainEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Legal Terminology Simplifier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Legal Jargon Decoder & Glossary
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Translate dense, intimidating legal clauses into 5th-grade English, discover hidden traps, or look up common legal terms with practical real-world scenarios.
            </p>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
            <button
              onClick={() => setActiveSubTab('translator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'translator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clause Translator
            </button>
            <button
              onClick={() => setActiveSubTab('glossary')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'glossary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Legal Terms Glossary
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Clause Translator */}
      {activeSubTab === 'translator' && (
        <div className="space-y-6">
          {/* Input Box */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Paste Confusing Legal Clause or Sentence:
              </label>
              <textarea
                rows={5}
                value={clauseInput}
                onChange={(e) => setClauseInput(e.target.value)}
                placeholder="Paste any confusing legal sentence here (e.g. 'Party A shall indemnify Party B from all consequential damages...')"
                className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 leading-relaxed"
              />
            </div>

            {/* Quick Sample Clause Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Try sample clause:</span>
              {sampleClauses.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setClauseInput(s.clause)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 text-xs transition-colors cursor-pointer"
                >
                  {s.title}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleDecode}
                disabled={!clauseInput.trim() || isDecoding}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isDecoding ? 'Decoding Legalese...' : 'Decode into Plain English'}</span>
              </button>
            </div>
          </div>

          {/* Results Box */}
          {decodedResult && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">Plain-English Translation</h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  decodedResult.riskLevel === 'High' || decodedResult.riskLevel === 'Severe'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {decodedResult.riskLevel} Risk
                </span>
              </div>

              {/* Translation Highlight */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                {decodedResult.plainEnglish}
              </div>

              {/* Assessment & Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">Risk Evaluation</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {decodedResult.riskAssessment}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-xs space-y-2">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hidden Red Flags</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                    {decodedResult.redFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Fair Alternative Language Ready to Copy */}
              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Balanced & Fair Counter-Proposal Language:
                  </span>
                  <button
                    onClick={handleCopyAlternative}
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedAlternative ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                    <span>{copiedAlternative ? 'Copied to Clipboard' : 'Copy Substitute Clause'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-200 leading-relaxed bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  "{decodedResult.fairAlternative}"
                </p>
              </div>

              {/* Questions to Ask Counterparty */}
              {decodedResult.questionsToAsk && decodedResult.questionsToAsk.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">
                    Smart Questions to Ask Before Agreeing:
                  </span>
                  <ul className="space-y-1.5 text-slate-600">
                    {decodedResult.questionsToAsk.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Searchable Glossary */}
      {activeSubTab === 'glossary' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search legal terms (e.g. indemnity, force majeure, severability, at-will)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Categories:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Glossary Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredGlossary.map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.term}</h3>
                      {item.pronunciation && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          /{item.pronunciation}/
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase shrink-0">
                      {item.category}
                    </span>
                  </div>

                  {/* Plain English Translation Highlight */}
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-slate-800">
                    <span className="font-bold text-emerald-900 block mb-1 text-[11px] uppercase tracking-wider">
                      Plain English:
                    </span>
                    <p className="leading-relaxed font-medium">
                      {item.plainEnglish}
                    </p>
                  </div>

                  {/* Formal Definition */}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <strong className="text-slate-700">Legal Meaning: </strong>
                    {item.definition}
                  </p>

                  {/* Real World Scenario */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                    <strong className="text-slate-800 block text-[11px]">Real-World Scenario:</strong>
                    <p className="text-[11px] leading-relaxed italic">
                      "{item.realWorldExample}"
                    </p>
                  </div>

                  {/* Trap to Watch Out For */}
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1">
                    <strong className="font-bold text-rose-900 flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Watch Out For:</span>
                    </strong>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {item.watchOutFor}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setClauseInput(`Party agree to ${item.term} ...`);
                      setActiveSubTab('translator');
                    }}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Test in Clause Translator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
