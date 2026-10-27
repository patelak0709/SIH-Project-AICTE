import React, { useState, useEffect } from 'react';
import { SystemNotification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NotificationCenterProps {
  onRefreshUnread: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onRefreshUnread }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const fetchNotifications = () => {
    setIsLoading(true);
    fetch('/api/notifications', {
      headers: { 'x-user-id': currentUser.id },
    })
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || []);
        setIsLoading(false);
      })
      .catch(err => console.error('Failed to load notifications:', err));
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
      onRefreshUnread();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'LEVEL_1') return n.escalationLevel === 1;
    if (filterLevel === 'LEVEL_2') return n.escalationLevel === 2;
    if (filterLevel === 'LEVEL_3') return n.escalationLevel === 3;
    return true;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading statutory notifications &amp; escalation hub...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span>Escalation &amp; Notification Control Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track multi-level statutory SLA alerts (Level 1: Officer, Level 2: Regional Officer, Level 3: Bureau Head / Super Admin).
          </p>
        </div>

        {/* Level Filters */}
        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All Escalation Tiers</option>
            <option value="LEVEL_1">Level 1 - Officer Reminder</option>
            <option value="LEVEL_2">Level 2 - Regional Head Escalation</option>
            <option value="LEVEL_3">Level 3 - Bureau Head Escalation</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs transition-colors">
            No active escalations or notifications found for the selected filter tier.
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`border rounded-xl p-4 transition shadow-sm flex items-start justify-between gap-4 ${
                n.escalationLevel === 3
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'
                  : n.escalationLevel === 2
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  n.escalationLevel === 3 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                  n.escalationLevel === 2 ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</h3>
                    {n.escalationLevel && (
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded font-mono ${
                        n.escalationLevel === 3 ? 'bg-red-500 text-white' :
                        n.escalationLevel === 2 ? 'bg-amber-500 text-slate-950' :
                        'bg-blue-500 text-white'
                      }`}>
                        TIER {n.escalationLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{n.message}</p>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                    Generated At: {new Date(n.createdAt).toLocaleString()} | Recipient Role: {n.recipientRole || 'All'}
                  </div>
                </div>
              </div>

              {n.status === 'UNREAD' ? (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition shrink-0"
                >
                  Mark Read
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 flex items-center space-x-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Acknowledged</span>
                </span>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
