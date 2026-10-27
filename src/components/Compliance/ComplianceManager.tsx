import React, { useState, useEffect } from 'react';
import { UndertakingObligation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Upload, ShieldCheck } from 'lucide-react';

export const ComplianceManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [undertakings, setUndertakings] = useState<UndertakingObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal State
  const [activeItem, setActiveItem] = useState<UndertakingObligation | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');

  // Verify Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'DEFICIENT'>('VERIFIED');
  const [officerRemarks, setOfficerRemarks] = useState('');

  const fetchUndertakings = () => {
    setIsLoading(true);
    fetch('/api/compliance/undertakings')
      .then(res => res.json())
      .then(data => {
        setUndertakings(data.undertakings || []);
        setIsLoading(false);
      })
      .catch(err => console.error('Failed to load compliance data:', err));
  };

  useEffect(() => {
    fetchUndertakings();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !fileName.trim()) return;

    try {
      const res = await fetch(`/api/compliance/undertakings/${activeItem.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          fileName: fileName,
          fileUrl: `/uploads/${fileName}`,
        }),
      });

      if (res.ok) {
        setIsUploadModalOpen(false);
        setFileName('');
        fetchUndertakings();
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    try {
      const res = await fetch(`/api/compliance/undertakings/${activeItem.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          status: verifyStatus,
          remarks: officerRemarks,
        }),
      });

      if (res.ok) {
        setIsVerifyModalOpen(false);
        setOfficerRemarks('');
        fetchUndertakings();
      }
    } catch (err) {
      console.error('Failed to verify undertaking:', err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading statutory compliance obligations...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Statutory Undertakings &amp; Compliance Verification</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor institutional affidavits, NBA accreditation compliance, barrier-free accessibility certificates &amp; safety covenants.
        </p>
      </div>

      {/* Compliance Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {undertakings.map((u) => (
          <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-3 transition-colors">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white text-sm block">{u.title}</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{u.institutionName}</span>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold border shrink-0 ${
                u.status === 'VERIFIED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' :
                u.status === 'OVERDUE' ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/40 font-mono' :
                u.status === 'SUBMITTED' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40' :
                'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
              }`}>
                {u.status}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300">{u.description}</p>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Compliance Due Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{u.dueDate}</span>
              </div>
              {u.submittedDocumentName && (
                <div className="flex justify-between">
                  <span>Uploaded Document:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-medium truncate max-w-[180px]">
                    {u.submittedDocumentName}
                  </span>
                </div>
              )}
              {u.verifiedBy && (
                <div className="flex justify-between text-[11px]">
                  <span>Verified By Officer:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{u.verifiedBy}</span>
                </div>
              )}
            </div>

            {u.officerRemarks && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/80 p-2 rounded border border-slate-200 dark:border-slate-800 italic">
                "{u.officerRemarks}"
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setActiveItem(u);
                  setIsUploadModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded transition flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Upload Affidavit</span>
              </button>

              <button
                onClick={() => {
                  setActiveItem(u);
                  setIsVerifyModalOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Officer Audit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload Compliance Affidavit Document</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Uploading compliance evidence for <strong className="text-slate-900 dark:text-white">{activeItem.title}</strong>
              </p>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Document File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DTU_NBA_Accreditation_Affidavit_2026.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow"
                >
                  Submit Affidavit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {isVerifyModalOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Compliance Officer Audit Verification</h2>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Verification Status Decision</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="VERIFIED">VERIFIED - Compliant</option>
                  <option value="DEFICIENT">DEFICIENT - Re-submission Required</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Officer Audit Remarks</label>
                <textarea
                  rows={3}
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  placeholder="Record verification notes or reasons if marked deficient..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
                >
                  Record Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
