import { useEffect, useState } from 'react';
import { getTemplates, createTemplate, deleteTemplate, setDefaultTemplate, downloadTemplate } from '../services/report-template.service.js';
import { DataTable } from '../components/DataTable.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { Download, Trash2, Star, StarOff } from 'lucide-react';

const PLACEHOLDERS = ['claimNumber', 'clientName', 'insurerName', 'claimType', 'engineerName', 'statusName', 'dateOfLoss', 'estimatedLoss', 'reserve', 'generatedAt', 'notes'];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await getTemplates();
    setTemplates(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('name', name || file.name);
    form.append('description', description);
    form.append('isDefault', 'false');
    await createTemplate(form);
    setFile(null);
    setName('');
    setDescription('');
    await load();
  };

  const handleDelete = async () => {
    await deleteTemplate(confirm.id);
    setConfirm(null);
    await load();
  };

  const handleDefault = async (id) => {
    await setDefaultTemplate(id);
    await load();
  };

  const handleDownload = async (id, fileName) => {
    const blob = await downloadTemplate(id);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `template-${id}.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'type', title: 'Type' },
    { key: 'fileName', title: 'File' },
    { key: 'isDefault', title: 'Default', render: (row) => (row.isDefault ? 'Yes' : 'No') },
  ];

  const rowActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handleDefault(row.id)}
        className="p-1.5 text-primary hover:bg-surface-container-low rounded"
        title={row.isDefault ? 'Already default' : 'Set as default'}
        disabled={row.isDefault}
      >
        {row.isDefault ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
      </button>
      <button
        onClick={() => handleDownload(row.id, row.fileName)}
        className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-low rounded"
        title="Download"
      >
        <Download size={16} />
      </button>
      <button
        onClick={() => setConfirm({ id: row.id, name: row.name })}
        className="p-1.5 text-error hover:bg-error/10 rounded"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Report Templates</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Upload DOCX templates with the following placeholders:</p>
            <code className="block mt-2 text-body-sm text-on-surface-variant font-mono">
              {'{'}{PLACEHOLDERS.join('}, {')}{'}'}
            </code>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-4 mb-6">
            <h3 className="text-headline-sm font-semibold text-primary">Upload Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="h-10 px-3 rounded border border-outline bg-surface text-body-md" />
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="h-10 px-3 rounded border border-outline bg-surface text-body-md" />
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files[0])}
                className="h-10 text-body-md"
              />
            </div>
            <button type="submit" disabled={!file} className="h-10 px-4 bg-primary text-white rounded font-semibold disabled:opacity-50">Upload</button>
          </form>

          <DataTable
            columns={columns}
            rows={templates}
            loading={loading}
            rowActions={rowActions}
            keyExtractor={(row) => row.id}
          />

          {confirm && (
            <ConfirmDialog
              open={!!confirm}
              onClose={() => setConfirm(null)}
              onConfirm={handleDelete}
              title="Delete template"
              message={`Delete template "${confirm.name}"?`}
              confirmText="Delete"
              danger
            />
          )}
        </main>
      </div>
    </div>
  );
}
