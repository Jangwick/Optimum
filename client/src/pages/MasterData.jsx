import { useState } from 'react';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { MasterDataCrud } from '../components/MasterDataCrud.jsx';
import {
  getInsuranceCompanies,
  createInsuranceCompany,
  updateInsuranceCompany,
  deleteInsuranceCompany,
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getClaimTypes,
  createClaimType,
  updateClaimType,
  deleteClaimType,
  getDocumentCategories,
  createDocumentCategory,
  updateDocumentCategory,
  deleteDocumentCategory,
} from '../services/master-data.service.js';
import { formatCurrency } from '../utils/currency.js';

const baseFields = {
  insurance: [
    { key: 'name', label: 'Name', required: true },
    { key: 'code', label: 'Code', required: true },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
  client: [
    { key: 'name', label: 'Name', required: true },
    { key: 'code', label: 'Code', required: true },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
  policy: [
    { key: 'policyNumber', label: 'Policy #', required: true },
    { key: 'insuranceCompanyId', label: 'Insurer ID', type: 'number', required: true },
    { key: 'clientId', label: 'Client ID', type: 'number', required: true },
    { key: 'claimTypeId', label: 'Claim Type ID', type: 'number', required: true },
    { key: 'policyType', label: 'Policy Type' },
    { key: 'coverageDetails', label: 'Coverage Details' },
    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'sumInsured', label: 'Sum Insured', type: 'number' },
    { key: 'premium', label: 'Premium', type: 'number' },
    { key: 'excess', label: 'Excess', type: 'number' },
    { key: 'notes', label: 'Notes' },
  ],
  claimType: [
    { key: 'name', label: 'Name', required: true },
    { key: 'code', label: 'Code', required: true },
    { key: 'description', label: 'Description' },
  ],
  documentCategory: [
    { key: 'name', label: 'Name', required: true },
    { key: 'code', label: 'Code', required: true },
    { key: 'description', label: 'Description' },
  ],
};

export default function MasterData() {
  const [tab, setTab] = useState('companies');

  const tabs = [
    { key: 'companies', label: 'Insurance Companies' },
    { key: 'clients', label: 'Clients' },
    { key: 'policies', label: 'Policies' },
    { key: 'claimTypes', label: 'Claim Types' },
    { key: 'documentCategories', label: 'Document Categories' },
  ];

  const renderSection = () => {
    switch (tab) {
      case 'companies':
        return (
          <MasterDataCrud
            title="Insurance Companies"
            list={getInsuranceCompanies}
            create={createInsuranceCompany}
            update={updateInsuranceCompany}
            remove={deleteInsuranceCompany}
            fields={baseFields.insurance}
            defaultValues={{ name: '', code: '', contactPerson: '', email: '', phone: '', address: '' }}
            columns={[
              { key: 'name', title: 'Name' },
              { key: 'code', title: 'Code', className: 'font-mono' },
              { key: 'contactPerson', title: 'Contact' },
              { key: 'email', title: 'Email' },
              { key: 'phone', title: 'Phone' },
            ]}
          />
        );
      case 'clients':
        return (
          <MasterDataCrud
            title="Clients"
            list={getClients}
            create={createClient}
            update={updateClient}
            remove={deleteClient}
            fields={baseFields.client}
            defaultValues={{ name: '', code: '', contactPerson: '', email: '', phone: '', address: '' }}
            columns={[
              { key: 'name', title: 'Name' },
              { key: 'code', title: 'Code', className: 'font-mono' },
              { key: 'contactPerson', title: 'Contact' },
              { key: 'email', title: 'Email' },
              { key: 'phone', title: 'Phone' },
            ]}
          />
        );
      case 'policies':
        return (
          <MasterDataCrud
            title="Policies"
            list={getPolicies}
            create={createPolicy}
            update={updatePolicy}
            remove={deletePolicy}
            fields={baseFields.policy}
            defaultValues={{
              policyNumber: '',
              insuranceCompanyId: '',
              clientId: '',
              claimTypeId: '',
              policyType: '',
              coverageDetails: '',
              startDate: '',
              endDate: '',
              sumInsured: '',
              premium: '',
              excess: '',
              notes: '',
            }}
            columns={[
              { key: 'policyNumber', title: 'Policy #', className: 'font-mono' },
              { key: 'client', title: 'Client', render: (row) => row.client?.name },
              { key: 'insuranceCompany', title: 'Insurer', render: (row) => row.insuranceCompany?.name },
              { key: 'claimType', title: 'Type', render: (row) => row.claimType?.name },
              { key: 'sumInsured', title: 'Sum Insured', align: 'right', render: (row) => formatCurrency(row.sumInsured) },
              { key: 'premium', title: 'Premium', align: 'right', render: (row) => formatCurrency(row.premium) },
              {
                key: 'startDate',
                title: 'Period',
                render: (row) =>
                  row.startDate
                    ? `${new Date(row.startDate).toLocaleDateString()} — ${
                        row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Open'
                      }`
                    : '—',
              },
            ]}
          />
        );
      case 'claimTypes':
        return (
          <MasterDataCrud
            title="Claim Types"
            list={getClaimTypes}
            create={createClaimType}
            update={updateClaimType}
            remove={deleteClaimType}
            fields={baseFields.claimType}
            defaultValues={{ name: '', code: '', description: '' }}
            columns={[
              { key: 'name', title: 'Name' },
              { key: 'code', title: 'Code', className: 'font-mono' },
              { key: 'description', title: 'Description' },
            ]}
          />
        );
      case 'documentCategories':
        return (
          <MasterDataCrud
            title="Document Categories"
            list={getDocumentCategories}
            create={createDocumentCategory}
            update={updateDocumentCategory}
            remove={deleteDocumentCategory}
            fields={baseFields.documentCategory}
            defaultValues={{ name: '', code: '', description: '' }}
            columns={[
              { key: 'name', title: 'Name' },
              { key: 'code', title: 'Code', className: 'font-mono' },
              { key: 'description', title: 'Description' },
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Master Data</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Insurance companies, clients, policies, and lookups.</p>
          </div>

          <div className="flex gap-2 border-b border-surface-border mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-body-md font-medium border-b-2 transition-colors ${
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {renderSection()}
        </main>
      </div>
    </div>
  );
}
