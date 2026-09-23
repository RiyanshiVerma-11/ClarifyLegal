import React, { useState } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Send, 
  HelpCircle, 
  CheckCircle2, 
  Scale, 
  AlertCircle,
  Building2,
  Laptop,
  Briefcase,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';

interface LegalNavigatorProps {
  onAskQuestion: (question: string, context?: string) => Promise<{
    content: string;
    suggestedQuestions?: string[];
    actionChecklist?: string[];
  }>;
  currentDocumentContext?: string;
}

export const LegalNavigator: React.FC<LegalNavigatorProps> = ({
  onAskQuestion,
  currentDocumentContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `Hello! I am **ClarifyLegal Navigator**, your GenAI legal literacy and document guidance assistant.\n\nI can help you:\n- Understand common tenant and consumer rights\n- Navigate difficult contract clauses and negotiation tactics\n- Clarify statutory rules around security deposits, IP ownership, and non-competes\n- Outline practical next steps when dealing with a legal dispute\n\n*Note: I provide educational legal information and analysis, not formal legal representation or legal advice.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'Can my landlord deduct routine carpet wear from my security deposit?',
        'How do I protect my pre-existing code in a freelance contract?',
        'Is an 18-month non-compete clause legally enforceable?',
        'What should I do if a client refuses to pay a Net-30 invoice?'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(!!currentDocumentContext);

  const starterCategories = [
    {
      name: 'Tenant Rights',
      icon: Building2,
      questions: [
        'Can my landlord charge me for HVAC or plumbing repairs under $350?',
        'What is the legal deadline for returning an apartment security deposit?',
        'Can my landlord enter my apartment without 24 hours advance notice?'
      ]
    },
    {
      name: 'Freelancer & IP',
      icon: Laptop,
      questions: [
        'How can I ensure my client only owns the work after full invoice payment?',
        'What is the difference between "Work for Hire" and standard copyright licensing?',
        'What happens if a client takes 90 days to review deliverables without paying?'
      ]
    },
    {
      name: 'Employment & Non-Competes',
      icon: Briefcase,
      questions: [
        'Are broad geographic non-compete covenants enforceable in 2024-2026?',
        'Can an employer claim ownership over code I write on weekends on my own laptop?',
        'Does "at-will" employment prevent me from receiving promised commission?'
      ]
    }
  ];

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputValue;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const contextToSend = includeContext && currentDocumentContext ? currentDocumentContext : undefined;
      const response = await onAskQuestion(text, contextToSend);

      const assistantMsg: ChatMessage = {
        id: 'assistant-' + Date.now(),
        sender: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: response.suggestedQuestions,
        actionChecklist: response.actionChecklist,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'error-' + Date.now(),
        sender: 'assistant',
        content: 'I encountered an issue processing that query. Please try again or rephrase your legal question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        content: `Conversation reset. Ask any question about your contracts, rights, or legal options!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'Can my landlord charge me for HVAC or plumbing repairs under $350?',
          'How do I protect my pre-existing code in a freelance contract?',
          'Is an 18-month non-compete clause legally enforceable?'
        ]
      }
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Interactive AI Legal Knowledge Navigator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Ask Legal & Contract Questions
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Have questions about your rental rights, freelance invoice enforcement, non-competes, or terms of service? ClarifyLegal breaks down core legal doctrines into practical, plain-English guidance.
            </p>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 self-start cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chat Conversation (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[700px]">
          {/* Active Context Banner */}
          {currentDocumentContext && (
            <div className="bg-indigo-50/70 px-4 py-2 border-b border-indigo-100 flex items-center justify-between text-xs">
              <span className="text-indigo-900 font-medium truncate">
                Attached Context: <strong className="font-semibold">Current Document Analysis Loaded</strong>
              </span>
              <label className="flex items-center gap-1.5 text-indigo-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] font-semibold">Include in Q&A</span>
              </label>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 mt-1">
                    <Scale className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-3'
                  }`}
                >
                  <div className="space-y-2">
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {/* Action Checklist from Assistant if present */}
                  {msg.actionChecklist && msg.actionChecklist.length > 0 && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5 mt-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recommended Immediate Steps:</span>
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                        {msg.actionChecklist.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Suggested Follow-Up Questions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((sq, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(sq)}
                            className="text-left px-2.5 py-1 rounded-md bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 text-xs transition-colors cursor-pointer"
                          >
                            {sq} &rarr;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 text-right pt-1">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Synthesizing legal principles & practical guidance...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about rental leases, non-competes, invoice terms, consumer rights..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 text-amber-400" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Category Prompt Starters */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Popular Legal Inquiries
              </h3>
            </div>

            <div className="space-y-4">
              {starterCategories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cat.name}</span>
                    </div>

                    <div className="space-y-1.5">
                      {cat.questions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSend(q)}
                          className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-slate-700 text-xs transition-colors cursor-pointer leading-snug"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Ethical Guidance Note</span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-relaxed">
              Responses are generated for informational purposes to increase public legal literacy. They do not constitute an attorney-client relationship. For formal litigation or large transactions, always consult an attorney licensed in your state or country.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
