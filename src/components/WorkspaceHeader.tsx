import React from 'react';
import { 
  Menu, 
  ShieldCheck, 
  Info,
  Sparkles,
  LayoutDashboard,
  FileText,
  GitCompare,
  BookOpen,
  CheckSquare,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Mic
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';

interface WorkspaceHeaderProps {
  activeTab: ActiveTab;
  user: AuthUser;
  onOpenMobileMenu: () => void;
  onOpenDisclaimer: () => void;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  activeTab,
  user,
  onOpenMobileMenu,
  onOpenDisclaimer,
}) => {
  const getTabInfo = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Dashboard Overview',
          subtitle: 'Recent analyses and legal risk summaries',
          icon: LayoutDashboard,
        };
      case 'analyzer':
        return {
          title: 'Contract Analyzer',
          subtitle: 'Risk score, clause breakdown, and predatory terms detection',
          icon: FileText,
        };
      case 'compare':
        return {
          title: 'Compare Documents',
          subtitle: 'Side-by-side contract diff and changes breakdown',
          icon: GitCompare,
        };
      case 'decoder':
        return {
          title: 'Jargon Decoder',
          subtitle: 'Translate dense legal terminology into plain English',
          icon: BookOpen,
        };
      case 'playbook':
        return {
          title: 'Action Playbook & Counter-Proposals',
          subtitle: 'Generate diplomatic emails, redlines, and talking points',
          icon: CheckSquare,
        };
      case 'chatbot':
        return {
          title: 'Gemini Chatbot',
          subtitle: 'Multi-turn AI legal advisor powered by Pro, 3.5 Flash & Flash-Lite',
          icon: Bot,
        };
      case 'voice':
        return {
          title: 'Gemini 3.8 Live Voice Studio',
          subtitle: 'Real-time two-way audio conversations via Live API',
          icon: Mic,
        };
      case 'navigator':
        return {
          title: 'Legal Navigator',
          subtitle: 'GenAI legal literacy assistant and dispute guidance',
          icon: MessageSquare,
        };
      default:
        return {
          title: 'ClarifyLegal',
          subtitle: 'AI Legal Risk & Analysis Suite',
          icon: LayoutDashboard,
        };
    }
  };

  const tabInfo = getTabInfo(activeTab);
  const TabIcon = tabInfo.icon;

  return (
    <header className="sticky top-0 z-20 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* Left: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          id="workspace-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current View Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-amber-500/10 text-amber-900 items-center justify-center shrink-0 border border-amber-300/40">
            <TabIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold hidden md:inline">
                Workspace
              </span>
              <span className="text-slate-300 text-xs hidden md:inline">/</span>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate tracking-tight">
                {tabInfo.title}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden sm:block">
              {tabInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Quick Status & Legal Notice */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Session / System Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold">Session Active</span>
        </div>

        {/* Legal Disclaimer Modal Trigger */}
        <button
          id="workspace-disclaimer-trigger-btn"
          onClick={onOpenDisclaimer}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Review educational legal disclaimer"
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline text-[11px] font-semibold">Disclaimer</span>
        </button>
      </div>
    </header>
  );
};
