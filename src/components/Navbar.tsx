import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  GitCompare, 
  BookOpen, 
  CheckSquare, 
  MessageSquare, 
  LayoutDashboard, 
  Sparkles, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSample: (sampleId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onSelectSample,
}) => {
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const navItems = [
    { id: 'landing' as ActiveTab, label: 'Overview', icon: Globe },
    { id: 'dashboard' as ActiveTab, label: 'Dashboard Hub', icon: LayoutDashboard },
    { id: 'analyzer' as ActiveTab, label: 'Document Analyzer', icon: FileText, badge: 'Core' },
    { id: 'compare' as ActiveTab, label: 'Compare Documents', icon: GitCompare },
    { id: 'decoder' as ActiveTab, label: 'Jargon Decoder', icon: BookOpen },
    { id: 'playbook' as ActiveTab, label: 'Action Playbook', icon: CheckSquare },
    { id: 'navigator' as ActiveTab, label: 'Legal Navigator', icon: MessageSquare, badge: 'AI Q&A' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        {/* Top notification / safety bar */}
        <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              GenAI Legal Literacy
            </span>
            <span className="hidden sm:inline text-slate-300">
              ClarifyLegal simplifies complex contracts, translates legalese, and prepares actionable counter-proposals.
            </span>
            <button 
              id="legal-disclaimer-btn"
              onClick={() => setShowDisclaimerModal(true)}
              className="ml-auto text-slate-300 hover:text-white underline decoration-slate-500 hover:decoration-white transition-colors cursor-pointer text-[11px] flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              Disclaimer Notice
            </button>
          </div>
        </div>

        {/* Main header row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-button"
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-sm border border-slate-800 transition-transform group-hover:scale-105">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-slate-900">ClarifyLegal</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">AI</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-none">Demystifying Legal Information</p>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Sample Dropdown */}
            <div className="relative">
              <button
                id="quick-sample-menu-btn"
                onClick={() => setShowSampleMenu(!showSampleMenu)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Try Demo Sample</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showSampleMenu ? 'rotate-90' : ''}`} />
              </button>

              {showSampleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 text-xs"
                  onMouseLeave={() => setShowSampleMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Instant Contract Analysis Samples
                  </div>
                  <button
                    onClick={() => {
                      onSelectSample('residential-lease');
                      setActiveTab('analyzer');
                      setShowSampleMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-slate-900">Apartment Lease Agreement</span>
                    <span className="text-[11px] text-slate-500">Includes hidden repair liabilities & renewal trap</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectSample('freelance-contractor');
                      setActiveTab('analyzer');
                      setShowSampleMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-slate-900">Freelance Services Agreement</span>
                    <span className="text-[11px] text-slate-500">Uncapped liability, Net-90 & pre-work IP rights</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectSample('saas-terms');
                      setActiveTab('analyzer');
                      setShowSampleMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-slate-900">SaaS Terms of Service</span>
                    <span className="text-[11px] text-slate-500">Mandatory arbitration & AI data usage license</span>
                  </button>
                </div>
              )}
            </div>

            {/* Launch Dashboard / Landing toggle */}
            {activeTab === 'landing' ? (
              <button
                id="header-launch-dashboard-btn"
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <button
                id="header-landing-btn"
                onClick={() => setActiveTab('landing')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Landing Page</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation Bar */}
        <div className="xl:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-100 scrollbar-none bg-slate-50/70">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Legal & Educational Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Legal Information & Ethics Policy</h3>
                <p className="text-xs text-slate-500">ClarifyLegal Educational Mission</p>
              </div>
            </div>

            <div className="my-4 text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>ClarifyLegal is an AI-powered legal document education and literacy tool.</strong> It translates complex legal language into plain English, highlights potential areas of concern, and suggests negotiation talking points.
              </p>
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Important Notice:</strong> ClarifyLegal does not provide formal legal representation, cannot file court proceedings, and does not create an attorney-client relationship. Law varies significantly by jurisdiction, municipality, and factual context.
              </div>
              <p>
                For high-stakes agreements (such as real estate purchases, commercial acquisitions, or contested litigation), we strongly recommend consulting a licensed attorney qualified in your jurisdiction.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="close-disclaimer-modal-btn"
                onClick={() => setShowDisclaimerModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
