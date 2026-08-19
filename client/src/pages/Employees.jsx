import { useEffect, useState } from 'react';
import { getUsers } from '../services/user.service.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Employees</h2>
            <p className="text-body-md text-on-surface-variant mt-1">System users and roles.</p>
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading...</p>
          ) : (
            <div className="bg-surface border border-surface-border rounded shadow-sm p-4">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-body-md">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.role}</td>
                      <td className="px-4 py-2">{u.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
