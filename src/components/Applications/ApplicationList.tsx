import React, { useState, useEffect } from 'react';
import { Application, Region, ApplicationType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Download, ArrowRight } from 'lucide-react';

interface ApplicationListProps {
  onSelectApplication: (appId: string) => void;
}

export const ApplicationList: React.FC<ApplicationListProps> = ({ onSelectApplication }) => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Application Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newRegion, setNewRegion] = useState<Region>('Northern Region (NRO)');
  const [newAppType, setNewAppType] = useState<ApplicationType>('Extension of Approval (EoA)');
  const [newWorkflowType, setNewWorkflowType] = useState<'SCRUTINY_ONLY' | 'SCRUTINY_EVC' | 'FULL_PROCESS'>('SCRUTINY_ONLY');

  const fetchApplications = () => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      region: regionFilter,
      stage: stageFilter,
      risk: riskFilter,
      search: searchQuery,
    });

    fetch(`/api/applications?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        setApplications(data.applications || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load applications:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, [regionFilter, stageFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim()) return;

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          institutionName: newInstName,
          region: newRegion,
          applicationType: newAppType,
          workflowType: newWorkflowType,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewInstName('');
        fetchApplications();
      }
    } catch (err) {
      console.error('Failed to create application:', err);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/reports/csv?type=applications', '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Application Management Queue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track and process statutory AICTE institutional approval proposals and pendencies.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg transition"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3 transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by App ID, Institution Name, or Application Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Regions</option>
            <option value="Northern Region (NRO)">Northern Region (NRO)</option>
            <option value="Western Region (WRO)">Western Region (WRO)</option>
            <option value="Southern Region (SRO)">Southern Region (SRO)</option>
            <option value="Eastern Region (ERO)">Eastern Region (ERO)</option>
            <option value="Central Region (CRO)">Central Region (CRO)</option>
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Approval Stages</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Scrutiny">Under Scrutiny</option>
            <option value="Returned for Deficiency">Returned for Deficiency</option>
            <option value="EVC Scheduled">EVC Scheduled</option>
            <option value="Awaiting SAC/SHC">Awaiting SAC/SHC</option>
            <option value="Compliance Pending">Compliance Pending</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading application records...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            No applications found matching the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">App ID</th>
                  <th className="p-3.5">Institution Name</th>
                  <th className="p-3.5">Region</th>
                  <th className="p-3.5">Application Type</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5">Pending Days</th>
                  <th className="p-3.5">Risk Level</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">{app.appNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">{app.institutionName}</td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">{app.region.split(' ')[0]}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">{app.applicationType}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                        app.currentStage === 'Returned for Deficiency' 
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40' 
                          : app.currentStage === 'Completed'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}>
                        {app.currentStage}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1">
                        <span className={app.daysPendingInCurrentStage > app.targetSlaDays ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                          {app.daysPendingInCurrentStage} Days
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">(SLA: {app.targetSlaDays}d)</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                        app.riskLevel === 'CRITICAL' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40' :
                        app.riskLevel === 'HIGH' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40' :
                        app.riskLevel === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40' :
                        'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                      }`}>
                        {app.riskLevel}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onSelectApplication(app.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition inline-flex items-center space-x-1"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Application Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Statutory Application</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Technology, Delhi"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">AICTE Region</label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value as Region)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Northern Region (NRO)">Northern Region (NRO)</option>
                  <option value="Western Region (WRO)">Western Region (WRO)</option>
                  <option value="Southern Region (SRO)">Southern Region (SRO)</option>
                  <option value="Eastern Region (ERO)">Eastern Region (ERO)</option>
                  <option value="Central Region (CRO)">Central Region (CRO)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Application Proposal Type</label>
                <select
                  value={newAppType}
                  onChange={(e) => setNewAppType(e.target.value as ApplicationType)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                  <option value="New Technical Institution">New Technical Institution</option>
                  <option value="Course Addition / Intake Increase">Course Addition / Intake Increase</option>
                  <option value="Closure / Conversion of Institution">Closure / Conversion of Institution</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Workflow Stages Combination</label>
                <select
                  value={newWorkflowType}
                  onChange={(e) => setNewWorkflowType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="SCRUTINY_ONLY">Only Scrutiny (Standard EoA)</option>
                  <option value="SCRUTINY_EVC">Scrutiny + EVC Inspection</option>
                  <option value="FULL_PROCESS">Full Process (Scrutiny + EVC + SAC/SHC)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow"
                >
                  Create Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
