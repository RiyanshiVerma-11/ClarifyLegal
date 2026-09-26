import React, { useState } from 'react';
import { 
  Scale, 
  ArrowRight, 
  Menu, 
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface LandingNavbarProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onJudgeDemoLogin?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenAuth,
  onJudgeDemoLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-sm border border-slate-800 transition-transform group-hover:scale-105">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">ClarifyLegal</span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">Demystifying Legal Information</p>
            </div>
          </a>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7">
          <button
            onClick={() => scrollToSection('the-problem')}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/90 px-3 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>What is the Problem?</span>
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('use-cases')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Use Cases
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            About
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {onJudgeDemoLogin && (
            <button
              id="navbar-judge-demo-btn"
              onClick={onJudgeDemoLogin}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ring-1 ring-amber-400"
              title="Direct instant demo login for hackathon judges with preloaded contract analyses"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>⚡ Judge / Evaluator 1-Click Demo</span>
            </button>
          )}

          <button
            id="landing-signin-btn"
            onClick={() => onOpenAuth('signin')}
            className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Sign In
          </button>

          <button
            id="landing-getstarted-btn"
            onClick={() => onOpenAuth('signup')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white p-4 space-y-3">
          <button
            onClick={() => scrollToSection('the-problem')}
            className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>What is the Problem?</span>
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="block w-full text-left py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="block w-full text-left py-2 text-xs font-semibold text-slate-700"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('use-cases')}
            className="block w-full text-left py-2 text-xs font-semibold text-slate-700"
          >
            Use Cases
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="block w-full text-left py-2 text-xs font-semibold text-slate-700"
          >
            About
          </button>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {onJudgeDemoLogin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onJudgeDemoLogin();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>⚡ Judge / Evaluator 1-Click Demo</span>
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('signin');
              }}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold text-xs text-center"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('signup');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs text-center"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
