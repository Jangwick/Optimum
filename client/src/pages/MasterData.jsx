import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { getInsuranceCompanies, getClients, getPolicies } from '../services/master-data.service.js';

function Section({ title, children }) {
  return (
    <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
      <h3 className="text-headline-sm font-semibold text-primary mb-4">{title}</h3>
      {children}
    </section>
  );
}

export default function MasterData() {
  const [tab, setTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getInsuranceCompanies(), getClients(), getPolicies()])
      .then(([c, cl, p]) => {
        setCompanies(c.items || []);
        setClients(cl.items || []);
        setPolicies(p.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'companies', label: 'Insurance Companies' },
    { key: 'clients', label: 'Clients' },
    { key: 'policies', label: 'Policies' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Master Data</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Insurance companies, clients, and policies.</p>
          </div>

          <div className="flex gap-2 border-b border-surface-border mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-body-md font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading...</p>
          ) : tab === 'companies' ? (
            <Section title="Insurance Companies">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-body-md">
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2 font-mono">{c.code}</td>
                      <td className="px-4 py-2">{c.email}</td>
                      <td className="px-4 py-2">{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ) : tab === 'clients' ? (
            <Section title="Clients">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Contact</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-body-md">
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2 font-mono">{c.code}</td>
                      <td className="px-4 py-2">{c.contactPerson}</td>
                      <td className="px-4 py-2">{c.email}</td>
                      <td className="px-4 py-2">{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ) : (
            <Section title="Policies">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase">
                  <tr>
                    <th className="px-4 py-2">Policy #</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Insurer</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Sum Insured</th>
                    <th className="px-4 py-2">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-body-md">
                  {policies.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-mono">{p.policyNumber}</td>
                      <td className="px-4 py-2">{p.client?.name}</td>
                      <td className="px-4 py-2">{p.insuranceCompany?.name}</td>
                      <td className="px-4 py-2">{p.claimType?.name}</td>
                      <td className="px-4 py-2 font-mono">{formatCurrency(p.sumInsured)}</td>
                      <td className="px-4 py-2 font-mono">{formatCurrency(p.premium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}
