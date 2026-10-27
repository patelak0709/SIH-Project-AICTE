import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Application, EVCSchedule, LeaseDocument, SystemNotification } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
  FileText, Clock, AlertTriangle, Calendar, AlertCircle, 
  ArrowRight, Activity, Flame
} from 'lucide-react';

interface DashboardProps {
  onNavigateToApp: (appId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToApp, onNavigateToTab }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [applications, setApplications] = useState<Application[]>([]);
  const [evcSchedules, setEvcSchedules] = useState<EVCSchedule[]>([]);
  const [leaseDocuments, setLeaseDocuments] = useState<LeaseDocument[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/applications').then(r => r.json()),
      fetch('/api/evc').then(r => r.json()),
      fetch('/api/lease-documents').then(r => r.json()),
      fetch('/api/notifications').then(r => r.json()),
    ]).then(([appsData, evcData, leaseData, notifData]) => {
      setApplications(appsData.applications || []);
      setEvcSchedules(evcData.schedules || []);
      setLeaseDocuments(leaseData.documents || []);
      setNotifications(notifData.notifications || []);
      setIsLoading(false);
    }).catch(err => console.error('Error fetching dashboard data:', err));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-2 text-amber-500" />
        <span>Loading AICTE Operational Analytics...</span>
      </div>
    );
  }

  // Analytics Metrics
  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.currentStage !== 'Completed' && a.currentStage !== 'Rejected');
  const overdueApps = applications.filter(a => a.daysPendingInCurrentStage > a.targetSlaDays);
  const criticalApps = applications.filter(a => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH');
  const scheduledEvcCount = evcSchedules.filter(e => e.status === 'SCHEDULED' || e.status === 'QUEUED').length;
  const expiringDocsCount = leaseDocuments.filter(d => d.daysRemaining <= 30).length;

  // Recharts Stage Distribution Data
  const stagesList = ['Submitted', 'Under Scrutiny', 'EVC Pending', 'EVC Scheduled', 'Awaiting SAC/SHC', 'Compliance Pending', 'Completed'];
  const stageData = stagesList.map(s => ({
    stage: s,
    count: applications.filter(a => a.currentStage === s).length,
  }));

  // Regional Distribution
  const regionCounts: Record<string, number> = {};
  applications.forEach(a => {
    const regShort = a.region.split(' ')[0];
    regionCounts[regShort] = (regionCounts[regShort] || 0) + 1;
  });
  const regionData = Object.keys(regionCounts).map(k => ({
    name: k,
    value: regionCounts[k],
  }));

  const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#4f46e5'];
  const isDark = theme === 'dark';
  const tickColor = isDark ? '#94a3b8' : '#475569';
  const tooltipStyle = isDark 
    ? { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }
    : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };

  // Bottleneck Detection Logic
  const bottleneckStage = stageData.reduce((prev, current) => (current.count > prev.count ? current : prev), stageData[0]);

  return (
    <div className="space-y-6">
      
      {/* Header Welcome Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Operational Dashboard</span>
            <span className="text-xs font-normal bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {currentUser.role}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring of AICTE institutional approvals, EVC inspections, lease expiries &amp; SLA escalations.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => onNavigateToTab('applications')}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg shadow transition"
          >
            Manage Applications
          </button>
          <button
            onClick={() => onNavigateToTab('lease_expiries')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition"
          >
            Lease Expiry AI OCR
          </button>
        </div>
      </div>

      {/* Bottleneck Alert Banner */}
      {bottleneckStage && bottleneckStage.count > 1 && (
        <div className="bg-gradient-to-r from-red-500/10 via-slate-50 to-amber-500/10 dark:from-red-950/60 dark:via-slate-900 dark:to-amber-950/40 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg shrink-0">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold text-red-700 dark:text-red-300 flex items-center space-x-1.5">
                <span>WORKFLOW BOTTLENECK DETECTED</span>
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded font-mono">
                  {bottleneckStage.count} Pending
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                Stage <span className="font-semibold text-amber-700 dark:text-amber-300">'{bottleneckStage.stage}'</span> currently holds the highest application pendency load across regions.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('applications')}
            className="hidden sm:flex items-center space-x-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Applications</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalApps}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{pendingApps.length}</span> Active In-flight
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Overdue SLA Cases</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overdueApps.length}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Exceeding Target SLA Days
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>High/Critical Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalApps.length}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Priority Escalation Needed
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>EVC Inspections</span>
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{scheduledEvcCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Committee Scheduled / Queued
            </div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Expiring Documents</span>
            <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{expiringDocsCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Leases / NOCs &lt; 30 Days
            </div>
          </div>
        </div>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Stage-wise Pendency */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stage-wise Application Pendency</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of active applications across workflow approval stages</p>
            </div>
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Real-time</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <XAxis dataKey="stage" tick={{ fill: tickColor, fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.stage === bottleneckStage?.stage ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Regional Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Region-wise Workload</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Regional Officer Desk volume breakdown</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {regionData.map((r, i) => (
              <div key={r.name} className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate">{r.name}: <strong className="text-slate-900 dark:text-white">{r.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Priority Action Queue Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Priority Action Cases</span>
              <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-mono">
                Overdue &amp; High Risk
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Applications requiring immediate statutory action or deficiency review</p>
          </div>
          <button
            onClick={() => onNavigateToTab('applications')}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            View All Applications →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Application ID</th>
                <th className="p-3">Institution Name</th>
                <th className="p-3">Region</th>
                <th className="p-3">Current Stage</th>
                <th className="p-3">Days Pending</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {applications.slice(0, 5).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{app.appNumber}</td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white max-w-xs truncate">{app.institutionName}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{app.region.split(' ')[0]}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                      {app.currentStage}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={app.daysPendingInCurrentStage > app.targetSlaDays ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                      {app.daysPendingInCurrentStage} Days
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      app.riskLevel === 'CRITICAL' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40' :
                      app.riskLevel === 'HIGH' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40' :
                      app.riskLevel === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40' :
                      'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                    }`}>
                      {app.riskLevel}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onNavigateToApp(app.id)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] transition"
                    >
                      Process →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
