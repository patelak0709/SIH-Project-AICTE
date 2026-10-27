import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ApplicationList } from './components/Applications/ApplicationList';
import { ApplicationDetail } from './components/Applications/ApplicationDetail';
import { WorkflowConfigManager } from './components/WorkflowConfig/WorkflowConfigManager';
import { EVCSchedulingManager } from './components/EVC/EVCSchedulingManager';
import { ComplianceManager } from './components/Compliance/ComplianceManager';
import { LeaseExpiryTracker } from './components/LeaseExpiry/LeaseExpiryTracker';
import { NaturalLanguageQueryAssistant } from './components/AI/NaturalLanguageQueryAssistant';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { AuditReportCenter } from './components/Reports/AuditReportCenter';

function MainAppContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = () => {
    fetch('/api/notifications', {
      headers: { 'x-user-id': currentUser.id },
    })
      .then(res => res.json())
      .then(data => {
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(err => console.error('Error fetching unread count:', err));
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [currentUser, activeTab]);

  const handleNavigateToApp = (appId: string) => {
    setSelectedAppId(appId);
    setActiveTab('applications');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors">
      {/* Header */}
      <Header
        onOpenNotifications={() => {
          setSelectedAppId(null);
          setActiveTab('alerts');
        }}
        onRunEscalations={() => {
          fetchUnreadCount();
        }}
        unreadCount={unreadCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedAppId(null);
            setActiveTab(tab);
          }}
          unreadCount={unreadCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateToApp={handleNavigateToApp}
              onNavigateToTab={(tab) => {
                setSelectedAppId(null);
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'applications' && (
            selectedAppId ? (
              <ApplicationDetail
                appId={selectedAppId}
                onBack={() => setSelectedAppId(null)}
              />
            ) : (
              <ApplicationList
                onSelectApplication={(id) => setSelectedAppId(id)}
              />
            )
          )}

          {activeTab === 'workflows' && <WorkflowConfigManager />}

          {activeTab === 'evc' && <EVCSchedulingManager />}

          {activeTab === 'compliance' && <ComplianceManager />}

          {activeTab === 'lease_expiries' && <LeaseExpiryTracker />}

          {activeTab === 'ai_assistant' && <NaturalLanguageQueryAssistant />}

          {activeTab === 'alerts' && (
            <NotificationCenter onRefreshUnread={fetchUnreadCount} />
          )}

          {activeTab === 'audit_reports' && <AuditReportCenter />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
