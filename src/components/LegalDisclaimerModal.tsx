import React from 'react';
import { Scale, ShieldCheck, X } from 'lucide-react';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalDisclaimerModal: React.FC<LegalDisclaimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close disclaimer modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              ClarifyLegal Educational Notice
            </h3>
            <p className="text-xs text-slate-500">Legal literacy & document guidance</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed pt-1">
          <p>
            <strong>ClarifyLegal</strong> is a GenAI-powered literacy and document navigation platform engineered to simplify complex terminology, highlight high-risk clauses, and generate draft counter-proposals.
          </p>
          <p>
            ClarifyLegal does <strong>NOT</strong> provide formal legal representation, statutory legal counsel, or attorney-client privileged relationships. Contract analyses and generated text are for educational and informational comparison purposes only.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
            For critical litigation, corporate mergers, criminal matters, or complex high-liability disputes, always consult a qualified, licensed attorney in your jurisdiction.
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
