import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/audit-logs')
      .then((res) => setLogs(res.data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Audit Logs</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Recent system activity.</p>
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading...</p>
          ) : (
            <div className="bg-surface border border-surface-border rounded shadow-sm p-4">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase">
                  <tr>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Entity</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-body-md">
                  {logs.length ? (
                    logs.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-2">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2 font-medium">{l.action}</td>
                        <td className="px-4 py-2">{l.entityType} #{l.entityId}</td>
                        <td className="px-4 py-2">{l.user?.firstName} {l.user?.lastName}</td>
                        <td className="px-4 py-2">{l.details || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-on-surface-variant">
                        No audit logs found. Audit logging is not yet wired into every action.
                      </td>
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
