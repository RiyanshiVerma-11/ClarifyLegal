import React, { useState } from 'react';
import { 
  FileText, 
  ShieldAlert, 
  GitCompare, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  Scale, 
  Award,
  Zap,
  Building2,
  Briefcase,
  Laptop,
  Check,
  ShieldCheck,
  Lock,
  Star,
  Layers,
  FileCheck
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onJudgeDemoLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onJudgeDemoLogin,
}) => {
  const [activeTeaser, setActiveTeaser] = useState<'lease' | 'freelance' | 'terms'>('lease');

  const teaserData = {
    lease: {
      title: 'Residential Lease • Section 4: Maintenance',
      legalese: 'Tenant covenants and agrees to assume sole liability for any and all plumbing stoppages, heating servicing under $350, window glazing, and HVAC diagnostics regardless of whether such condition arises from ordinary wear, latent defect, or tenant tenancy.',
      plainEnglish: 'You are forced to pay for broken heaters and old pipes out of pocket, even if they broke from decades of landlord neglect.',
      risk: 'High Risk (Score: 82/100)',
      riskBadgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      action: 'Strike clause or amend to: "Landlord warrants implied habitability; tenant liable strictly for tenant-caused damage."'
    },
    freelance: {
      title: 'Contractor Agreement • Section 3: IP Assignment',
      legalese: 'Contractor unconditionally and irrevocably assigns in perpetuity throughout the universe all rights, title, and pre-existing code libraries, utility frameworks, and inventions conceived or utilized prior to or during the term of engagement.',
      plainEnglish: 'The client steals all your pre-existing starter tools and code libraries you built years before meeting them, and owns them forever.',
      risk: 'Severe Risk (Score: 91/100)',
      riskBadgeClass: 'bg-red-100 text-red-800 border-red-200',
      action: 'Carve out "Background IP" and condition deliverable assignment strictly upon receipt of full final payment.'
    },
    terms: {
      title: 'Consumer SaaS • Section 8: Dispute Resolution',
      legalese: 'All disputes shall be resolved exclusively through confidential individual binding arbitration seated in Dover, DE. You expressly waive any right to bring or participate in any class, collective, or representative proceeding.',
      plainEnglish: 'You give up your constitutional right to sue in court and cannot join other customers even if the company steals money from millions of people.',
      risk: 'Moderate Risk (Score: 68/100)',
      riskBadgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      action: 'Review mandatory 30-day arbitration opt-out address or negotiate small-claims court carve-out.'
    }
  };

  const currentTeaser = teaserData[activeTeaser];

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-200 bg-linear-to-b from-white via-slate-50 to-slate-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Headline & Subtext */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-slate-100 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demystifying Law for Everyday People & Small Teams</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Legal clarity for everyone, <br className="hidden sm:inline" />
              <span className="font-serif italic font-normal text-indigo-900">without the $500/hour bill.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              ClarifyLegal uses GenAI to decode impenetrable legalese, spotlight predatory traps in leases and freelance agreements, compare contract revisions, and generate diplomatic counter-proposals.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onJudgeDemoLogin && (
                <button
                  id="hero-judge-demo-btn"
                  onClick={onJudgeDemoLogin}
                  className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer ring-2 ring-amber-300"
                  title="Direct 1-click login as Hackathon Evaluator with preloaded lease and contractor analyses"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>⚡ Judge / Evaluator 1-Click Demo Login</span>
                </button>
              )}

              <button
                id="hero-getstarted-btn"
                onClick={() => onOpenAuth('signup')}
                className="px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <button
                id="hero-signin-btn"
                onClick={() => onOpenAuth('signin')}
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Sign In to Workspace</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                100% Free Public Access
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                JWT Authenticated Workspace
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero-Retention Privacy
              </span>
            </div>
          </div>

          {/* Interactive Live Hero Teaser Card */}
          <div className="mt-14 max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Interactive GenAI Translation Preview
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTeaser('lease')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTeaser === 'lease' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Apartment Lease
                </button>
                <button
                  onClick={() => setActiveTeaser('freelance')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTeaser === 'freelance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Freelance IP
                </button>
                <button
                  onClick={() => setActiveTeaser('terms')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTeaser === 'terms' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  SaaS Arbitration
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">{currentTeaser.title}</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border self-start ${currentTeaser.riskBadgeClass}`}>
                  {currentTeaser.risk}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Legalese */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Before: Dense Legal Contract Wording
                  </span>
                  <p className="font-mono text-slate-700 leading-relaxed italic text-[11px]">
                    "{currentTeaser.legalese}"
                  </p>
                </div>

                {/* ClarifyLegal Plain English */}
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    After: ClarifyLegal 5th-Grade Plain English
                  </span>
                  <p className="font-medium text-slate-900 leading-relaxed">
                    {currentTeaser.plainEnglish}
                  </p>
                </div>
              </div>

              {/* Actionable Solution */}
              <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-indigo-950 block mb-0.5">Actionable Counter-Proposal:</span>
                  <p className="text-indigo-900 leading-relaxed text-[11px] font-medium">
                    {currentTeaser.action}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Ready to analyze your own contracts and uncover hidden risks?
                </span>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Analyze Your Contract Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION (Target of smooth-scroll #features) */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Comprehensive Legal Toolkit
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Six Powerful AI Modules in One Workspace
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Every feature is designed to reduce anxiety, illuminate hidden traps, and arm you with professional negotiating leverage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Summarizer */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Plain-English Contract Summaries</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Transform 20-page legal contracts into concise executive summaries. Understand who owes what, financial obligations, and critical deadlines in seconds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onOpenAuth('signup')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Unlock Contract Analyzer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Red Flag Radar */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">0-100 Risk Score & Red Flag Radar</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Instantly spot predatory clauses like uncapped indemnification, automatic 1-year renewals with rent hikes, and unilateral termination clauses before signing.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onOpenAuth('signup')}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Explore Risk Scoring</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Document Comparison */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Version Comparison & Diff</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Compare revised drafts, vendor riders, or updated terms side-by-side. Our AI highlights sneaky language alterations and tells you whether the new draft favors you.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onOpenAuth('signup')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Test Document Compare</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Jargon Decoder */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Legal Jargon Decoder</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Paste any bewildering paragraph to get an instant 5th-grade translation, or browse our searchable glossary explaining indemnity, severability, and force majeure.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onOpenAuth('signup')}
                className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Jargon Decoder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 5: Counter-Proposal Generator */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Action Playbook & Redlines</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Turn identified problems into diplomatic counter-proposal emails ready to send. Includes fair substitute clauses, talking points, and pre-signing safety checklists.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onOpenAuth('signup')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Generate Negotiation Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 6: AI Legal Navigator */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Interactive Legal Q&A</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ask questions about tenant habitability rights, invoice non-payment remedies, or employment non-compete enforceability. Receive grounded next steps.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onOpenAuth('signup')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ask Legal Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (Target of smooth-scroll #how-it-works) */}
      <section id="how-it-works" className="py-20 bg-slate-100/60 border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Streamlined Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              From Confusing PDF to Confident Negotiation
            </h2>
            <p className="text-sm text-slate-600">
              Three simple steps to transform impenetrable legal jargon into actionable clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Upload or Paste Your Document</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Drop in any agreement text, upload a text file, or pick from our built-in real-world templates (leases, contractor agreements, NDAs, SaaS terms).
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Analyzes & Calculates Risk</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Gemini parses every clause, evaluates liability shifts, isolates hidden monetary penalties and notice deadlines, and calculates a 0-100 risk score.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Counter-Propose & Protect Yourself</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Generate polite counter-proposal emails with fair substitute language, check off your pre-signing safety list, and proceed with peace of mind.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Create Free Account & Try Now</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </section>

      {/* USE CASES SECTION (Target of smooth-scroll #use-cases) */}
      <section id="use-cases" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Tailored For Real People
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Who ClarifyLegal Protects Every Day
          </h2>
          <p className="text-sm text-slate-600">
            Engineered to defend everyday signers who don't have corporate legal counsel on retainer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Renters & Apartment Tenants</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Never sign away statutory habitability rights. Catch stealthy automatic lease renewals, aggressive late fees, and unfair security deposit forfeiture clauses.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Freelancers & Contractors</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Protect your pre-existing code and portfolio tools. Prevent clients from taking your intellectual property before paying invoices, and push back on Net-90 payment terms.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Employees & Consumers</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Scrutinize overreaching non-compete covenants, mutual NDAs with one-way secrets, and vendor SaaS contracts that mandate binding arbitration.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT & TESTIMONIALS SECTION (Target of smooth-scroll #about) */}
      <section id="about" className="py-20 bg-slate-900 text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              About ClarifyLegal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Democratizing Legal Literacy with AI
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Legal documents shouldn't be a test of endurance or a tool of intimidation. ClarifyLegal was built to level the playing field for tenants, freelancers, and small business owners everywhere.
            </p>
          </div>

          {/* Key Metrics / Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 mb-1">98%</div>
              <div className="text-xs text-slate-300">Reduction in Reading Time</div>
            </div>
            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mb-1">0-100</div>
              <div className="text-xs text-slate-300">Calibrated Risk Radar</div>
            </div>
            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 mb-1">100%</div>
              <div className="text-xs text-slate-300">Private Zero-Retention</div>
            </div>
            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">12+</div>
              <div className="text-xs text-slate-300">Core Trap Decoders</div>
            </div>
          </div>

          {/* Testimonial Quotes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "My landlord tried to sneak in a clause that made me pay for any plumbing repair under $350. ClarifyLegal flagged it in 10 seconds and gave me the exact email text to get it removed."
              </p>
              <div className="text-xs font-bold text-white pt-1">
                Alex M. • Renter in Austin, TX
              </div>
            </div>

            <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "A client's contract had a clause transferring all my pre-existing design templates to them forever. The Action Playbook drafted a polite redline that protected my portfolio."
              </p>
              <div className="text-xs font-bold text-white pt-1">
                Samantha K. • UI/UX Contractor
              </div>
            </div>

            <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "The side-by-side comparison engine saved our startup when negotiating vendor SaaS agreements. It showed us immediately where the liability was shifted onto our team."
              </p>
              <div className="text-xs font-bold text-white pt-1">
                David L. • Tech Startup Founder
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Common Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900">Is ClarifyLegal a replacement for an attorney?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. ClarifyLegal is an educational AI literacy platform. It empowers you to understand complex language, identify red flags, and negotiate standard terms, but it does not provide formal legal representation or create an attorney-client relationship.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900">Are my documents stored or shared?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. Contracts are analyzed server-side with zero persistence retention. Your documents are not used to train models or shared with third parties.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900">How do evaluators and guests test the platform?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you click "Sign In" or "Get Started", the authentication dialog provides a 1-click "Judge / Evaluator Demo Login" button. This automatically provisions a JWT session with pre-loaded sample lease and contractor agreements for instant evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stop Signing Contracts in the Dark
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Join thousands of tenants, freelancers, and small business owners who use ClarifyLegal to safeguard their rights before signing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Sign In to Workspace</span>
            </button>
          </div>
        </div>
      </section>

      {/* Simple Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">ClarifyLegal</span>
            <span>• GenAI Legal Literacy</span>
          </div>

          <p className="text-slate-400 text-[11px]">
            &copy; {new Date().getFullYear()} ClarifyLegal. Educational platform. Not formal legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
};
