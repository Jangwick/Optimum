import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  Eye,
  Save,
  CheckCircle,
  Undo2,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  uploadWorkbook,
  previewWorkbook,
  persistRows,
  commitBatch,
  rollbackBatch,
  getImportBatches,
} from '../services/import.service.js';

const STEPS = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'persist', label: 'Persist', icon: Save },
  { key: 'commit', label: 'Commit', icon: CheckCircle },
];

export default function ImportWizard() {
  const [step, setStep] = useState(0);
  const [batchId, setBatchId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [persistResult, setPersistResult] = useState(null);
  const [commitResult, setCommitResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [batches, setBatches] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    setLoading(true);
    try {
      const result = await uploadWorkbook(file);
      setBatchId(result.item.id);
      toast.success(`Uploaded: ${result.item.fileName}`);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const result = await previewWorkbook(batchId);
      setPreview(result.item);
      toast.success(`Parsed ${result.item.totalRows} rows across ${result.item.sheets.length} sheets`);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePersist = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const result = await persistRows(batchId);
      setPersistResult(result.item);
      toast.success(`Persisted ${result.item.acceptedRows} accepted, ${result.item.flaggedRows} flagged`);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Persist failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const result = await commitBatch(batchId, { duplicateAction: 'SKIP' });
      setCommitResult(result.item);
      toast.success(`Committed ${result.item.committed} claims (${result.item.skipped} skipped, ${result.item.errors} errors)`);
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Commit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!batchId) return;
    if (!confirm('Rollback will delete all claims created from this batch. Continue?')) return;
    setLoading(true);
    try {
      const result = await rollbackBatch(batchId);
      toast.success(`Rolled back: ${result.item.claimsDeleted} claims deleted`);
      setCommitResult(null);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rollback failed');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getImportBatches({ limit: 10 });
      setBatches(result.items);
      setShowHistory(true);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => {
    setStep(0);
    setBatchId(null);
    setPreview(null);
    setPersistResult(null);
    setCommitResult(null);
    setFile(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-md font-semibold text-on-surface">Import Wizard</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Upload and import legacy claim workbooks
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="px-4 py-2 rounded text-label-md bg-surface-variant/20 text-on-surface hover:bg-surface-variant/30 transition-colors"
        >
          Import History
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded text-label-md ${
                i <= step
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-variant/10 text-on-surface-variant'
              }`}
            >
              <s.icon size={16} strokeWidth={1.5} />
              {s.label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={16} className="text-on-surface-variant" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-surface border border-outline-variant rounded-lg p-6">
        {/* Step 0: Upload */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Select workbook (.xlsx)</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-body-md text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-on-primary file:cursor-pointer hover:file:bg-primary/90"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-body-md text-on-surface">
                <FileSpreadsheet size={20} className="text-primary" />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-6 py-2 rounded bg-primary text-on-primary text-label-md disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload
            </button>
          </div>
        )}

        {/* Step 1: Preview */}
        {step === 1 && (
          <div className="space-y-4">
            {preview ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-variant/10 rounded p-4">
                    <p className="text-label-sm text-on-surface-variant">Total Rows</p>
                    <p className="text-headline-sm font-semibold text-on-surface">{preview.totalRows}</p>
                  </div>
                  <div className="bg-surface-variant/10 rounded p-4">
                    <p className="text-label-sm text-on-surface-variant">Sheets</p>
                    <p className="text-headline-sm font-semibold text-on-surface">{preview.sheets.length}</p>
                  </div>
                  <div className="bg-surface-variant/10 rounded p-4">
                    <p className="text-label-sm text-on-surface-variant">Issues</p>
                    <p className="text-headline-sm font-semibold text-error">{preview.issuesCount}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-label-lg font-medium text-on-surface mb-2">Sheets</h3>
                  <div className="space-y-1">
                    {preview.sheets.map((s) => (
                      <div key={s.name} className="flex justify-between text-body-md text-on-surface py-1">
                        <span>{s.name}</span>
                        <span className="text-on-surface-variant">{s.rowCount} rows</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-label-lg font-medium text-on-surface mb-2">Sample Rows (first 20)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-body-sm">
                      <thead>
                        <tr className="text-left text-on-surface-variant border-b border-outline-variant">
                          <th className="py-2 pr-4">Sheet</th>
                          <th className="py-2 pr-4">Row</th>
                          <th className="py-2 pr-4">Claim Number</th>
                          <th className="py-2 pr-4">Inferred Status</th>
                          <th className="py-2 pr-4">Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sampleRows.map((r, i) => (
                          <tr key={i} className="border-b border-outline-variant/50">
                            <td className="py-2 pr-4 text-on-surface-variant">{r.sourceSheet}</td>
                            <td className="py-2 pr-4 text-on-surface-variant">{r.sourceRowNumber}</td>
                            <td className="py-2 pr-4 text-on-surface">{r.mappedData?.claimNumber || '—'}</td>
                            <td className="py-2 pr-4 text-on-surface">{r.inferredStatus || '—'}</td>
                            <td className="py-2 pr-4">
                              {r.issues?.length > 0 ? (
                                <span className="text-error flex items-center gap-1">
                                  <AlertTriangle size={14} /> {r.issues.length}
                                </span>
                              ) : (
                                <span className="text-on-surface-variant">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-body-md text-on-surface-variant">Loading preview...</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={loading}
                className="px-6 py-2 rounded bg-surface-variant/20 text-on-surface text-label-md hover:bg-surface-variant/30 transition-colors"
              >
                Re-preview
              </button>
              <button
                onClick={persistRows && handlePersist}
                disabled={loading || !batchId}
                className="px-6 py-2 rounded bg-primary text-on-primary text-label-md disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Persist Rows
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Persist result */}
        {step === 2 && persistResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary-container/20 rounded p-4">
                <p className="text-label-sm text-on-surface-variant">Accepted</p>
                <p className="text-headline-sm font-semibold text-primary">{persistResult.acceptedRows}</p>
              </div>
              <div className="bg-error-container/20 rounded p-4">
                <p className="text-label-sm text-on-surface-variant">Flagged</p>
                <p className="text-headline-sm font-semibold text-error">{persistResult.flaggedRows}</p>
              </div>
              <div className="bg-surface-variant/10 rounded p-4">
                <p className="text-label-sm text-on-surface-variant">Total</p>
                <p className="text-headline-sm font-semibold text-on-surface">{persistResult.totalRows}</p>
              </div>
            </div>
            <p className="text-body-md text-on-surface-variant">
              {persistResult.flaggedRows > 0
                ? `${persistResult.flaggedRows} rows have issues and will be flagged for review. They can still be committed but will be marked as incomplete.`
                : 'All rows accepted. Ready to commit.'}
            </p>
            <button
              onClick={handleCommit}
              disabled={loading}
              className="px-6 py-2 rounded bg-primary text-on-primary text-label-md disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Commit to Database
            </button>
          </div>
        )}

        {/* Step 3: Commit result */}
        {step >= 3 && commitResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary-container/20 rounded p-4">
                <p className="text-label-sm text-on-surface-variant">Committed</p>
                <p className="text-headline-sm font-semibold text-primary">{commitResult.committed}</p>
              </div>
              <div className="bg-surface-variant/10 rounded p-4">
                <p className="text-label-sm text-on-surface-variant">Skipped</p>
                <p className="text-headline-sm font-semibold text-on-surface">{commitResult.skipped}</p>
              </div>
              <div className="bg-error-container/20 rounded p-4">
                <p className="text-label-sm text-on-surface-variant">Errors</p>
                <p className="text-headline-sm font-semibold text-error">{commitResult.errors}</p>
              </div>
            </div>
            {commitResult.errorDetails?.length > 0 && (
              <div className="bg-error-container/10 rounded p-4 max-h-60 overflow-y-auto">
                <h4 className="text-label-md text-error mb-2">Error Details</h4>
                {commitResult.errorDetails.map((e, i) => (
                  <div key={i} className="text-body-sm text-on-surface py-1">
                    <span className="text-on-surface-variant">{e.sourceSheet}:{e.sourceRowNumber}</span> — {e.error}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleRollback}
                disabled={loading}
                className="px-6 py-2 rounded bg-error-container/20 text-error text-label-md hover:bg-error-container/30 transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                Rollback
              </button>
              <button
                onClick={reset}
                className="px-6 py-2 rounded bg-surface-variant/20 text-on-surface text-label-md hover:bg-surface-variant/30 transition-colors"
              >
                New Import
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="mt-6 bg-surface border border-outline-variant rounded-lg p-6">
          <h2 className="text-label-lg font-medium text-on-surface mb-4">Recent Import Batches</h2>
          {batches.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No imports yet.</p>
          ) : (
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-left text-on-surface-variant border-b border-outline-variant">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">File</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Rows</th>
                  <th className="py-2 pr-4">Committed</th>
                  <th className="py-2 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b border-outline-variant/50">
                    <td className="py-2 pr-4 text-on-surface-variant">#{b.id}</td>
                    <td className="py-2 pr-4 text-on-surface">{b.fileName}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-label-sm ${
                        b.status === 'COMMITTED' ? 'bg-primary-container/20 text-primary' :
                        b.status === 'ROLLED_BACK' ? 'bg-error-container/20 text-error' :
                        'bg-surface-variant/20 text-on-surface-variant'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-on-surface-variant">{b.totalRows}</td>
                    <td className="py-2 pr-4 text-on-surface-variant">{b.committedRows}</td>
                    <td className="py-2 pr-4 text-on-surface-variant">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
