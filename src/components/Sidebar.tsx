import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, FileText, GitMerge, Calendar, 
  CheckSquare, FileSpreadsheet, Bot, AlertOctagon, 
  ClipboardList, ShieldAlert
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'applications'
  | 'workflows'
  | 'evc'
  | 'compliance'
  | 'lease_expiries'
  | 'ai_assistant'
  | 'alerts'
  | 'audit_reports';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, unreadCount }) => {
  const { currentUser, hasPermission } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard & Analytics',
      icon: LayoutDashboard,
      badge: null,
      allowed: true,
    },
    {
      id: 'applications' as NavTab,
      label: 'Application Queue',
      icon: FileText,
      badge: null,
      allowed: true,
    },
    {
      id: 'workflows' as NavTab,
      label: 'Workflow Engine Config',
      icon: GitMerge,
      badge: 'Admin',
      allowed: hasPermission(['SUPER_ADMIN']),
    },
    {
      id: 'evc' as NavTab,
      label: 'EVC Scheduling & Queue',
      icon: Calendar,
      badge: null,
      allowed: hasPermission(['SUPER_ADMIN', 'REGIONAL_OFFICER', 'BUREAU_OFFICER', 'EVC_MEMBER']),
    },
    {
      id: 'compliance' as NavTab,
      label: 'Undertakings & Compliance',
      icon: CheckSquare,
      badge: null,
      allowed: true,
    },
    {
      id: 'lease_expiries' as NavTab,
      label: 'Lease Expiry & AI OCR',
      icon: FileSpreadsheet,
      badge: 'AI Powered',
      allowed: true,
    },
    {
      id: 'ai_assistant' as NavTab,
      label: 'NL Intelligence Query',
      icon: Bot,
      badge: 'Gemini AI',
      allowed: true,
    },
    {
      id: 'alerts' as NavTab,
      label: 'Escalations & Alerts',
      icon: AlertOctagon,
      badge: unreadCount > 0 ? `${unreadCount}` : null,
      allowed: true,
    },
    {
      id: 'audit_reports' as NavTab,
      label: 'Audit Trail & CSV Reports',
      icon: ClipboardList,
      badge: null,
      allowed: true,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-colors">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
          Active Workspace Context
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
        <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center space-x-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="truncate">{currentUser.region || currentUser.role}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.allowed).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ml-1 ${
                    isActive
                      ? 'bg-slate-950/20 text-slate-950'
                      : item.badge === 'Gemini AI' || item.badge === 'AI Powered'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Info Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] text-slate-500 dark:text-slate-500 text-center">
        <div>AICTE Statutory Workflow System</div>
        <div className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">Automated SLA &amp; Compliance Audit</div>
      </div>
    </aside>
  );
};
