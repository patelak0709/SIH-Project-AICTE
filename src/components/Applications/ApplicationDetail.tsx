import React, { useState, useEffect } from 'react';
import { Application, ApplicationStage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  XCircle, RefreshCw
} from 'lucide-react';

interface ApplicationDetailProps {
  appId: string;
  onBack: () => void;
}

export const ApplicationDetail: React.FC<ApplicationDetailProps> = ({ appId, onBack }) => {
  const { currentUser } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Deficiency Modal State
  const [isDeficiencyModalOpen, setIsDeficiencyModalOpen] = useState(false);
  const [deficiencyReason, setDeficiencyReason] = useState('');

  const fetchApplication = () => {
    setIsLoading(true);
    fetch(`/api/applications/${appId}`)
      .then(res => res.json())
      .then(data => {
        setApp(data.application);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load application detail:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchApplication();
  }, [appId]);

  if (isLoading || !app) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
        <span>Loading application workflow state...</span>
      </div>
    );
  }

  // Defined Workflow Sequence Steps
  const workflowSteps: ApplicationStage[] = [
    'Submitted',
    'Under Scrutiny',
    'EVC Pending',
    'EVC Scheduled',
    'Awaiting SAC/SHC',
    'Compliance Pending',
    'Completed',
  ];

  const currentStageIdx = workflowSteps.indexOf(app.currentStage);

  const getNextStageName = (): ApplicationStage | null => {
    if (currentStageIdx >= 0 && currentStageIdx < workflowSteps.length - 1) {
      return workflowSteps[currentStageIdx + 1];
    }
    return null;
  };

  const handleTogglePrerequisite = async (key: keyof Application['prerequisitesMet'], currentValue: boolean) => {
    try {
      setActionError(null);
      const res = await fetch(`/api/applications/${app.id}/prerequisites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ key, value: !currentValue }),
      });
      if (res.ok) {
        fetchApplication();
      }
    } catch (err) {
      console.error('Failed to toggle prerequisite:', err);
    }
  };

  const handleAdvanceStage = async () => {
    const next = getNextStageName();
    if (!next) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/applications/${app.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          nextStage: next,
          actionType: 'ADVANCE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to advance stage');
      } else {
        setActionSuccess(`Stage successfully advanced to '${next}'`);
        fetchApplication();
      }
    } catch (err) {
      setActionError('Network error advancing stage.');
    }
  };

  const handleReturnDeficiency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deficiencyReason.trim()) {
      setActionError('Deficiency reason is required.');
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/applications/${app.id}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          nextStage: 'Returned for Deficiency',
          actionType: 'REVERT_DEFICIENCY',
          reason: deficiencyReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to return application');
      } else {
        setIsDeficiencyModalOpen(false);
        setDeficiencyReason('');
        setActionSuccess('Application returned for deficiency with recorded reasons.');
        fetchApplication();
      }
    } catch (err) {
      setActionError('Error returning application for deficiency.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Back to queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">{app.appNumber}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                app.riskLevel === 'CRITICAL' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40' :
                app.riskLevel === 'HIGH' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40' :
                'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
              }`}>
                {app.riskLevel} RISK
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{app.institutionName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{app.applicationType} | {app.region}</p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDeficiencyModalOpen(true)}
            disabled={app.currentStage === 'Completed' || app.currentStage === 'Returned for Deficiency'}
            className="px-3 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40 font-semibold text-xs rounded-lg transition disabled:opacity-50"
          >
            Return for Deficiency
          </button>
          <button
            onClick={handleAdvanceStage}
            disabled={app.currentStage === 'Completed' || !getNextStageName()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition disabled:opacity-50"
          >
            Advance to Next Stage →
          </button>
        </div>
      </div>

      {/* Action Error or Success Banner */}
      {actionError && (
        <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Deficiency Reason Notice (if currently returned) */}
      {app.currentStage === 'Returned for Deficiency' && app.deficiencyNotes && (
        <div className="bg-red-50 dark:bg-gradient-to-r dark:from-red-950/80 dark:to-slate-900 border-2 border-red-500/60 p-4 rounded-xl shadow-sm text-slate-800 dark:text-slate-200">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 text-xs font-bold mb-1">
            <XCircle className="w-4 h-4" />
            <span>STATUTORY DEFICIENCY NOTICE RAISED</span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-950 p-3 rounded-lg border border-red-200 dark:border-red-900/50 font-mono">
            "{app.deficiencyNotes}"
          </p>
        </div>
      )}

      {/* Visual Workflow Stage Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors space-y-3">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-4">
          Statutory Workflow Timeline Progress
        </h2>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[700px] justify-between">
            {workflowSteps.map((step, idx) => {
              const isPassed = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const isReturned = app.currentStage === 'Returned for Deficiency' && idx === currentStageIdx;

              return (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {/* Line connector */}
                  {idx < workflowSteps.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-1 z-0 ${
                        idx < currentStageIdx ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}

                  {/* Step Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 border-2 transition ${
                      isReturned
                        ? 'bg-red-500 text-white border-red-400 animate-pulse'
                        : isCurrent
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg scale-110'
                        : isPassed
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : idx + 1}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <div
                      className={`text-[11px] font-semibold max-w-[90px] leading-tight ${
                        isCurrent ? 'text-amber-600 dark:text-amber-400 font-bold' : isPassed ? 'text-slate-800 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prerequisites Checklist & Officer Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Prerequisites Checklist Box */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Statutory Prerequisites Verification</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">All prerequisites must be satisfied prior to advancing workflow stage</p>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
              Role Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Prereq 1 */}
            <div
              onClick={() => handleTogglePrerequisite('documentsVerified', app.prerequisitesMet.documentsVerified)}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                app.prerequisitesMet.documentsVerified
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={app.prerequisitesMet.documentsVerified}
                readOnly
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Scrutiny &amp; Document Verification</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Trust deed, land records &amp; building plans verified</div>
              </div>
            </div>

            {/* Prereq 2 */}
            <div
              onClick={() => handleTogglePrerequisite('feePaid', app.prerequisitesMet.feePaid)}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                app.prerequisitesMet.feePaid
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={app.prerequisitesMet.feePaid}
                readOnly
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Application Fee Settlement</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Statutory payment token verified by accounts desk</div>
              </div>
            </div>

            {/* Prereq 3 */}
            <div
              onClick={() => handleTogglePrerequisite('evcReportSubmitted', app.prerequisitesMet.evcReportSubmitted)}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                app.prerequisitesMet.evcReportSubmitted
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={app.prerequisitesMet.evcReportSubmitted}
                readOnly
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">EVC Inspection Report Upload</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Physical inspection notes &amp; photo evidence uploaded</div>
              </div>
            </div>

            {/* Prereq 4 */}
            <div
              onClick={() => handleTogglePrerequisite('undertakingsCleared', app.prerequisitesMet.undertakingsCleared)}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                app.prerequisitesMet.undertakingsCleared
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={app.prerequisitesMet.undertakingsCleared}
                readOnly
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Compliance Undertakings Cleared</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">NBA affidavit, safety NOCs &amp; land lease active</div>
              </div>
            </div>

          </div>
        </div>

        {/* Assigned Officer & App Metadata Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Application SLA Metadata</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Assigned Officer:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{app.assignedOfficerName || 'Regional Officer'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Submission Date:</span>
              <span className="text-slate-800 dark:text-slate-200">{app.submissionDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Workflow Model:</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">{app.workflowType}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Stage SLA Target:</span>
              <span className="text-slate-800 dark:text-slate-200">{app.targetSlaDays} Days</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Stage Ageing:</span>
              <span className={app.daysPendingInCurrentStage > app.targetSlaDays ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                {app.daysPendingInCurrentStage} Days Pending
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Stage History Chronological Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Statutory Stage History &amp; Decision Log</span>
        </h2>

        <div className="space-y-3">
          {app.stageHistory.map((sh, idx) => (
            <div key={sh.id || idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 dark:text-slate-400 gap-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400">{sh.stage}</span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                    {sh.actorRole}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{new Date(sh.enteredAt).toLocaleString()}</span>
              </div>

              <div className="text-slate-800 dark:text-slate-200 font-medium">{sh.action}</div>
              {sh.deficiencyReason && (
                <div className="text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900/50 text-[11px]">
                  <strong>Deficiency Note:</strong> {sh.deficiencyReason}
                </div>
              )}
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Recorded by: {sh.actorName}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Return for Deficiency Modal */}
      {isDeficiencyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span>Return Application for Deficiency</span>
              </h2>
              <button onClick={() => setIsDeficiencyModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleReturnDeficiency} className="space-y-3 text-xs">
              <p className="text-slate-700 dark:text-slate-300">
                Specify mandatory deficiency reasons for institution <strong className="text-slate-900 dark:text-white">{app.institutionName}</strong>. This statutory action will revert the application and log deficiency notes in the immutable audit trail.
              </p>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Deficiency Remarks / Required Action *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Fire NOC copy submitted is uncertified by Mumbai Fire Brigade. Updated certified NOC and revised land deed copy required..."
                  value={deficiencyReason}
                  onChange={(e) => setDeficiencyReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeficiencyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow"
                >
                  Confirm Deficiency Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
