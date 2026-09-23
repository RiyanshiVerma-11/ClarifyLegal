import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  Lightbulb, 
  CheckCircle2, 
  Copy, 
  Check, 
  Users, 
  Flame, 
  ArrowRight,
  RefreshCw,
  Award,
  Zap,
  HelpCircle
} from 'lucide-react';
import { CounterpartySimulationResult } from '../types';

interface CounterpartySimulatorProps {
  originalClause?: string;
  proposedChanges?: string;
  contractContext?: string;
}

const PRESET_PERSONAS = [
  {
    id: 'landlord',
    name: 'Tough Corporate Landlord',
    role: 'Commercial & Residential Property Firm',
    description: 'Strict, profit-focused, claims standard boilerplate lease clauses are non-negotiable.',
    badge: 'High Pushback',
  },
  {
    id: 'enterprise_client',
    name: 'Enterprise Client Legal Team',
    role: 'Fortune 500 Procurement & Legal',
    description: 'Risk-averse corporate counsel with bureaucratic review cycles and strict IP demands.',
    badge: 'Bureaucratic',
  },
  {
    id: 'startup_founder',
    name: 'Aggressive Tech Startup Founder',
    role: 'Early-Stage Executive',
    description: 'Demands broad IP assignment, restrictive non-competes, and fast turnaround without concessions.',
    badge: 'Aggressive IP',
  },
  {
    id: 'vendor_counsel',
    name: 'SaaS Vendor Corporate Counsel',
    role: 'Enterprise Vendor Licensing',
    description: 'Disclaims all warranties, limits liability to last 3 months fees, and enforces auto-renewals.',
    badge: 'One-Sided Terms',
  }
];

export const CounterpartySimulator: React.FC<CounterpartySimulatorProps> = ({
  originalClause = '',
  proposedChanges = '',
  contractContext = 'General Commercial Agreement',
}) => {
  const [selectedPersona, setSelectedPersona] = useState<string>(PRESET_PERSONAS[0].name);
  const [customPersona, setCustomPersona] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<CounterpartySimulationResult | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const activePersonaName = isCustom && customPersona.trim() ? customPersona.trim() : selectedPersona;

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationError(null);

    try {
      const response = await fetch('/api/simulate-counterparty-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterpartyPersona: activePersonaName,
          contractContext: contractContext || 'Commercial Contract Agreement',
          proposedChanges: proposedChanges || 'Cap liability to fees paid and provide 30-day notice prior to termination.',
          originalClause: originalClause || 'Standard liability and termination provisions.',
          tone: 'Diplomatic',
        }),
      });

      if (!response.ok) {
        throw new Error(`Simulation failed: status ${response.status}`);
      }

      const data: CounterpartySimulationResult = await response.json();
      setSimulationResult(data);
    } catch (err: any) {
      console.error('Counterparty simulation error:', err);
      setSimulationError(err.message || 'Simulation encountered an issue. Please retry.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopySimulatedEmail = () => {
    if (!simulationResult) return;
    navigator.clipboard.writeText(simulationResult.simulatedResponseEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyWinningScript = () => {
    if (!simulationResult) return;
    const text = `=== Winning Rebuttal Script ===\nStrategy: ${simulationResult.rebuttalStrategy}\n\nRebuttal Script:\n${simulationResult.winningRebuttalScript}\n\nConcession Likelihood: ${simulationResult.concessionLikelihood}`;
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const getStanceBadge = (stance: string) => {
    switch (stance) {
      case 'Strict Resistance':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Conditional Pushback':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Open to Compromise':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold mb-1.5">
            <Bot className="w-3.5 h-3.5" />
            <span>AI Counterparty Negotiation Simulator</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Simulate Counterparty Response</span>
            <span className="text-xs font-normal text-slate-500 hidden sm:inline">| Gemini Flash Intelligence</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Test how your counterparty will react to your negotiation proposal before you hit send. Discover their objections, hidden incentives, and your winning counter-tactics.
          </p>
        </div>

        <button
          id="simulate-counterparty-btn"
          onClick={handleSimulate}
          disabled={isSimulating}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
              <span>Simulating Pushback...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Simulate Counterparty Pushback</span>
            </>
          )}
        </button>
      </div>

      {/* Persona Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Select Who You Are Negotiating With:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_PERSONAS.map((p) => {
            const isSelected = !isCustom && selectedPersona === p.name;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPersona(p.name);
                  setIsCustom(false);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {p.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-medium text-slate-400">
                  <span>{p.role}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-purple-600" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Persona Toggle */}
        <div className="pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustom(!isCustom)}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <span>{isCustom ? 'Use Preset Personas' : '+ Custom Persona (Enter specific opponent)'}</span>
            </button>
          </div>

          {isCustom && (
            <div className="mt-2 animate-in fade-in duration-150">
              <input
                type="text"
                value={customPersona}
                onChange={(e) => setCustomPersona(e.target.value)}
                placeholder="e.g. Inflexible General Counsel at Boutique Design Agency"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {simulationError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <span>{simulationError}</span>
          <button
            onClick={() => setSimulationError(null)}
            className="text-rose-600 font-bold ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Simulation Result Area */}
      {simulationResult && (
        <div className="space-y-6 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
          {/* Status / Stance Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Opponent: {simulationResult.counterpartyPersona}</div>
                <div className="text-sm font-bold text-slate-900">{simulationResult.scenarioTitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Anticipated Stance:</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStanceBadge(simulationResult.counterpartyStance)}`}>
                {simulationResult.counterpartyStance}
              </span>
            </div>
          </div>

          {/* Simulated Email Response */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs text-purple-300 font-bold">
                <Bot className="w-4 h-4" />
                <span>Simulated Incoming Pushback Email from Counterparty</span>
              </div>
              <button
                onClick={handleCopySimulatedEmail}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {simulationResult.simulatedResponseEmail}
            </div>
          </div>

          {/* Two Columns: Core Objections & Hidden Motivation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Core Objections */}
            <div className="p-5 bg-white rounded-2xl border border-rose-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider pb-2 border-b border-rose-100">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Anticipated Pushback & Objections</span>
              </div>
              <ul className="space-y-2">
                {simulationResult.coreObjections.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-rose-50/40 p-2.5 rounded-lg border border-rose-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hidden Motivations */}
            <div className="p-5 bg-white rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider pb-2 border-b border-amber-100">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Their Underlying Motivation & Psychology</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/40 p-3 rounded-lg border border-amber-100">
                {simulationResult.underlyingMotivation}
              </p>
              <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-100 text-[11px] text-purple-900 flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <span><strong>Concession Likelihood: </strong>{simulationResult.concessionLikelihood}</span>
              </div>
            </div>
          </div>

          {/* Winning Rebuttal Playbook */}
          <div className="p-6 bg-linear-to-br from-emerald-50/70 via-white to-slate-50 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                <span>Your Winning Counter-Tactic & Script</span>
              </div>
              <button
                onClick={handleCopyWinningScript}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Script Copied!' : '1-Click Copy Rebuttal Script'}</span>
              </button>
            </div>

            {/* Strategic Posture */}
            <div className="p-3 bg-emerald-100/50 rounded-xl border border-emerald-200 text-xs text-emerald-950">
              <span className="font-bold">Recommended Strategic Posture: </span>
              <span>{simulationResult.rebuttalStrategy}</span>
            </div>

            {/* Winning Rebuttal Script */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Winning Comeback Script (Ready to Send):</span>
              <div className="p-4 bg-white rounded-xl border border-emerald-200 text-xs sm:text-sm font-sans text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                {simulationResult.winningRebuttalScript}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
