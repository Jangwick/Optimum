import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/report-templates');
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
    await api.post('/report-templates', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setFile(null);
    setName('');
    setDescription('');
    await load();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Report Templates</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Upload DOCX templates with tags like {'{claimNumber}'}, {'{clientName}'}, {'{notes}'}, etc.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-4 mb-6">
            <h3 className="text-headline-sm font-semibold text-primary">Upload Template</h3>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files[0])} className="w-full text-body-md" />
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Upload</button>
          </form>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading...</p>
          ) : (
            <div className="bg-surface border border-surface-border rounded shadow-sm p-4">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">File</th>
                    <th className="px-4 py-2">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-body-md">
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2">{t.name}</td>
                      <td className="px-4 py-2">{t.type}</td>
                      <td className="px-4 py-2">{t.fileName}</td>
                      <td className="px-4 py-2">{t.isDefault ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-on-surface-variant">No templates uploaded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
