import React, { useState, useEffect } from 'react';
import { WorkflowDefinition, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { GitMerge, Save, CheckCircle2 } from 'lucide-react';

export const WorkflowConfigManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWfId, setSelectedWfId] = useState<string>('wf-full');
  const [selectedWf, setSelectedWf] = useState<WorkflowDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/workflows')
      .then(res => res.json())
      .then(data => {
        const list = data.workflows || [];
        setWorkflows(list);
        if (list.length > 0) {
          setSelectedWf(list[0]);
          setSelectedWfId(list[0].id);
        }
        setIsLoading(false);
      })
      .catch(err => console.error('Failed to load workflows:', err));
  }, []);

  const handleSelectWorkflow = (id: string) => {
    setSelectedWfId(id);
    const found = workflows.find(w => w.id === id);
    if (found) setSelectedWf(found);
  };

  const handleSlaChange = (stageIdx: number, newSla: number) => {
    if (!selectedWf) return;
    const updated = JSON.parse(JSON.stringify(selectedWf)) as WorkflowDefinition;
    updated.stages[stageIdx].slaDays = newSla;
    setSelectedWf(updated);
  };

  const handleRoleChange = (stageIdx: number, newRole: UserRole) => {
    if (!selectedWf) return;
    const updated = JSON.parse(JSON.stringify(selectedWf)) as WorkflowDefinition;
    updated.stages[stageIdx].responsibleRole = newRole;
    setSelectedWf(updated);
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWf) return;
    setSaveSuccess(null);

    try {
      const res = await fetch(`/api/workflows/${selectedWf.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(selectedWf),
      });

      if (res.ok) {
        setSaveSuccess(`Workflow '${selectedWf.name}' configuration successfully updated & saved to statutory rules engine.`);
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
    }
  };

  if (isLoading || !selectedWf) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading statutory workflow engine configuration...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <GitMerge className="w-5 h-5 text-amber-500" />
            <span>Configurable Workflow Engine Manager</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure approval stage combinations, SLA target days, responsible officer roles, and prerequisite gates.
          </p>
        </div>
        <button
          onClick={handleSaveWorkflow}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Workflow Model Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {workflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => handleSelectWorkflow(wf.id)}
            className={`p-4 rounded-xl border text-left transition ${
              wf.id === selectedWfId
                ? 'bg-amber-500/10 border-amber-500/50 text-slate-900 dark:text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-amber-600 dark:text-amber-400 mb-1">{wf.code}</div>
            <div className="font-semibold text-sm text-slate-900 dark:text-white">{wf.name}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{wf.description}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
              {wf.stages.length} Stage Sequence
            </div>
          </button>
        ))}
      </div>

      {/* Selected Workflow Stage Editor Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stage Sequence &amp; SLA Rules: {selectedWf.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Modify target SLA turnaround days and responsible officer roles per stage</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Sequence</th>
                <th className="p-3">Stage Name</th>
                <th className="p-3">Responsible Role Desk</th>
                <th className="p-3">Target SLA Days</th>
                <th className="p-3">Required Prerequisites</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {selectedWf.stages.map((stg, idx) => (
                <tr key={stg.stage} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">Step #{stg.sequenceOrder}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{stg.stage}</td>
                  <td className="p-3">
                    <select
                      value={stg.responsibleRole}
                      onChange={(e) => handleRoleChange(idx, e.target.value as UserRole)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="REGIONAL_OFFICER">Regional Officer</option>
                      <option value="BUREAU_OFFICER">Bureau Officer</option>
                      <option value="EVC_MEMBER">EVC Committee Member</option>
                      <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                      <option value="INSTITUTION_USER">Institution User</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={stg.slaDays}
                      onChange={(e) => handleSlaChange(idx, Number(e.target.value))}
                      className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="ml-1 text-slate-500">Days</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {stg.requiredPrerequisites.length > 0 ? (
                        stg.requiredPrerequisites.map((pr) => (
                          <span key={pr} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {pr}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">None Required</span>
                      )}
                    </div>
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
