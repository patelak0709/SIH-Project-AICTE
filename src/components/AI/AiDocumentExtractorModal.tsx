import React, { useState } from 'react';
import { AiExtractionResult } from '../../types';
import { Sparkles, FileText, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface AiDocumentExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedInstitutionName?: string;
  expectedDocumentNumber?: string;
}

export const AiDocumentExtractorModal: React.FC<AiDocumentExtractorModalProps> = ({
  isOpen, onClose, expectedInstitutionName, expectedDocumentNumber
}) => {
  const [selectedSample, setSelectedSample] = useState<string>('dtu_land_lease');
  const [customText, setCustomText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<AiExtractionResult | null>(null);

  if (!isOpen) return null;

  const SAMPLES = [
    {
      id: 'dtu_land_lease',
      name: 'Delhi Tech Univ - 30 Year Land Lease Deed',
      content: `DEED OF LEASE FOR TECHNICAL INSTITUTION
This Irrevocable Lease Deed is executed on 01-11-2008 at Delhi between Sub-Registrar Delhi North (Lessor) and Delhi Technological University (DTU) (Lessee) for educational plot #44, Rohini.
Registration No: REG-DEL-2008-9941.
Lease Period: 18 Years commencing 01-11-2008 and expiring on 01-11-2026.
Non-encumbrance Covenants: Land shall be exclusively utilized for AICTE approved degree engineering programs. Unencumbered possession granted.`,
    },
    {
      id: 'vjti_fire_noc',
      name: 'VJTI Mumbai - Fire Safety NOC',
      content: `MUMBAI FIRE BRIGADE HEADQUARTERS
NO-OBJECTION CERTIFICATE FOR BUILDING SAFETY
Certificate No: NOC-FS-MUM-2023-412.
Issued To: Veermata Jijabai Technological Institute (VJTI) Matunga Campus.
Issue Date: 10-11-2023. Valid Up To: 10-11-2026.
Fire Fighting System Audit: Hydrant pumps, smoke detectors, automated sprinklers, and emergency staircase exits inspected and certified compliant with National Building Code 2016 Part 4.`,
    },
    {
      id: 'bitr_expired_pwd',
      name: 'BITR Bangalore - Building Safety Certificate (Expired Anomaly)',
      content: `PUBLIC WORKS DEPARTMENT (PWD) KARNATAKA
STRUCTURAL STABILITY & BUILDING SAFETY CERTIFICATE
Certificate No: PWD-KAR-2021-8810.
Issued To: Bangalore Institute of Technology & Research.
Issue Date: 10-10-2021. Expiry Date: 10-10-2026.
Audit Note: Structural load testing performed for 4-storey academic block. Renewal submission mandatory prior to expiration.`,
    },
  ];

  const handleExtract = async () => {
    setIsExtracting(true);
    setResult(null);

    const sample = SAMPLES.find(s => s.id === selectedSample);
    const contentToExtract = customText || (sample ? sample.content : 'Land Lease Deed text');
    const fileName = sample ? sample.name : 'Uploaded_Statutory_Doc.txt';

    try {
      const res = await fetch('/api/ai/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: contentToExtract,
          fileName: fileName,
          mimeType: 'text/plain',
          expectedInstitutionName: expectedInstitutionName || 'Delhi Technological University (DTU)',
          expectedDocumentNumber: expectedDocumentNumber || 'REG-DEL-2008-9941',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.extractionResult);
      }
    } catch (err) {
      console.error('AI extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-slate-800 dark:text-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">AI OCR Statutory Document Field Extractor</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini 3.8 Flash • Extracts parameters &amp; flags discrepancies</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl">×</button>
        </div>

        {/* Document Selection Input */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Select Sample Statutory Document OR Paste Text</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              {SAMPLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSample(s.id);
                    setCustomText('');
                  }}
                  className={`p-2.5 rounded-lg border text-left text-[11px] transition ${
                    selectedSample === s.id && !customText
                      ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/50 text-purple-900 dark:text-purple-200 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mb-1" />
                  <div className="truncate">{s.name}</div>
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setSelectedSample('');
              }}
              placeholder="Or paste custom deed / NOC text here for AI extraction..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow transition flex items-center space-x-2"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI OCR Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Extraction Result Display */}
        {result && (
          <div className="bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-900/60 rounded-xl p-4 space-y-3 text-xs text-slate-800 dark:text-slate-200 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-bold text-purple-700 dark:text-purple-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>AI Field Extraction Results</span>
              </span>
              <span className="text-[10px] bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-500/30 font-mono">
                Confidence: {(result.confidenceScore * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-slate-800 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
              {result.summary}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div><span className="text-slate-500 dark:text-slate-400">Doc Type:</span> <strong className="text-slate-900 dark:text-white">{result.documentType}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400">Doc Number:</span> <strong className="text-amber-600 dark:text-amber-400 font-mono">{result.documentNumber}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400">Extracted Name:</span> <strong className="text-slate-900 dark:text-white">{result.institutionName}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400">Authority:</span> <strong className="text-slate-800 dark:text-slate-200">{result.issuingAuthority}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400">Issue Date:</span> <span className="text-slate-700 dark:text-slate-300">{result.issueDate}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Expiry Date:</span> <span className="text-red-600 dark:text-red-400 font-bold">{result.expiryDate}</span></div>
            </div>

            {/* Key Covenants */}
            {result.keyTermsExtracted && result.keyTermsExtracted.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Extracted Key Statutory Covenants:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
                  {result.keyTermsExtracted.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Discrepancies Warning Box */}
            {result.discrepancies && result.discrepancies.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 rounded-lg space-y-1.5">
                <div className="text-red-700 dark:text-red-400 font-bold text-[11px] flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>DISCREPANCIES FLAGGED FOR HUMAN REVIEW:</span>
                </div>
                {result.discrepancies.map((d, i) => (
                  <div key={i} className="text-[11px] text-slate-800 dark:text-slate-300 pl-4 border-l-2 border-red-500">
                    <div><strong>Field:</strong> {d.field}</div>
                    <div>Expected: <span className="text-slate-500 dark:text-slate-400">{d.expected}</span> vs Extracted: <span className="text-red-700 dark:text-red-300 font-bold">{d.extracted}</span></div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[10px] text-slate-500 italic pt-1 text-right">
              * Note: Statutory decisions remain under authorized human control per AICTE regulatory safeguards.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
