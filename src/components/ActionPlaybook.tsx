import React, { useState } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  Mail, 
  Copy, 
  Check, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Send,
  FileEdit,
  Smile,
  Shield,
  Handshake,
  Download,
  Briefcase
} from 'lucide-react';
import { CriticalClause, ContractAnalysisResult } from '../types';
import { CounterpartySimulator } from './CounterpartySimulator';
import { AmendedContractExportModal } from './AmendedContractExportModal';
import { AttorneyPrepModal } from './AttorneyPrepModal';

interface ActionPlaybookProps {
  currentAnalysis?: ContractAnalysisResult | null;
  prefilledClause: CriticalClause | null;
  onClearPrefill: () => void;
  onGenerateCounterProposal: (params: {
    originalClause: string;
    issueIdentified: string;
    desiredOutcome: string;
    recipientRole: string;
    tone?: 'Diplomatic' | 'Firm' | 'Collaborative';
  }) => Promise<any>;
}

export const ActionPlaybook: React.FC<ActionPlaybookProps> = ({
  currentAnalysis,
  prefilledClause,
  onClearPrefill,
  onGenerateCounterProposal,
}) => {
  const [originalClause, setOriginalClause] = useState(prefilledClause?.originalExcerpt || '');
  const [issueIdentified, setIssueIdentified] = useState(prefilledClause?.title || '');
  const [desiredOutcome, setDesiredOutcome] = useState(prefilledClause?.recommendation || '');
  const [recipientRole, setRecipientRole] = useState('Landlord / Client / Counterparty');
  const [selectedTone, setSelectedTone] = useState<'Diplomatic' | 'Firm' | 'Collaborative'>('Diplomatic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<any>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});
  const [isAmendedModalOpen, setIsAmendedModalOpen] = useState(false);
  const [isAttorneyPrepModalOpen, setIsAttorneyPrepModalOpen] = useState(false);

  // When prefilledClause changes
  React.useEffect(() => {
    if (prefilledClause) {
      setOriginalClause(prefilledClause.originalExcerpt);
      setIssueIdentified(prefilledClause.title);
      setDesiredOutcome(prefilledClause.recommendation);
    }
  }, [prefilledClause]);

  const handleGenerateWithTone = async (overrideTone?: 'Diplomatic' | 'Firm' | 'Collaborative') => {
    if (!originalClause.trim()) return;
    const toneToUse = overrideTone || selectedTone;
    if (overrideTone) {
      setSelectedTone(overrideTone);
    }

    setIsGenerating(true);
    try {
      const res = await onGenerateCounterProposal({
        originalClause,
        issueIdentified: issueIdentified || 'Contract Terms Modification',
        desiredOutcome: desiredOutcome || 'Mutual and fair standard terms',
        recipientRole: recipientRole || 'Counterparty',
        tone: toneToUse,
      });
      setGeneratedProposal(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleGenerateWithTone();
  };

  const handleCopyEmail = () => {
    if (!generatedProposal?.emailBody) return;
    const fullText = `Subject: ${generatedProposal.emailSubject}\n\n${generatedProposal.emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyEntireBrief = () => {
    if (!generatedProposal) return;
    const fullBrief = `=== ClarifyLegal Counter-Proposal Brief ===
Tone: ${selectedTone}
Recipient: ${recipientRole}
Subject: ${generatedProposal.emailSubject}

--------------------------------------------------
NEGOTIATION EMAIL:
--------------------------------------------------
${generatedProposal.emailBody}

--------------------------------------------------
REDLINE COMPARISON:
--------------------------------------------------
${generatedProposal.redlinedText || 'N/A'}

--------------------------------------------------
TALKING POINTS FOR PHONE CALL / MEETING:
--------------------------------------------------
${generatedProposal.talkingPoints?.map((tp: string) => `• ${tp}`).join('\n') || 'N/A'}
`;
    navigator.clipboard.writeText(fullBrief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const checklistItems = [
    { id: 'c1', text: 'Never rely on verbal assurances — insist every verbal promise is written in the contract or an addendum rider.' },
    { id: 'c2', text: 'Verify liability caps: Ensure your personal exposure is capped at fees received rather than unbounded.' },
    { id: 'c3', text: 'Check the cure period: Confirm you receive at least 15 to 30 days written notice to fix any alleged breach before penalties trigger.' },
    { id: 'c4', text: 'Confirm IP timing (for contractors): Ensure intellectual property transfers solely upon receipt of cleared funds.' },
    { id: 'c5', text: 'Document pre-existing conditions (for renters): Conduct a timestamped video walk-through before moving any furniture.' },
    { id: 'c6', text: 'Review termination rights: Ensure both parties have balanced notice periods rather than unilateral immediate cancellation.' }
  ];

  const toggleCheck = (id: string) => {
    setCheckedChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Actionable Negotiation Playbook</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Turn Legal Vulnerabilities into Diplomatic Solutions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Don't just discover unfair clauses—take action. Generate polite, attorney-grade negotiation emails with redline markup, prepare for phone calls with talking points, and export a ready-to-sign clean amended contract.
          </p>
        </div>

        {currentAnalysis && (
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
            <button
              id="playbook-export-clean-amended-btn"
              onClick={() => setIsAmendedModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ring-1 ring-emerald-400"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Export Clean Amended Contract</span>
            </button>
            <span className="text-[11px] text-slate-500 font-medium">
              Replaces all red-risk clauses with safe terms
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Counter-Proposal Generator (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleGenerate} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Diplomatic Counter-Proposal Email Generator
                </h3>
              </div>
              {prefilledClause && (
                <button
                  type="button"
                  onClick={onClearPrefill}
                  className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Clear Prefill
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient / Counterparty Role
              </label>
              <input
                type="text"
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value)}
                placeholder="e.g. Landlord (Crestview LLC), Client (Acme Corp), Hiring Manager"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Original Problematic Clause Text
              </label>
              <textarea
                rows={4}
                value={originalClause}
                onChange={(e) => setOriginalClause(e.target.value)}
                placeholder="Paste the clause you wish to amend or negotiate..."
                className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Issue or Risk
                </label>
                <input
                  type="text"
                  value={issueIdentified}
                  onChange={(e) => setIssueIdentified(e.target.value)}
                  placeholder="e.g. Uncapped liability, 90-day automatic renewal, Net-90 payment"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Desired Amendment / Goal
                </label>
                <input
                  type="text"
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  placeholder="e.g. Cap liability to fees paid, Standard 30-day notice, Net-30 payment"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Tone Selector Toggles */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Negotiation Email Tone & Posture
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  id="tone-diplomatic-btn"
                  onClick={() => setSelectedTone('Diplomatic')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTone === 'Diplomatic'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Handshake className={`w-3.5 h-3.5 ${selectedTone === 'Diplomatic' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      Diplomatic
                    </span>
                    {selectedTone === 'Diplomatic' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Polite, professional, preserves cordial rapport while firmly requesting standard terms.
                  </p>
                </button>

                <button
                  type="button"
                  id="tone-firm-btn"
                  onClick={() => setSelectedTone('Firm')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTone === 'Firm'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className={`w-3.5 h-3.5 ${selectedTone === 'Firm' ? 'text-rose-600' : 'text-slate-400'}`} />
                      Firm
                    </span>
                    {selectedTone === 'Firm' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Direct, principled, frames balanced amendments as necessary prerequisites to execution.
                  </p>
                </button>

                <button
                  type="button"
                  id="tone-collaborative-btn"
                  onClick={() => setSelectedTone('Collaborative')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTone === 'Collaborative'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Smile className={`w-3.5 h-3.5 ${selectedTone === 'Collaborative' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      Collaborative
                    </span>
                    {selectedTone === 'Collaborative' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Partnership-first, win-win framing focusing on shared success and smooth mutual workflows.
                  </p>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                id="playbook-generate-btn"
                disabled={!originalClause.trim() || isGenerating}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{isGenerating ? `Drafting ${selectedTone} Counter-Proposal...` : `Generate ${selectedTone} Email`}</span>
              </button>
            </div>
          </form>

          {/* Generated Result */}
          {generatedProposal && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Ready-to-Send Negotiation Email
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    selectedTone === 'Diplomatic'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedTone === 'Firm'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {selectedTone} Tone
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* 1-Click Copy Email Button */}
                  <button
                    id="playbook-copy-email-btn"
                    onClick={handleCopyEmail}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Email Copied!' : '1-Click Copy Email'}</span>
                  </button>

                  {/* Copy Entire Brief */}
                  <button
                    id="playbook-copy-brief-btn"
                    onClick={handleCopyEntireBrief}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy email, redlines, and talking points combined"
                  >
                    {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedBrief ? 'Brief Copied!' : 'Copy Full Brief'}</span>
                  </button>
                </div>
              </div>

              {/* Tone Quick-Switch Row */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Re-generate in a different tone:</span>
                <div className="flex items-center gap-1.5">
                  {(['Diplomatic', 'Firm', 'Collaborative'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleGenerateWithTone(t)}
                      disabled={isGenerating}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        selectedTone === t
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Content */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="text-xs font-semibold text-slate-800">
                    <span className="text-slate-400 font-normal">Subject: </span>
                    {generatedProposal.emailSubject}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedProposal.emailSubject);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Copy Subject
                  </button>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {generatedProposal.emailBody}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleCopyEmail}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copiedEmail ? 'Copied to Clipboard!' : '1-Click Copy Email Body'}</span>
                  </button>
                </div>
              </div>

              {/* Redline Markup */}
              {generatedProposal.redlinedText && (
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Redline Language Comparison:
                  </span>
                  <div className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-800 p-3 rounded-lg border border-slate-700">
                    {generatedProposal.redlinedText}
                  </div>
                </div>
              )}

              {/* Phone Talking Points */}
              {generatedProposal.talkingPoints && generatedProposal.talkingPoints.length > 0 && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-2">
                  <span className="font-bold text-emerald-950 block">
                    Talking Points for a Phone Call or Meeting:
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {generatedProposal.talkingPoints.map((tp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{tp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AI Counterparty Negotiation Simulator */}
          <CounterpartySimulator
            originalClause={originalClause}
            proposedChanges={desiredOutcome || issueIdentified}
            contractContext={recipientRole}
          />
        </div>

        {/* Right: Pre-Signing Checklist & Guidance */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Pre-Signing Safety Checklist
              </h3>
            </div>

            <div className="space-y-3">
              {checklistItems.map((item) => {
                const isChecked = !!checkedChecklist[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 text-xs ${
                      isChecked
                        ? 'bg-emerald-50/40 border-emerald-300 text-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={isChecked ? 'line-through' : ''}>
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 Essential Attorney Questions */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Questions for Legal Counsel
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If consulting a licensed attorney or legal aid clinic, ask these targeted questions to get maximum value from your session:
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                1. "Does my local state law render any of these maintenance or non-compete clauses void as a matter of public policy?"
              </li>
              <li className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                2. "What are the standard statutory timeframes for security deposit returns or invoice disputes in my jurisdiction?"
              </li>
              <li className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                3. "How would an arbitrator interpret the indemnification clause in case of third-party copyright claims?"
              </li>
            </ul>

            {currentAnalysis && (
              <button
                id="playbook-attorney-prep-btn"
                onClick={() => setIsAttorneyPrepModalOpen(true)}
                className="w-full mt-3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-200" />
                <span>Generate Full Attorney Prep Brief & Questions</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export Clean Amended Contract Modal */}
      {currentAnalysis && (
        <AmendedContractExportModal
          isOpen={isAmendedModalOpen}
          onClose={() => setIsAmendedModalOpen(false)}
          analysis={currentAnalysis}
        />
      )}

      {/* Attorney Consultation Prep Sheet Modal */}
      {currentAnalysis && (
        <AttorneyPrepModal
          isOpen={isAttorneyPrepModalOpen}
          onClose={() => setIsAttorneyPrepModalOpen(false)}
          analysis={currentAnalysis}
        />
      )}
    </div>
  );
};
