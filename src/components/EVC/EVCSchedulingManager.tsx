import React, { useState, useEffect } from 'react';
import { EVCSchedule, Application } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, FileCheck, Plus } from 'lucide-react';

export const EVCSchedulingManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState<EVCSchedule[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New EVC Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [member1Name, setMember1Name] = useState('Dr. Meenakshi Sundaram');
  const [member1Inst, setMember1Inst] = useState('IIT Bombay');
  const [member1Exp, setMember1Exp] = useState('Computer Science & AI');

  // Report Submission Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeEvc, setActiveEvc] = useState<EVCSchedule | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [checklist, setChecklist] = useState({
    buildingSafety: true,
    labEquipment: true,
    facultyCadreRatio: true,
    libraryBooks: true,
  });

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/evc').then(r => r.json()),
      fetch('/api/applications').then(r => r.json()),
    ]).then(([evcData, appData]) => {
      setSchedules(evcData.schedules || []);
      setApplications(appData.applications || []);
      setIsLoading(false);
    }).catch(err => console.error('Failed to load EVC data:', err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const app = applications.find(a => a.id === selectedAppId);
    if (!app) return;

    try {
      const res = await fetch('/api/evc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          appId: app.id,
          appNumber: app.appNumber,
          institutionName: app.institutionName,
          region: app.region,
          scheduledDate: new Date().toISOString().split('T')[0],
          visitDate: visitDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          committeeMembers: [
            { id: 'm-1', name: member1Name, designation: 'Professor & Expert', institution: member1Inst, expertise: member1Exp },
            { id: 'm-2', name: 'Dr. Suresh R. Patil', designation: 'Professor', institution: 'COEP Technological Univ', expertise: 'Lab & Infrastructure' },
          ],
          reportNotes: 'Inspection panel constituted for physical verification.',
        }),
      });

      if (res.ok) {
        setIsScheduleModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to schedule EVC:', err);
    }
  };

  const handleOpenReportModal = (evc: EVCSchedule) => {
    setActiveEvc(evc);
    setReportNotes(evc.reportNotes || '');
    setChecklist(evc.deficiencyChecklist || {
      buildingSafety: true,
      labEquipment: true,
      facultyCadreRatio: true,
      libraryBooks: true,
    });
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvc) return;

    try {
      const res = await fetch(`/api/evc/${activeEvc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          status: 'REPORT_SUBMITTED',
          reportNotes: reportNotes,
          deficiencyChecklist: checklist,
        }),
      });

      if (res.ok) {
        setIsReportModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to submit EVC report:', err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading EVC inspection queue...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Expert Visit Committee (EVC) Scheduling &amp; Inspection Queue</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Schedule physical inspection panels, track visit dates, and submit statutory inspection reports.
          </p>
        </div>
        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule EVC Visit</span>
        </button>
      </div>

      {/* EVC Inspection Schedule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((evc) => (
          <div key={evc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{evc.appNumber}</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white max-w-xs truncate">{evc.institutionName}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                evc.status === 'REPORT_SUBMITTED' 
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' 
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
              }`}>
                {evc.status}
              </span>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Scheduled Inspection Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{evc.visitDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Region:</span>
                <span className="text-slate-800 dark:text-slate-200">{evc.region}</span>
              </div>
            </div>

            {/* Committee Members Pill */}
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 text-[11px] space-y-1">
              <div className="text-slate-600 dark:text-slate-400 font-semibold flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Assigned EVC Inspection Experts:</span>
              </div>
              <div className="space-y-0.5 text-slate-800 dark:text-slate-300 pl-4">
                {evc.committeeMembers.map(m => (
                  <div key={m.id}>
                    • <strong>{m.name}</strong> ({m.institution}) - <span className="text-slate-500 dark:text-slate-400">{m.expertise}</span>
                  </div>
                ))}
              </div>
            </div>

            {evc.reportNotes && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-200 dark:border-slate-800 italic">
                "{evc.reportNotes}"
              </p>
            )}

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => handleOpenReportModal(evc)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded transition flex items-center space-x-1"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{evc.status === 'REPORT_SUBMITTED' ? 'View/Update Report' : 'Submit Visit Report'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Schedule EVC Inspection Visit</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Select Application</label>
                <select
                  required
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Application --</option>
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.appNumber} - {a.institutionName} ({a.currentStage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Planned Inspection Visit Date</label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Lead Expert Member Name</label>
                <input
                  type="text"
                  required
                  value={member1Name}
                  onChange={(e) => setMember1Name(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Expert Institution / Designation</label>
                <input
                  type="text"
                  required
                  value={member1Inst}
                  onChange={(e) => setMember1Inst(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Submission Modal */}
      {isReportModalOpen && activeEvc && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">EVC Inspection Visit Report Submission</h2>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Statutory Inspection Checklist</label>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={checklist.buildingSafety}
                      onChange={(e) => setChecklist({ ...checklist, buildingSafety: e.target.checked })}
                    />
                    <span>Building Structure &amp; Fire Safety Norms Verified</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={checklist.labEquipment}
                      onChange={(e) => setChecklist({ ...checklist, labEquipment: e.target.checked })}
                    />
                    <span>Lab Equipment &amp; High Performance Computing Workstations</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={checklist.facultyCadreRatio}
                      onChange={(e) => setChecklist({ ...checklist, facultyCadreRatio: e.target.checked })}
                    />
                    <span>Faculty Cadre Ratio &amp; Qualification Certificates</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={checklist.libraryBooks}
                      onChange={(e) => setChecklist({ ...checklist, libraryBooks: e.target.checked })}
                    />
                    <span>Library Volumes, e-Journals &amp; Digital Learning Resources</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Inspection Panel Findings &amp; Remarks *</label>
                <textarea
                  required
                  rows={4}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Record detailed panel findings, lab verification observations, and recommendations..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow"
                >
                  Submit Statutory Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
