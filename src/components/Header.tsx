import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, UserCheck, RefreshCw, ChevronDown, CheckCircle2, Sun, Moon, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onRunEscalations: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onRunEscalations, unreadCount }) => {
  const { currentUser, users, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationToast, setEscalationToast] = useState<string | null>(null);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin (Statutory Head)';
      case 'REGIONAL_OFFICER': return 'Regional Officer (RO Desk)';
      case 'BUREAU_OFFICER': return 'Bureau Officer (SAC/SHC Desk)';
      case 'EVC_MEMBER': return 'EVC Committee Member';
      case 'COMPLIANCE_OFFICER': return 'Compliance Verification Officer';
      case 'INSTITUTION_USER': return 'Institution User (Applicant)';
      default: return role;
    }
  };

  const handleRunEscalation = async () => {
    setIsEscalating(true);
    setEscalationToast(null);
    try {
      const res = await fetch('/api/notifications/run-escalations', { method: 'POST' });
      const data = await res.json();
      onRunEscalations();
      setEscalationToast(`Escalation Check Executed! Generated ${data.result.newAlertsCount} new alerts (${data.result.escalatedAppsCount} escalated applications).`);
    } catch (err) {
      console.error('Failed to run escalations:', err);
    } finally {
      setIsEscalating(false);
      setTimeout(() => setEscalationToast(null), 5000);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sticky top-0 z-30 shadow-sm dark:shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-md text-xl border border-amber-400/30">
            🏛️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">AICTE</span>
              <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-medium">
                SIH 26262
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Integrated Approval Workflow, Compliance &amp; Escalation System
            </p>
          </div>
        </div>

        {/* Right Actions & Persona Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700 text-xs font-medium"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden md:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* Run Escalations Button */}
          <button
            onClick={handleRunEscalation}
            disabled={isEscalating}
            title="Trigger automated background SLA pendency & lease expiry escalation engine"
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 dark:text-amber-400 ${isEscalating ? 'animate-spin' : ''}`} />
            <span>Check Escalations</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition border border-slate-200 dark:border-slate-700"
            title="System Notifications & Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Active Role Selector Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleModalOpen(!isRoleModalOpen)}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 sm:px-3 sm:py-1.5 transition text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-600"
              />
              <div className="hidden sm:block text-xs">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">{currentUser.name}</div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{getRoleLabel(currentUser.role).split(' ')[0]}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>

            {/* Switcher Dropdown Modal */}
            {isRoleModalOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    <span>Switch Active Persona / Role</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">6 Roles</span>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchRole(u.id);
                        setIsRoleModalOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center space-x-2.5 text-xs transition ${
                        u.id === currentUser.id
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{getRoleLabel(u.role)}</div>
                        {u.region && <div className="text-[9px] text-amber-600 dark:text-amber-400/80">{u.region}</div>}
                      </div>
                      {u.id === currentUser.id && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Escalation Toast */}
      {escalationToast && (
        <div className="bg-amber-500 text-slate-950 text-xs px-4 py-2 text-center font-medium shadow-inner flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-slate-950" />
          <span>{escalationToast}</span>
        </div>
      )}
    </header>
  );
};
