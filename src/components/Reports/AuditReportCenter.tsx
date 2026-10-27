import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { ClipboardList, Download, Search, Lock } from 'lucide-react';

export const AuditReportCenter: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        setAuditLogs(data.auditLogs || []);
        setIsLoading(false);
      })
      .catch(err => console.error('Failed to load audit logs:', err));
  }, []);

  const handleDownloadCsv = (type: string) => {
    window.open(`/api/reports/csv?type=${type}`, '_blank');
  };

  const filteredLogs = auditLogs.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.actorName.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.entityId.toLowerCase().includes(q) ||
      (a.reason && a.reason.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading statutory audit trail...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <span>Immutable Audit Trail &amp; Statutory Reports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chronological decision logs protected from user modification with downloadable CSV audit reports.
          </p>
        </div>

        {/* CSV Downloads Bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleDownloadCsv('applications')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Pendency CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCsv('evc')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>EVC CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCsv('lease_expiries')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Expiries CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCsv('audit')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition flex items-center space-x-1"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Audit Trail CSV</span>
          </button>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, entity ID or deficiency reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor &amp; Desk Role</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Target Entity ID</th>
                <th className="p-3.5">Status Transition</th>
                <th className="p-3.5">Reason / Remarks</th>
                <th className="p-3.5 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3.5 text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3.5 font-sans font-semibold text-slate-900 dark:text-white">
                    <div>{log.actorName}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400/80">{log.actorRole}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-amber-600 dark:text-amber-400 font-bold">{log.entityId}</td>
                  <td className="p-3.5 font-sans">
                    {log.previousStatus ? (
                      <span className="text-slate-500 dark:text-slate-400">{log.previousStatus} → <strong className="text-slate-900 dark:text-white">{log.newStatus}</strong></span>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300">{log.newStatus || '-'}</span>
                    )}
                  </td>
                  <td className="p-3.5 font-sans max-w-xs truncate text-slate-700 dark:text-slate-300">
                    {log.reason || '-'}
                  </td>
                  <td className="p-3.5 text-right text-slate-400 dark:text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
