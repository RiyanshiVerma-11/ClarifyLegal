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
  HelpCircle,
  Scale,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { ChatbotMessage, ChatbotRolePreset, ContractAnalysisResult } from '../types';

interface GeminiChatbotProps {
  currentAnalysis: ContractAnalysisResult | null;
  onNavigateToAnalyzer?: () => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentAnalysis,
  onNavigateToAnalyzer,
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
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-6xl mx-auto px-4 py-4 space-y-3">
      {/* Header Bar: Role, Model, Context and Action Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Gemini Legal Chatbot</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Multi-Turn AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Context-aware legal analysis, clause drafting, and negotiation advisory
              </p>
            </div>
          </div>

          {/* Role & Model Switcher Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center space-x-1">
              <button
                onClick={() => handleRoleChange('complex')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRole === 'complex'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Complex tasks: deep forensic reasoning with gemini-3.1-pro-preview"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                <span>Complex (Pro)</span>
              </button>

              <button
                onClick={() => handleRoleChange('general')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRole === 'general'
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="General tasks: balanced contract review with gemini-3.5-flash"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                <span>General (3.5 Flash)</span>
              </button>

              <button
                onClick={() => handleRoleChange('fast')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRole === 'fast'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Fast tasks: ultra-speedy clause checks with gemini-3.1-flash-lite"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-700" />
                <span>Fast (Flash-Lite)</span>
              </button>
            </div>

            {/* Model override dropdown */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-mono py-1.5 pl-2.5 pr-7 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                title="Active Gemini Model"
              >
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Utility Buttons */}
            <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
              <button
                onClick={() => setShowCustomInstructions(!showCustomInstructions)}
                className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  showCustomInstructions || customInstruction
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title="Configure custom system instructions for chatbot roles"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportChat}
                className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                title="Export conversation history (.md)"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleClearChat}
                className="p-2 rounded-xl bg-white text-slate-600 border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-medium transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Custom System Instructions Panel */}
        {showCustomInstructions && (
          <div className="mt-3 pt-3 border-t border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Custom Persona & System Instructions (Injected into Gemini)</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Preset active: {selectedRole === 'complex' ? 'Forensic Legal Counsel' : selectedRole === 'fast' ? 'Rapid Clause Assistant' : 'Contract Navigator'}
              </span>
            </div>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. You are advising a freelance React developer in New York negotiating with a Fortune 500 client. Emphasize ownership of developer tooling and ensure Net-30 payment with late interest."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />
          </div>
        )}

        {/* Current Document Context Badge */}
        {currentAnalysis && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500">Linked Document:</span>
              <span className="font-semibold text-slate-800">{currentAnalysis.documentTitle}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                currentAnalysis.riskLevel === 'Severe' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                currentAnalysis.riskLevel === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                currentAnalysis.riskLevel === 'Moderate' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Risk {currentAnalysis.riskScore}/100
              </span>
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDocumentContext}
                onChange={(e) => setIncludeDocumentContext(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span className={includeDocumentContext ? 'text-indigo-700 font-semibold' : 'text-slate-500'}>
                {includeDocumentContext ? 'Injecting Contract Context into Chat' : 'Context Excluded'}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Messages Thread Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-white border border-slate-200 p-4 space-y-4 shadow-xs">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[84%] md:max-w-[76%] rounded-2xl p-4 shadow-xs transition-all ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/90 rounded-tl-none'
                }`}
              >
                {/* Header info */}
                <div className={`flex items-center justify-between gap-3 mb-2 pb-1.5 border-b text-[11px] ${
                  isUser ? 'border-indigo-500/50 text-indigo-100' : 'border-slate-200/80 text-slate-500'
                }`}>
                  <span className="font-semibold tracking-wide">
                    {isUser ? 'You' : 'ClarifyLegal Advisor'}
                  </span>
                  <div className="flex items-center space-x-2">
                    {message.model && (
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                        isUser 
                          ? 'bg-indigo-700/60 text-indigo-100 border border-indigo-400/30' 
                          : 'bg-white text-slate-600 border border-slate-200 shadow-xs'
                      }`}>
                        {message.model}
                      </span>
                    )}
                    <span>{message.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="hover:text-slate-900 p-0.5 rounded transition-colors cursor-pointer"
                        title="Copy message"
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

                {/* Markdown Body */}
                <div className={`prose prose-xs sm:prose-sm max-w-none break-words leading-relaxed ${
                  isUser ? 'prose-invert text-white' : 'prose-slate text-slate-800'
                }`}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white p-0.5 shadow-xs flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs max-w-sm">
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

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {suggestionPrompts.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                handleRoleChange(item.role);
                handleSendMessage(item.prompt);
              }}
              className="text-left bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl p-2.5 transition-all shadow-xs cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700 flex items-center justify-between">
                <span>{item.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  {item.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Input Prompt Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        {activeError && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
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
            placeholder={`Ask a legal question, request clause redlining, or clarify contract terms (${selectedModel})...`}
            rows={2}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className={`p-3 rounded-xl font-semibold transition-all flex items-center justify-center shadow-xs cursor-pointer ${
              !inputPrompt.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95'
            }`}
            title="Send message (Enter)"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">Shift+Enter</kbd> for newline</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">Gemini Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
