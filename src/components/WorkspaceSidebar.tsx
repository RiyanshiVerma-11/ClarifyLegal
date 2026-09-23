import React from 'react';
import { 
  Scale, 
  FileText, 
  GitCompare, 
  BookOpen, 
  CheckSquare, 
  MessageSquare, 
  LayoutDashboard, 
  LogOut, 
  X,
  Info,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Award,
  PanelLeftClose,
  Bot,
  Mic
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';

interface WorkspaceSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: AuthUser;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenDisclaimer: () => void;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  mobileOpen,
  setMobileOpen,
  onOpenDisclaimer,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      subtitle: 'Overview & recent analyses',
      icon: LayoutDashboard,
    },
    {
      id: 'analyzer' as ActiveTab,
      label: 'Contract Analyzer',
      subtitle: 'Risk score & clause breakdown',
      icon: FileText,
    },
    {
      id: 'compare' as ActiveTab,
      label: 'Compare Documents',
      subtitle: 'Side-by-side version diff',
      icon: GitCompare,
    },
    {
      id: 'decoder' as ActiveTab,
      label: 'Jargon Decoder',
      subtitle: 'Plain-English translator',
      icon: BookOpen,
    },
    {
      id: 'playbook' as ActiveTab,
      label: 'Action Playbook',
      subtitle: 'Redline counter-proposals',
      icon: CheckSquare,
    },
    {
      id: 'chatbot' as ActiveTab,
      label: 'Gemini Chatbot',
      subtitle: 'Multi-turn AI legal advisor',
      icon: Bot,
      badge: 'Pro & Flash',
    },
    {
      id: 'voice' as ActiveTab,
      label: 'Voice Live Assistant',
      subtitle: 'Gemini 3.8 Live conversation',
      icon: Mic,
      badge: 'Live API',
    },
    {
      id: 'navigator' as ActiveTab,
      label: 'Legal Navigator',
      subtitle: 'GenAI legal literacy Q&A',
      icon: MessageSquare,
    },
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const isJudge = user.role === 'Judge / Evaluator';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 border-r border-slate-800/80 select-none">
      {/* Top Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-md font-bold transition-transform group-hover:scale-105">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">ClarifyLegal</span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-amber-400/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Workspace</p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Stack */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Intelligence Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  title={item.subtitle}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group relative ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/90 font-medium'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-slate-900 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate">{item.label}</span>
                      {item.badge && !isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 shrink-0 ml-1">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] truncate leading-tight ${
                      isActive ? 'text-slate-900/80 font-medium' : 'text-slate-400'
                    }`}>
                      {item.subtitle}
                    </div>
                  </div>

                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-slate-950 shrink-0 ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Legal Safety Info */}
        <div className="px-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Educational Safety</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Provides plain-English legal literacy and risk analysis, not formal legal representation.
            </p>
            <button
              onClick={onOpenDisclaimer}
              className="text-[10px] text-amber-300 hover:text-amber-200 font-semibold underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Info className="w-3 h-3" />
              <span>Read Full Disclaimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom User Profile Card & Log Out */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90">
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-inner ${
            isJudge 
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/30' 
              : 'bg-indigo-600 text-white'
          }`}>
            {isJudge ? <Award className="w-4 h-4" /> : user.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[110px]" title={user.name}>
                {user.name}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded inline-block ${
                isJudge
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
              }`}>
                {isJudge ? 'Judge Demo' : user.role}
              </span>
            </div>
          </div>

          {/* Clean Logout Icon Button */}
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            title="Log Out & Return to Landing Page"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanently Fixed Sidebar (w-64) */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-30 overflow-hidden border-r border-slate-800/80 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 shadow-2xl animate-in slide-in-from-left duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
