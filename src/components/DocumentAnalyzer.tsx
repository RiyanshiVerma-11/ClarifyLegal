import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Copy, 
  Check, 
  Filter, 
  Printer, 
  RotateCcw,
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Download,
  FileDown,
  Award,
  Eye,
  Columns,
  Layers,
  FileUp,
  File,
  X,
  FileCode
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ContractAnalysisResult, CriticalClause, DocumentRiskLevel } from '../types';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';
import { InteractiveDocumentViewer } from './InteractiveDocumentViewer';
import { parseDocumentFile, ParsedFileResult } from '../utils/fileParser';
import { AmendedContractExportModal } from './AmendedContractExportModal';

interface DocumentAnalyzerProps {
  currentAnalysis: ContractAnalysisResult | null;
  onAnalyze: (text: string, title: string, perspective: string) => Promise<void>;
  isLoading: boolean;
  onReset: () => void;
  onSelectForPlaybook: (clause: CriticalClause) => void;
}

export const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({
  currentAnalysis,
  onAnalyze,
  isLoading,
  onReset,
  onSelectForPlaybook,
}) => {
  const [inputText, setInputText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [userPerspective, setUserPerspective] = useState('Tenant / Signer / Contractor');
  const [selectedClauseFilter, setSelectedClauseFilter] = useState<'ALL' | DocumentRiskLevel>('ALL');
  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({});
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [copiedRedlines, setCopiedRedlines] = useState(false);
  const [activeHighlightedClauseId, setActiveHighlightedClauseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'highlighter' | 'cards'>('unified');
  const [isAmendedModalOpen, setIsAmendedModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedFileInfo, setParsedFileInfo] = useState<ParsedFileResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processUploadedFile = async (file: File) => {
    setIsParsingFile(true);
    try {
      const result = await parseDocumentFile(file);
      setParsedFileInfo(result);
      setInputText(result.text);
      if (!docTitle.trim()) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      console.error('File parsing error:', err);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleClearUploadedFile = () => {
    setParsedFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_CONTRACTS.find((s) => s.id === sampleId);
    if (sample) {
      setInputText(sample.content);
      setDocTitle(sample.title);
      if (sample.category.includes('Tenancy')) {
        setUserPerspective('Tenant (Jane Doe)');
      } else if (sample.category.includes('Freelance')) {
        setUserPerspective('Independent Contractor (Marcus)');
      } else if (sample.category.includes('Employment')) {
        setUserPerspective('Employee / Candidate');
      } else {
        setUserPerspective('Consumer / End User');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAnalyze(inputText, docTitle.trim() || 'Uploaded Legal Document', userPerspective);
  };

  const toggleClauseExpand = (id: string) => {
    setExpandedClauses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleActionCheck = (id: string) => {
    setCheckedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySummary = () => {
    if (!currentAnalysis) return;
    const text = `ClarifyLegal Summary: ${currentAnalysis.documentTitle}\nRisk Score: ${currentAnalysis.riskScore}/100 (${currentAnalysis.riskLevel})\n\n${currentAnalysis.summary}`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleCopyRedlines = () => {
    if (!currentAnalysis) return;
    const clauseRedlines = currentAnalysis.criticalClauses
      .map((c, i) => {
        return `[Redline #${i + 1}] ${c.title} (${c.risk.toUpperCase()} RISK)
ORIGINAL LANGUAGE:
"${c.originalExcerpt}"

PROPOSED COUNTER-AMENDMENT:
"${c.recommendation}"

WHY THIS MATTERS / PITFALL AVOIDED:
${c.potentialPitfall}
`;
      })
      .join('\n' + '='.repeat(50) + '\n\n');

    const checklist = currentAnalysis.actionChecklist
      .map((a, i) => `[ ] Action ${i + 1} (${a.priority.toUpperCase()}): ${a.action}\n    Context: ${a.explanation}`)
      .join('\n');

    const fullRedlinesText = `=== CLARIFYLEGAL RECOMMENDED REDLINES & NEGOTIATION DRAFT ===
Document: ${currentAnalysis.documentTitle} (${currentAnalysis.documentType})
Overall Risk Score: ${currentAnalysis.riskScore}/100 [${currentAnalysis.riskLevel} Risk]
Parties: ${currentAnalysis.keyParties.party1} vs ${currentAnalysis.keyParties.party2}
Analyzed Date: ${new Date(currentAnalysis.analyzedAt).toLocaleDateString()}

EXECUTIVE PLAIN-ENGLISH SUMMARY:
${currentAnalysis.summary}

==================================================
CLAUSE-BY-CLAUSE RECOMMENDED REDLINES:
==================================================

${clauseRedlines}

==================================================
PRE-SIGNING ACTION CHECKLIST:
==================================================
${checklist}

---
Generated by ClarifyLegal AI. Provided for legal literacy and educational review.`;

    navigator.clipboard.writeText(fullRedlinesText);
    setCopiedRedlines(true);
    setTimeout(() => setCopiedRedlines(false), 2500);
  };

  const handleDownloadExecutiveBrief = () => {
    if (!currentAnalysis) return;
    window.print();
  };

  const handleJumpToClause = (clauseId: string) => {
    setActiveHighlightedClauseId(clauseId);
    setExpandedClauses((prev) => ({ ...prev, [clauseId]: true }));
    
    if (viewMode === 'highlighter') {
      setViewMode('unified');
    }

    setTimeout(() => {
      const el = document.getElementById(`clause-card-${clauseId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      setActiveHighlightedClauseId(null);
    }, 3500);
  };

  const getCategoryBreakdown = () => {
    if (!currentAnalysis) return [];
    
    if (currentAnalysis.categoryRisks) {
      return [
        {
          id: 'financial',
          name: 'Financial Liability',
          score: currentAnalysis.categoryRisks.financialLiability.score,
          level: currentAnalysis.categoryRisks.financialLiability.level,
          flaggedCount: currentAnalysis.categoryRisks.financialLiability.flaggedCount,
          keyFinding: currentAnalysis.categoryRisks.financialLiability.keyFinding,
          icon: DollarSign,
          color: 'rose',
        },
        {
          id: 'ip',
          name: 'IP Rights & Ownership',
          score: currentAnalysis.categoryRisks.ipRights.score,
          level: currentAnalysis.categoryRisks.ipRights.level,
          flaggedCount: currentAnalysis.categoryRisks.ipRights.flaggedCount,
          keyFinding: currentAnalysis.categoryRisks.ipRights.keyFinding,
          icon: Award,
          color: 'indigo',
        },
        {
          id: 'termination',
          name: 'Termination & Renewal',
          score: currentAnalysis.categoryRisks.termination.score,
          level: currentAnalysis.categoryRisks.termination.level,
          flaggedCount: currentAnalysis.categoryRisks.termination.flaggedCount,
          keyFinding: currentAnalysis.categoryRisks.termination.keyFinding,
          icon: Clock,
          color: 'amber',
        },
        {
          id: 'penalties',
          name: 'Hidden Penalties & Traps',
          score: currentAnalysis.categoryRisks.hiddenPenalties.score,
          level: currentAnalysis.categoryRisks.hiddenPenalties.level,
          flaggedCount: currentAnalysis.categoryRisks.hiddenPenalties.flaggedCount,
          keyFinding: currentAnalysis.categoryRisks.hiddenPenalties.keyFinding,
          icon: ShieldAlert,
          color: 'red',
        },
      ];
    }

    const hasFinancialIssues = currentAnalysis.financialTerms?.some(f => f.isUnusualOrAggressive);
    const hasSevereClauses = currentAnalysis.criticalClauses.some(c => c.risk === 'Severe');
    const isLease = currentAnalysis.documentType.toLowerCase().includes('lease') || currentAnalysis.documentTitle.toLowerCase().includes('lease');

    return [
      {
        id: 'financial',
        name: 'Financial Liability',
        score: hasFinancialIssues ? 84 : (currentAnalysis.riskScore > 60 ? 74 : 35),
        level: (hasFinancialIssues ? 'Severe' : (currentAnalysis.riskScore > 60 ? 'High' : 'Low')) as DocumentRiskLevel,
        flaggedCount: currentAnalysis.financialTerms?.length || 2,
        keyFinding: hasFinancialIssues 
          ? 'Aggressive monetary deductions, repair liabilities, and security deposit retention risks detected.' 
          : 'Standard financial commitments without unusual fee escalations.',
        icon: DollarSign,
        color: 'rose',
      },
      {
        id: 'ip',
        name: 'IP Rights & Ownership',
        score: isLease ? 12 : (currentAnalysis.riskScore > 65 ? 80 : 25),
        level: (isLease ? 'Low' : (currentAnalysis.riskScore > 65 ? 'High' : 'Low')) as DocumentRiskLevel,
        flaggedCount: isLease ? 0 : 2,
        keyFinding: isLease
          ? 'Not applicable for residential tenancy agreements; no adverse intellectual property surrenders.'
          : 'Perpetual assignment clauses may jeopardize ownership of pre-existing background code and portfolios.',
        icon: Award,
        color: 'indigo',
      },
      {
        id: 'termination',
        name: 'Termination & Renewal',
        score: hasSevereClauses ? 90 : 45,
        level: (hasSevereClauses ? 'Severe' : 'Moderate') as DocumentRiskLevel,
        flaggedCount: currentAnalysis.deadlinesAndMilestones?.length || 2,
        keyFinding: hasSevereClauses
          ? 'Strict opt-out notice windows trigger automatic long-term renewals or steep early-exit penalties.'
          : 'Balanced notice periods with standard opportunity to cure alleged contract breaches.',
        icon: Clock,
        color: 'amber',
      },
      {
        id: 'penalties',
        name: 'Hidden Penalties & Traps',
        score: currentAnalysis.riskScore >= 70 ? 76 : (currentAnalysis.riskScore >= 40 ? 50 : 20),
        level: (currentAnalysis.riskScore >= 70 ? 'High' : (currentAnalysis.riskScore >= 40 ? 'Moderate' : 'Low')) as DocumentRiskLevel,
        flaggedCount: currentAnalysis.missingProtections?.length || 2,
        keyFinding: currentAnalysis.riskScore >= 70
          ? 'One-sided indemnification, waiver of statutory tenant/signer rights, and unilateral entry terms.'
          : 'Customary dispute resolution clauses with mutual liability guardrails.',
        icon: ShieldAlert,
        color: 'red',
      },
    ];
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter clauses
  const filteredClauses = currentAnalysis?.criticalClauses.filter((clause) => {
    if (selectedClauseFilter === 'ALL') return true;
    return clause.risk === selectedClauseFilter;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* If No Analysis Result: Show Input Form */}
      {!currentAnalysis && !isLoading && (
        <div className="space-y-6">
          {/* Header & Description */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GenAI Document Summarizer & Risk Radar</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Analyze Any Contract or Legal Document
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Paste your rental lease, freelance NDA, employment offer, or terms of service. Our GenAI model will translate all legalese into plain English, spotlight high-risk liability traps, and generate an actionable checklist before you sign.
              </p>
            </div>

            {/* Quick Sample Selector Bar */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Quick Start with Real-World Samples:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SAMPLE_CONTRACTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample.id)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">{sample.category}</span>
                      <span className="text-[10px] text-rose-700 font-semibold">{sample.riskExpectation} Risk</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 truncate">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      Click to load text
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document Title / Description
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. 12-Month Lease Agreement - 442 Elmwood Ave"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Role / Perspective in this Agreement
                </label>
                <input
                  type="text"
                  value={userPerspective}
                  onChange={(e) => setUserPerspective(e.target.value)}
                  placeholder="e.g. Tenant, Freelancer, Employee, Consumer"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Visual Drag & Drop Document Ingestion Zone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Upload or Paste Legal Document
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold text-indigo-600">Supported:</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">.txt</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">.pdf</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">.docx</span>
                </div>
              </div>

              {/* Drag-and-Drop Target Card */}
              <div
                id="analyzer-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer select-none ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/80 scale-[1.005] ring-4 ring-indigo-100' 
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.doc,.md,.rtf"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="analyzer-file-input"
                />

                {isParsingFile ? (
                  <div className="py-4 flex flex-col items-center justify-center space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Extracting contract text...</p>
                    <p className="text-[11px] text-slate-500">Parsing structure, clauses, and typography</p>
                  </div>
                ) : (
                  <div className="py-2 flex flex-col items-center justify-center space-y-2">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                      isDragging ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                    }`}>
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isDragging ? 'Drop your contract here' : 'Drop contract file here, or browse files'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Native browser ingestion for PDF, DOCX, Word, or plain text agreements
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                        ⚡ Instant Local Ingestion
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        No Document Upload Size Limits
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Parsing Preview Banner if file parsed */}
              {parsedFileInfo && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold uppercase">
                      {parsedFileInfo.extension}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                          {parsedFileInfo.fileName}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                          {parsedFileInfo.characterCount.toLocaleString()} chars
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          ~{parsedFileInfo.wordCount.toLocaleString()} words
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5 italic font-serif">
                        "{parsedFileInfo.previewSnippet}..."
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearUploadedFile}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Contract Text Editor / Paste View</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-400">{inputText.length.toLocaleString()} characters</span>
                    {inputText.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputText('');
                          setParsedFileInfo(null);
                        }}
                        className="text-slate-500 hover:text-rose-600 underline font-medium cursor-pointer"
                      >
                        Clear text
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste the full text of your agreement, clauses, terms of service, or lease here, or drop a file above..."
                  rows={10}
                  className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setDocTitle('');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Analyze & Summarize Contract</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 animate-pulse">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">ClarifyLegal GenAI Engine at Work</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Evaluating liability shifts, translating archaic terminology into plain English, and calculating risk metrics...
            </p>
          </div>

          <div className="space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Scanning clauses and obligations</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Detecting hidden indemnity and automatic renewal traps</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-700 font-semibold animate-pulse">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Synthesizing plain-English summary & redlines...</span>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {currentAnalysis && !isLoading && (
        <div className="space-y-6 print:space-y-4">
          {/* Top Results Action Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{currentAnalysis.documentTitle}</h2>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {currentAnalysis.documentType}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Analyzed {new Date(currentAnalysis.analyzedAt).toLocaleDateString()} • Perspective: {currentAnalysis.keyParties.userPerspective}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* One-Click Clean Amended Draft Export */}
              <button
                id="analyzer-export-clean-amended-btn"
                onClick={() => setIsAmendedModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ring-1 ring-emerald-500"
                title="Export clean amended contract replacing red risks with safe counter-clauses"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Export Clean Amended Contract</span>
              </button>

              {/* Download PDF / Executive Brief */}
              <button
                id="analyzer-download-pdf-btn"
                onClick={handleDownloadExecutiveBrief}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
                title="Download PDF or Print Executive Brief"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF / Executive Brief</span>
              </button>

              {/* Copy Redlines */}
              <button
                id="analyzer-copy-redlines-btn"
                onClick={handleCopyRedlines}
                className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200"
                title="Copy all clause redlines and amendments to clipboard"
              >
                {copiedRedlines ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{copiedRedlines ? 'Redlines Copied!' : 'Copy Redlines'}</span>
              </button>

              {/* Copy Summary */}
              <button
                onClick={handleCopySummary}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedNotification ? 'Copied' : 'Copy Summary'}</span>
              </button>

              {/* Reset / New */}
              <button
                onClick={onReset}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Analysis</span>
              </button>
            </div>
          </div>

          {/* Risk Score & Executive Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Gauge Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Legal Risk</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    currentAnalysis.riskScore >= 70
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : currentAnalysis.riskScore >= 40
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {currentAnalysis.riskLevel} Risk
                  </span>
                </div>

                <div className="my-4 text-center">
                  <div className="inline-flex items-baseline gap-1">
                    <span className={`text-5xl font-extrabold tracking-tight ${
                      currentAnalysis.riskScore >= 70
                        ? 'text-rose-600'
                        : currentAnalysis.riskScore >= 40
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {currentAnalysis.riskScore}
                    </span>
                    <span className="text-slate-400 font-bold text-lg">/100</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {currentAnalysis.riskScore >= 70
                      ? 'Significant one-sided traps detected. Do not sign without redlines.'
                      : currentAnalysis.riskScore >= 40
                      ? 'Standard terms with a few noteworthy liabilities to clarify.'
                      : 'Relatively balanced agreement with standard industry protections.'}
                  </p>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-3">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentAnalysis.riskScore >= 70
                        ? 'bg-rose-500'
                        : currentAnalysis.riskScore >= 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${currentAnalysis.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Parties:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                    {currentAnalysis.keyParties.party1} vs {currentAnalysis.keyParties.party2}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Clauses Flagged:</span>
                  <span className="font-semibold text-slate-700">
                    {currentAnalysis.criticalClauses.length} evaluated
                  </span>
                </div>
              </div>
            </div>

            {/* Executive Plain English Summary (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Executive Plain-English Breakdown</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">What this actually means for you</span>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 max-w-none">
                  <Markdown>{currentAnalysis.summary}</Markdown>
                </div>
              </div>

              {/* Missing Protections Alert if any */}
              {currentAnalysis.missingProtections && currentAnalysis.missingProtections.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing Customary Protections (Not Present in this Contract):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900/90 pl-1">
                    {currentAnalysis.missingProtections.map((missing, idx) => (
                      <li key={idx}>{missing}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Visual Category Risk Breakdown (Financial Liability, IP Rights, Termination, Hidden Penalties) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Visual Category Risk Breakdown
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Multi-dimensional vulnerability radar across financial, IP, termination & penalty categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getCategoryBreakdown().map((cat) => {
                const Icon = cat.icon;
                const isSevere = cat.level === 'Severe';
                const isHigh = cat.level === 'High';
                const isModerate = cat.level === 'Moderate';
                
                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isSevere
                        ? 'bg-rose-50/40 border-rose-200'
                        : isHigh
                        ? 'bg-rose-50/20 border-rose-200/80'
                        : isModerate
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-emerald-50/30 border-emerald-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSevere || isHigh
                            ? 'bg-rose-100 text-rose-700'
                            : isModerate
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          isSevere
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : isHigh
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isModerate
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {cat.level}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className={`text-2xl font-extrabold ${
                            isSevere || isHigh ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {cat.score}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/100</span>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isSevere ? 'bg-red-600' : isHigh ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                        {cat.keyFinding}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-medium flex items-center justify-between">
                      <span>{cat.flaggedCount} factor(s) flagged</span>
                      <button
                        type="button"
                        onClick={() => setSelectedClauseFilter(cat.level)}
                        className="text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        Filter &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View Modes Switcher */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 pl-1">Inspection View:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('unified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'unified'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Unified Overview</span>
                </button>
                <button
                  onClick={() => setViewMode('highlighter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'highlighter'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-rose-600" />
                  <span>Document Risk Radar</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Clause Cards ({currentAnalysis.criticalClauses.length})</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5 pr-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Click any highlighted text to jump directly to its decoded plain-English explanation</span>
            </div>
          </div>

          {/* Inline Contextual Risk Highlighting: Interactive Document Viewer */}
          {(viewMode === 'unified' || viewMode === 'highlighter') && (
            <InteractiveDocumentViewer
              rawText={currentAnalysis.rawText || ''}
              criticalClauses={currentAnalysis.criticalClauses}
              onJumpToClause={handleJumpToClause}
              activeClauseId={activeHighlightedClauseId}
              onSelectForPlaybook={onSelectForPlaybook}
            />
          )}

          {/* Critical Clauses Section */}
          {(viewMode === 'unified' || viewMode === 'cards') && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <span>Clause-by-Clause Evaluation</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dense legal quotes decoded into 5th-grade plain English with practical pitfalls & amendment recommendations.
                  </p>
                </div>

                {/* Risk Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setSelectedClauseFilter('ALL')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      selectedClauseFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({currentAnalysis.criticalClauses.length})
                  </button>
                  <button
                    onClick={() => setSelectedClauseFilter('Severe')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      selectedClauseFilter === 'Severe' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Severe
                  </button>
                  <button
                    onClick={() => setSelectedClauseFilter('High')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      selectedClauseFilter === 'High' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    High
                  </button>
                  <button
                    onClick={() => setSelectedClauseFilter('Moderate')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      selectedClauseFilter === 'Moderate' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Moderate
                  </button>
                </div>
              </div>

              {/* Clause Cards List */}
              <div className="space-y-4">
                {filteredClauses.map((clause) => {
                  const isExpanded = !!expandedClauses[clause.id];
                  const isJumpTarget = activeHighlightedClauseId === clause.id;

                  return (
                    <div
                      key={clause.id}
                      id={`clause-card-${clause.id}`}
                      className={`rounded-xl border transition-all duration-300 p-5 scroll-mt-24 ${
                        isJumpTarget
                          ? 'ring-3 ring-indigo-500 shadow-lg ring-offset-2 bg-indigo-50/50'
                          : clause.risk === 'Severe'
                          ? 'border-red-300 bg-red-50/30'
                          : clause.risk === 'High'
                          ? 'border-rose-200 bg-rose-50/20'
                          : clause.risk === 'Moderate'
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            clause.risk === 'Severe'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : clause.risk === 'High'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : clause.risk === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {clause.risk} Risk
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{clause.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {clause.obligationType}
                          </span>
                          <button
                            onClick={() => toggleClauseExpand(clause.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Plain English Translation */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                            Plain-English Meaning:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white/80 p-3 rounded-lg border border-slate-200/70">
                            {clause.simplifiedMeaning}
                          </p>
                        </div>

                        {/* Pitfall & Recommendation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-200/70 text-xs">
                            <span className="font-bold text-rose-900 block mb-1">
                              Potential Pitfall (What could go wrong):
                            </span>
                            <p className="text-slate-700 leading-relaxed text-[11px]">
                              {clause.potentialPitfall}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-xs">
                            <span className="font-bold text-emerald-900 block mb-1">
                              Recommended Amendment / Redline:
                            </span>
                            <p className="text-slate-700 leading-relaxed text-[11px]">
                              {clause.recommendation}
                            </p>
                          </div>
                        </div>

                        {/* Original Excerpt (Collapsible or visible) */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Original Legal Text Excerpt:
                            </span>
                            <p className="text-xs font-mono italic text-slate-600 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200">
                              "{clause.originalExcerpt}"
                            </p>
                          </div>
                        )}

                        {/* Quick Action to Draft Counter-Proposal */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => onSelectForPlaybook(clause)}
                            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Draft Counter-Proposal for this Clause</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Financial Terms & Deadlines Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Terms */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Extracted Financial Terms & Penalties</h3>
              </div>

              {currentAnalysis.financialTerms && currentAnalysis.financialTerms.length > 0 ? (
                <div className="space-y-2.5">
                  {currentAnalysis.financialTerms.map((fin, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        fin.isUnusualOrAggressive ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{fin.item}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Trigger: {fin.condition}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold text-xs ${fin.isUnusualOrAggressive ? 'text-rose-700' : 'text-slate-800'}`}>
                          {fin.amountOrFormula}
                        </span>
                        {fin.isUnusualOrAggressive && (
                          <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Aggressive Fee</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No explicit monetary penalties found in provided text.</p>
              )}
            </div>

            {/* Deadlines & Notice Periods */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Critical Deadlines & Notice Periods</h3>
              </div>

              {currentAnalysis.deadlinesAndMilestones && currentAnalysis.deadlinesAndMilestones.length > 0 ? (
                <div className="space-y-2.5">
                  {currentAnalysis.deadlinesAndMilestones.map((dl, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{dl.event}</span>
                        <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {dl.timeline}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <span className="font-semibold text-rose-700">If missed: </span>
                        {dl.consequenceIfMissed}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No strict notice windows identified in excerpt.</p>
              )}
            </div>
          </div>

          {/* Actionable Next Steps Checklist */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Actionable Next Steps Before Signing</h3>
              </div>
              <span className="text-xs text-slate-500">
                Interactive Checklist
              </span>
            </div>

            <div className="space-y-2.5">
              {currentAnalysis.actionChecklist.map((item) => {
                const isChecked = !!checkedActions[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleActionCheck(item.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked ? 'bg-emerald-50/40 border-emerald-300 opacity-75' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isChecked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {item.action}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          item.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : item.priority === 'recommended'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Export Clean Amended Contract Modal */}
      <AmendedContractExportModal
        isOpen={isAmendedModalOpen}
        onClose={() => setIsAmendedModalOpen(false)}
        analysis={currentAnalysis}
      />
    </div>
  );
};
