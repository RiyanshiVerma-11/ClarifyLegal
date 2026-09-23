import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Sparkles,
  FileText,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { CriticalClause, DocumentRiskLevel } from '../types';

interface InteractiveDocumentViewerProps {
  rawText: string;
  criticalClauses: CriticalClause[];
  onJumpToClause: (clauseId: string) => void;
  activeClauseId?: string | null;
  onSelectForPlaybook?: (clause: CriticalClause) => void;
}

interface TextSegment {
  type: 'text' | 'highlight';
  text: string;
  clause?: CriticalClause;
}

export const InteractiveDocumentViewer: React.FC<InteractiveDocumentViewerProps> = ({
  rawText,
  criticalClauses,
  onJumpToClause,
  activeClauseId,
  onSelectForPlaybook,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SEVERE' | 'CAUTION'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClause, setSelectedClause] = useState<CriticalClause | null>(null);

  // Severe vs Caution counts
  const counts = useMemo(() => {
    let severe = 0;
    let caution = 0;
    criticalClauses.forEach((c) => {
      if (c.risk === 'Severe' || c.risk === 'High') severe++;
      else if (c.risk === 'Moderate') caution++;
    });
    return { severe, caution, total: criticalClauses.length };
  }, [criticalClauses]);

  // Synchronize activeClauseId from parent
  React.useEffect(() => {
    if (activeClauseId) {
      const match = criticalClauses.find((c) => c.id === activeClauseId);
      if (match) setSelectedClause(match);
    }
  }, [activeClauseId, criticalClauses]);

  // Fallback text generator if rawText is brief
  const effectiveText = useMemo(() => {
    if (rawText && rawText.trim().length > 100) return rawText;
    // Assemble readable document from clauses
    return criticalClauses
      .map((c, i) => `SECTION ${i + 1}: ${c.title.toUpperCase()}\n${c.originalExcerpt}\n`)
      .join('\n\n');
  }, [rawText, criticalClauses]);

  // Segment the text into plain text and highlighted spans
  const segments = useMemo(() => {
    if (!effectiveText) return [];

    interface MatchPos {
      start: number;
      end: number;
      clause: CriticalClause;
    }

    const matches: MatchPos[] = [];

    // Find occurrences of each clause excerpt
    criticalClauses.forEach((clause) => {
      if (!clause.originalExcerpt) return;
      const cleanExcerpt = clause.originalExcerpt.trim();
      
      // Try full excerpt
      let idx = effectiveText.indexOf(cleanExcerpt);
      
      // If not exact match, try first 50 chars
      if (idx === -1 && cleanExcerpt.length > 30) {
        const sub = cleanExcerpt.slice(0, 45);
        idx = effectiveText.indexOf(sub);
      }

      // If still not found, try case-insensitive
      if (idx === -1) {
        const lowerDoc = effectiveText.toLowerCase();
        const lowerEx = cleanExcerpt.toLowerCase().slice(0, 40);
        idx = lowerDoc.indexOf(lowerEx);
      }

      if (idx !== -1) {
        matches.push({
          start: idx,
          end: idx + Math.min(cleanExcerpt.length, effectiveText.length - idx),
          clause,
        });
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches
    const nonOverlapping: MatchPos[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    // Build segments
    const result: TextSegment[] = [];
    let cur = 0;
    for (const m of nonOverlapping) {
      if (m.start > cur) {
        result.push({
          type: 'text',
          text: effectiveText.substring(cur, m.start),
        });
      }
      result.push({
        type: 'highlight',
        text: effectiveText.substring(m.start, m.end),
        clause: m.clause,
      });
      cur = m.end;
    }
    if (cur < effectiveText.length) {
      result.push({
        type: 'text',
        text: effectiveText.substring(cur),
      });
    }

    return result;
  }, [effectiveText, criticalClauses]);

  const handleClauseClick = (clause: CriticalClause) => {
    setSelectedClause(clause);
    onJumpToClause(clause.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Live Document Radar
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Original Document with Inline Risk Highlights
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Clauses with severe legal liability traps are highlighted in <span className="font-semibold text-rose-700">red</span>, caution areas in <span className="font-semibold text-amber-700">yellow</span>. Click any highlighted clause to inspect its plain-English explanation.
            </p>
          </div>

          {/* Quick Legend & Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Clauses ({counts.total})
            </button>
            <button
              onClick={() => setFilter('SEVERE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filter === 'SEVERE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Severe Traps ({counts.severe})</span>
            </button>
            <button
              onClick={() => setFilter('CAUTION')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filter === 'CAUTION'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Caution Areas ({counts.caution})</span>
            </button>
          </div>
        </div>

        {/* Legend Notification Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-700">Interactive Highlighting Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border-b-2 border-rose-500">
                Red Highlight
              </span>
              <span className="text-slate-500">= Severe / High Risk Traps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border-b-2 border-amber-500">
                Yellow Highlight
              </span>
              <span className="text-slate-500">= Caution / Moderate Risk</span>
            </div>
          </div>

          <div className="text-[11px] text-indigo-700 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Click any highlighted phrase to jump & decode</span>
          </div>
        </div>
      </div>

      {/* Document Text Display Area */}
      <div className="p-6 max-h-[500px] overflow-y-auto bg-slate-50/50 font-serif text-slate-800 text-sm leading-relaxed whitespace-pre-wrap select-text">
        {segments.map((segment, idx) => {
          if (segment.type === 'text') {
            return <span key={idx}>{segment.text}</span>;
          }

          const clause = segment.clause!;
          const isSevere = clause.risk === 'Severe' || clause.risk === 'High';
          const isCaution = clause.risk === 'Moderate';
          const isSelected = selectedClause?.id === clause.id || activeClauseId === clause.id;

          // Check if matches active filter
          if (filter === 'SEVERE' && !isSevere) {
            return <span key={idx}>{segment.text}</span>;
          }
          if (filter === 'CAUTION' && !isCaution) {
            return <span key={idx}>{segment.text}</span>;
          }

          return (
            <mark
              key={idx}
              onClick={() => handleClauseClick(clause)}
              title={`Click to decode: ${clause.title} (${clause.risk} Risk)`}
              className={`transition-all rounded-sm cursor-pointer mx-0.5 px-1 py-0.5 font-sans font-medium text-xs sm:text-sm inline-block ${
                isSevere
                  ? 'bg-rose-100 text-rose-950 border-b-2 border-rose-500 hover:bg-rose-200 shadow-2xs'
                  : 'bg-amber-100 text-amber-950 border-b-2 border-amber-500 hover:bg-amber-200 shadow-2xs'
              } ${
                isSelected
                  ? 'ring-2 ring-indigo-600 ring-offset-1 font-bold'
                  : ''
              }`}
            >
              <span className="font-bold underline mr-1 text-[11px]">
                [{isSevere ? '⚠️ SEVERE' : '⚡ CAUTION'}]
              </span>
              {segment.text}
            </mark>
          );
        })}
      </div>

      {/* Interactive Bottom Inspection Preview Drawer */}
      {selectedClause && (
        <div className="p-5 bg-linear-to-r from-slate-900 to-indigo-950 text-white border-t border-slate-800 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  selectedClause.risk === 'Severe' || selectedClause.risk === 'High'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}>
                  {selectedClause.risk} Risk Detected
                </span>
                <h4 className="text-sm font-bold text-white">
                  {selectedClause.title}
                </h4>
              </div>

              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-amber-300 block mb-1">
                  Plain-English Translation:
                </span>
                {selectedClause.simplifiedMeaning}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-400/20 text-rose-200 text-[11px]">
                  <span className="font-bold text-rose-300 block">Pitfall Avoided:</span>
                  {selectedClause.potentialPitfall}
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 text-[11px]">
                  <span className="font-bold text-emerald-300 block">Proposed Amendment:</span>
                  {selectedClause.recommendation}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <button
                onClick={() => onJumpToClause(selectedClause.id)}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
              >
                <span>Jump to Evaluation Card</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {onSelectForPlaybook && (
                <button
                  onClick={() => onSelectForPlaybook(selectedClause)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft Counter-Proposal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
