import React, { useState, useEffect } from 'react';
import { LeaseDocument } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AiDocumentExtractorModal } from '../AI/AiDocumentExtractorModal';
import { FileSpreadsheet, Sparkles, Plus } from 'lucide-react';

export const LeaseExpiryTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<LeaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // New Document Modal
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [docType, setDocType] = useState<LeaseDocument['documentType']>('Land Lease Deed');
  const [instName, setInstName] = useState('Delhi Technological University (DTU)');
  const [docNum, setDocNum] = useState('');
  const [issueDate, setIssueDate] = useState('2021-01-01');
  const [expiryDate, setExpiryDate] = useState('2026-11-01');

  const fetchDocuments = () => {
    setIsLoading(true);
    fetch('/api/lease-documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents || []);
        setIsLoading(false);
      })
      .catch(err => console.error('Failed to load lease documents:', err));
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNum.trim()) return;

    try {
      const res = await fetch('/api/lease-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          institutionName: instName,
          documentType: docType,
          documentNumber: docNum,
          issueDate: issueDate,
          expiryDate: expiryDate,
          issuingAuthority: 'Competent Statutory Authority',
        }),
      });

      if (res.ok) {
        setIsNewDocModalOpen(false);
        setDocNum('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to save document:', err);
    }
  };

  const getStatusBadge = (doc: LeaseDocument) => {
    if (doc.daysRemaining <= 0) {
      return <span className="bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/50 px-2.5 py-0.5 rounded font-mono font-bold text-[10px]">EXPIRED</span>;
    }
    if (doc.daysRemaining <= 7) {
      return <span className="bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/40 px-2 py-0.5 rounded font-mono font-bold text-[10px]">CRITICAL (&lt; 7 Days)</span>;
    }
    if (doc.daysRemaining <= 15) {
      return <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 px-2 py-0.5 rounded font-mono font-bold text-[10px]">WARNING (&lt; 15 Days)</span>;
    }
    if (doc.daysRemaining <= 30) {
      return <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold text-[10px]">ALERT (&lt; 30 Days)</span>;
    }
    return <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 px-2 py-0.5 rounded text-[10px]">ACTIVE</span>;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading statutory lease &amp; NOC expiry matrix...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Lease &amp; Document Expiry Monitoring System</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track land lease deeds, Fire NOCs, building safety certificates with advance 30/15/7 day alerts &amp; AI OCR verification.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>AI OCR Extractor</span>
          </button>
          <button
            onClick={() => setIsNewDocModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register Document</span>
          </button>
        </div>
      </div>

      {/* Lease Documents Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Institution Name</th>
                <th className="p-3.5">Document Type</th>
                <th className="p-3.5">Registration / NOC No</th>
                <th className="p-3.5">Issuing Authority</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Days Remaining</th>
                <th className="p-3.5">Renewal Status</th>
                <th className="p-3.5 text-right">AI Extraction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">{doc.institutionName}</td>
                  <td className="p-3.5 font-medium text-amber-600 dark:text-amber-400">{doc.documentType}</td>
                  <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">{doc.documentNumber}</td>
                  <td className="p-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">{doc.issuingAuthority}</td>
                  <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">{doc.expiryDate}</td>
                  <td className="p-3.5">
                    <span className={doc.daysRemaining <= 15 ? 'text-red-600 dark:text-red-400 font-bold font-mono' : 'text-slate-700 dark:text-slate-300 font-mono'}>
                      {doc.daysRemaining} Days
                    </span>
                  </td>
                  <td className="p-3.5">{getStatusBadge(doc)}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-2.5 py-1 bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 text-[11px] font-semibold rounded transition inline-flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Inspect AI</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI OCR Extractor Launcher Modal */}
      <AiDocumentExtractorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Register New Document Modal */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Register Statutory Document for Expiry Monitoring</h2>
              <button onClick={() => setIsNewDocModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Institution Name</label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Land Lease Deed">Land Lease Deed</option>
                  <option value="Fire Safety NOC">Fire Safety NOC</option>
                  <option value="Building Safety Certificate">Building Safety Certificate</option>
                  <option value="University Affiliation Letter">University Affiliation Letter</option>
                  <option value="AICTE Security Deposit">AICTE Security Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Registration / NOC Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REG-DEL-2026-9001"
                  value={docNum}
                  onChange={(e) => setDocNum(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow"
                >
                  Register Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
