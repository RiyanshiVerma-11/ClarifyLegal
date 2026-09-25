import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  FileText, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Settings2, 
  RefreshCw, 
  User, 
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react';
import { ChatbotMessage, ChatbotRolePreset, ContractAnalysisResult } from '../types';

interface GeminiChatbotProps {
  currentAnalysis: ContractAnalysisResult | null;
  onNavigateToAnalyzer?: () => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentAnalysis,
}) => {
  // Model and Role Selection
  // Complex tasks: gemini-3.1-pro-preview
  // General tasks: gemini-3.5-flash
  // Fast tasks: gemini-3.1-flash-lite
  const [selectedRole, setSelectedRole] = useState<ChatbotRolePreset>('general');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  
  // Custom system instruction toggle & state
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  
  // Document context toggle
  const [includeDocumentContext, setIncludeDocumentContext] = useState<boolean>(true);

  // Chat message history
  const [messages, setMessages] = useState<ChatbotMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `### Welcome to ClarifyLegal Gemini Chatbot ⚖️
I am your interactive, multi-turn AI legal advisor powered by Google's latest Gemini models.

**How I can assist you right now:**
- **Audit specific clauses** for hidden liabilities, uncapped indemnities, or unilateral terms.
- **Draft attorney-grade counter-proposals** with redlined language tailored to your goals.
- **Translate dense legal Latin & jargon** into clear, 5th-grade plain English.
- **Reason through complex statutory protections** (tenants, freelance IP, non-competes).

Choose your task profile above: **Complex Reasoning** (Gemini Pro), **General Tasks** (Gemini 3.5 Flash), or **Rapid Tasks** (Gemini 3.1 Flash-Lite).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.5-flash',
        rolePreset: 'general',
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea smoothly up to 120px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 40), 120)}px`;
    }
  }, [inputPrompt]);

  // Synchronize model when role preset changes
  const handleRoleChange = (role: ChatbotRolePreset) => {
    setSelectedRole(role);
    if (role === 'complex') {
      setSelectedModel('gemini-3.1-pro-preview');
    } else if (role === 'fast') {
      setSelectedModel('gemini-3.1-flash-lite');
    } else {
      setSelectedModel('gemini-3.5-flash');
    }
  };

  // Quick suggestion prompts
  const suggestionPrompts = [
    {
      title: 'Audit Indemnification',
      desc: 'Check if my indemnity clause is uncapped or unilateral',
      role: 'complex' as ChatbotRolePreset,
      prompt: currentAnalysis 
        ? `Audit the indemnification and liability terms in "${currentAnalysis.documentTitle}". Are there uncapped exposures?`
        : 'What are the red flags of an uncapped indemnification clause, and how do I cap it to fees paid?'
    },
    {
      title: 'Counter-Proposal Language',
      desc: 'Draft balanced language for automatic renewal',
      role: 'general' as ChatbotRolePreset,
      prompt: 'Draft a polite, firm counter-proposal clause to replace an automatic 1-year renewal trap with a standard month-to-month term with 30-day notice.'
    },
    {
      title: 'Explain In Plain English',
      desc: 'Translate consequential damages waiver',
      role: 'fast' as ChatbotRolePreset,
      prompt: 'Explain what a waiver of consequential damages and lost profits means in plain English in 2 short bullet points.'
    },
    {
      title: 'California IP Assignment',
      desc: 'Protect pre-existing code under Labor Code § 2870',
      role: 'complex' as ChatbotRolePreset,
      prompt: 'In a freelance software agreement, how do I carve out my open-source libraries and pre-existing code under California Labor Code § 2870?'
    }
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputPrompt).trim();
    if (!textToSend || isLoading) return;

    setActiveError(null);
    setInputPrompt('');

    const userMessage: ChatbotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append user message immediately
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsLoading(true);

    // Prepare active document context if toggled and available
    let docContextString = '';
    if (includeDocumentContext && currentAnalysis) {
      docContextString = `DOCUMENT TITLE: ${currentAnalysis.documentTitle}
DOCUMENT TYPE: ${currentAnalysis.documentType}
OVERALL RISK: ${currentAnalysis.riskScore}/100 (${currentAnalysis.riskLevel})
EXECUTIVE SUMMARY: ${currentAnalysis.summary}
KEY CRITICAL CLAUSES IDENTIFIED:
${currentAnalysis.criticalClauses.map((c, i) => `${i+1}. [${c.title} - Risk: ${c.risk}]
Excerpt: "${c.originalExcerpt}"
Meaning: ${c.simplifiedMeaning}
Pitfall: ${c.potentialPitfall}
Recommendation: ${c.recommendation}`).join('\n\n')}`;
    }

    try {
      // Map history for Gemini API: [{ role: 'user' | 'assistant', content }]
      const apiMessages = updatedHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          role: selectedRole,
          customSystemInstruction: customInstruction,
          documentContext: docContextString,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      } else if (data.fallback) {
        setMessages(prev => [...prev, data.fallback]);
      } else {
        throw new Error('Received malformed chat response');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setActiveError(err.message || 'Failed to send message. Please retry.');
      // Add helpful fallback assistant message
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ I encountered a temporary connection issue. You can retry your message or try switching to **General Tasks (Gemini 3.5 Flash)** or **Rapid Tasks (Gemini 3.1 Flash-Lite)**.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: 'offline-error-handler',
          rolePreset: selectedRole,
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: 'Chat history cleared. How can I help you analyze, clarify, or negotiate your legal documents today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: selectedModel,
          rolePreset: selectedRole,
        }
      ]);
    }
  };

  const handleExportChat = () => {
    const text = messages.map(m => `### ${m.role === 'user' ? 'You' : 'ClarifyLegal (' + (m.model || 'Gemini') + ')'} [${m.timestamp}]\n\n${m.content}\n\n---\n`).join('\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClarifyLegal-Chat-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full max-w-5xl mx-auto space-y-2">
      {/* Sleek, Ultra-Compact Top Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl px-3 py-2 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Brand & Model Switcher Pills */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <Bot className="w-4 h-4" />
            </div>

            {/* Segmented Model Pills */}
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 flex items-center">
              <button
                onClick={() => handleRoleChange('complex')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRole === 'complex'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Deep forensic legal reasoning with gemini-3.1-pro-preview"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Pro</span>
              </button>

              <button
                onClick={() => handleRoleChange('general')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRole === 'general'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Balanced contract review with gemini-3.5-flash"
              >
                <Sparkles className="w-3 h-3" />
                <span>3.5 Flash</span>
              </button>

              <button
                onClick={() => handleRoleChange('fast')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRole === 'fast'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Rapid clause triage with gemini-3.1-flash-lite"
              >
                <Zap className="w-3 h-3" />
                <span>Flash-Lite</span>
              </button>
            </div>

            {/* Model Dropdown Override */}
            <div className="relative hidden md:block">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-mono py-1 pl-2 pr-6 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                title="Active Model Engine"
              >
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Right: Document Context Pill & Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Linked Document Pill */}
            {currentAnalysis && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 max-w-[220px] sm:max-w-[280px]">
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-medium truncate text-xs" title={currentAnalysis.documentTitle}>
                  {currentAnalysis.documentTitle}
                </span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                  currentAnalysis.riskLevel === 'Severe' ? 'bg-rose-100 text-rose-700' :
                  currentAnalysis.riskLevel === 'High' ? 'bg-amber-100 text-amber-700' :
                  currentAnalysis.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {currentAnalysis.riskScore}/100
                </span>
                <button
                  onClick={() => setIncludeDocumentContext(!includeDocumentContext)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer shrink-0 transition-colors ${
                    includeDocumentContext ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                  }`}
                  title={includeDocumentContext ? 'Document context injected. Click to exclude.' : 'Document context excluded. Click to inject.'}
                >
                  {includeDocumentContext ? 'Context On' : 'Off'}
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-1 pl-1">
              <button
                onClick={() => setShowCustomInstructions(!showCustomInstructions)}
                className={`p-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  showCustomInstructions || customInstruction
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
                title="Configure custom persona instructions"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleExportChat}
                className="p-1.5 rounded-lg bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                title="Export conversation as Markdown (.md)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg bg-white text-slate-500 border border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-medium transition-colors cursor-pointer"
                title="Clear conversation history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Custom System Instructions Drawer */}
        {showCustomInstructions && (
          <div className="mt-2 pt-2 border-t border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Settings2 className="w-3 h-3 text-indigo-600" />
                <span>Custom Persona & System Instructions</span>
              </label>
              <span className="text-[10px] text-slate-500">
                Active role: {selectedRole === 'complex' ? 'Forensic Legal Counsel' : selectedRole === 'fast' ? 'Rapid Clause Assistant' : 'Contract Navigator'}
              </span>
            </div>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. You are advising a freelance developer in California. Focus on IP rights, ownership of developer tools, Net-30 payment, and indemnity caps."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />
          </div>
        )}
      </div>

      {/* Main Messages Area (Takes all remaining screen height) */}
      <div 
        tabIndex={0}
        aria-label="Conversation Messages Thread"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 space-y-5 shadow-xs focus:outline-none"
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 sm:gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs p-3.5 sm:p-4 shadow-xs max-w-[85%] sm:max-w-[75%]'
                    : 'bg-slate-50/90 text-slate-800 border border-slate-200/90 rounded-tl-xs p-4 sm:p-5 shadow-xs w-full max-w-[95%] sm:max-w-[90%]'
                }`}
              >
                {/* Bubble Header */}
                <div className={`flex items-center justify-between gap-3 mb-2 pb-1.5 border-b text-[11px] ${
                  isUser ? 'border-indigo-400/40 text-indigo-100' : 'border-slate-200/80 text-slate-500'
                }`}>
                  <span className="font-semibold tracking-wide">
                    {isUser ? 'You' : 'ClarifyLegal Advisor'}
                  </span>
                  <div className="flex items-center space-x-2">
                    {message.model && (
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                        isUser 
                          ? 'bg-indigo-700/60 text-indigo-100 border border-indigo-400/30' 
                          : 'bg-white text-slate-600 border border-slate-200 shadow-2xs'
                      }`}>
                        {message.model}
                      </span>
                    )}
                    <span>{message.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="hover:text-slate-900 p-0.5 rounded transition-colors cursor-pointer"
                        title="Copy message to clipboard"
                        aria-label="Copy assistant response"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Markdown Body with Clean Spacing & Wrapped Code/Tables */}
                <div className={`text-sm leading-relaxed break-words ${
                  isUser ? 'text-white' : 'text-slate-800'
                }`}>
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2.5 last:mb-0" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-base font-bold text-slate-900 mt-3 mb-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-slate-900 mt-2.5 mb-1.5" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mt-2 mb-1" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2.5 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                      strong: ({ node, ...props }) => <strong className={`font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`} {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-3 border-indigo-400 pl-3 my-2 italic text-slate-600 bg-indigo-50/40 py-1 rounded-r" {...props} />
                      ),
                      code: ({ node, className, children, ...props }: any) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-900 font-mono text-[11px]" {...props}>
                            {children}
                          </code>
                        ) : (
                          <div className="overflow-x-auto my-2 rounded-xl bg-slate-900 text-slate-100 p-3 text-xs font-mono whitespace-pre-wrap break-words">
                            <code {...props}>{children}</code>
                          </div>
                        );
                      },
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-2 rounded-lg border border-slate-200">
                          <table className="w-full text-xs text-left divide-y divide-slate-200" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => <th className="bg-slate-100 px-3 py-2 font-semibold text-slate-700" {...props} />,
                      td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-slate-100" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* Suggestion Starter Prompts (Embedded right inside the welcome view) */}
        {messages.length <= 1 && !isLoading && (
          <div className="pt-2 pb-1">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Suggested Prompts to Get Started:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestionPrompts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleRoleChange(item.role);
                    handleSendMessage(item.prompt);
                  }}
                  className="text-left bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl p-3 transition-all cursor-pointer group"
                >
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700 flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-slate-600 font-semibold border border-slate-200">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs max-w-sm">
              <div className="flex items-center space-x-2 text-xs text-indigo-700">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span className="font-semibold">
                  {selectedRole === 'complex' ? 'Reasoning deeply with Gemini Pro...' : 
                   selectedRole === 'fast' ? 'Generating rapid answer with Flash-Lite...' :
                   'Synthesizing legal analysis with Gemini 3.5 Flash...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sleek Floating Bottom Input Capsule */}
      <div className="shrink-0 bg-white border border-slate-300/90 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl p-2 sm:p-2.5 shadow-sm transition-all">
        {activeError && (
          <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{activeError}</span>
            </div>
            <button 
              onClick={() => setActiveError(null)} 
              className="text-rose-600 hover:text-rose-900 text-xs font-bold px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a legal question, audit clauses, or draft counter-proposals (${selectedModel})...`}
            rows={1}
            className="flex-1 bg-transparent border-0 px-2.5 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none max-h-28 leading-relaxed font-sans"
            style={{ minHeight: '38px' }}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className={`w-10 h-10 rounded-xl font-semibold transition-all flex items-center justify-center shadow-xs shrink-0 cursor-pointer ${
              !inputPrompt.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95'
            }`}
            title="Send message (Enter)"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Footer Line with Status Indicator */}
        <div className="flex items-center justify-between pt-1.5 px-2 text-[11px] text-slate-400 border-t border-slate-100 mt-1">
          <div className="flex items-center space-x-2">
            <span>Press <kbd className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">Enter</kbd> to send, <kbd className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">Shift+Enter</kbd> for newline</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-600 text-[11px]">{selectedModel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
