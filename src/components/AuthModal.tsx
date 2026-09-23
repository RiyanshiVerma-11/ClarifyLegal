import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2, 
  Award,
  Zap
} from 'lucide-react';
import { AuthUser } from '../types';
import { createMockJWT, setStoredUser, generateJudgeDemoUser } from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Pro Member' | 'Guest'>('Pro Member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJudge1ClickDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      const user = generateJudgeDemoUser();
      setIsLoading(false);
      onSuccess(user);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please provide your name.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const token = createMockJWT({
        sub: 'user-' + Date.now(),
        email,
        name: mode === 'signup' ? name : email.split('@')[0],
        role: role,
      });

      const user: AuthUser = {
        id: 'user-' + Date.now(),
        name: mode === 'signup' ? name : email.split('@')[0],
        email,
        role,
        token,
        createdAt: new Date().toISOString(),
      };

      setStoredUser(user);
      setIsLoading(false);
      onSuccess(user);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'signin' ? 'Sign In to ClarifyLegal' : 'Create Your Workspace Account'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Access AI contract analysis, document comparisons, and negotiation redlines.
          </p>
        </div>

        {/* PROMINENT HACKATHON JUDGE / EVALUATOR 1-CLICK DEMO ACCESS */}
        <div className="bg-linear-to-br from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Award className="w-3 h-3" />
              Hackathon Fast-Track
            </span>
            <span className="text-[11px] font-bold text-amber-900">Instant Demo Session</span>
          </div>

          <p className="text-xs text-slate-700 mb-3 leading-relaxed">
            Skip credential typing. Instantly issues a validated JWT authentication token and enters the workspace with preloaded sample contracts.
          </p>

          <button
            id="judge-1click-demo-btn"
            type="button"
            onClick={handleJudge1ClickDemo}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Zap className="w-4 h-4 fill-slate-950 text-slate-950 group-hover:scale-110 transition-transform" />
            <span>Judge / Evaluator 1-Click Demo Login</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-950 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Or continue with email
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {isLoading
                ? 'Validating Session...'
                : mode === 'signin'
                ? 'Sign In with JWT Session'
                : 'Create Account & Enter'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-1 border-t border-slate-100">
          {mode === 'signin' ? (
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
