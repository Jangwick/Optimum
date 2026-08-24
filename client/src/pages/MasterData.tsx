import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
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
import { Building2, Users, FileText, Tags, FolderOpen } from 'lucide-react';

type LucideIcon = typeof Building2;

interface MasterDataField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'date';
  required?: boolean;
}

type ListFn = (params: Record<string, unknown>) => Promise<Record<string, unknown>>;

const baseFields: Record<string, MasterDataField[]> = {
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

const TAB_CONFIG: { key: string; label: string; short: string; icon: LucideIcon }[] = [
  { key: 'companies', label: 'Insurance Companies', short: 'Insurers', icon: Building2 },
  { key: 'clients', label: 'Clients', short: 'Clients', icon: Users },
  { key: 'policies', label: 'Policies', short: 'Policies', icon: FileText },
  { key: 'claimTypes', label: 'Claim Types', short: 'Claim Types', icon: Tags },
  { key: 'documentCategories', label: 'Document Categories', short: 'Doc Categories', icon: FolderOpen },
];

const VALID_TABS = ['companies', 'clients', 'policies', 'claimTypes', 'documentCategories'];

export default function MasterData() {
  const [searchParams] = useSearchParams();
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'companies';
  }, [searchParams]);
  const initialSearch = useMemo(() => searchParams.get('search') || '', [searchParams]);
  const [tab, setTab] = useState(initialTab);

  const renderSection = (): ReactNode => {
    switch (tab) {
      case 'companies':
        return (
          <MasterDataCrud
            title="Insurance Companies"
            entityLabel="Insurance Company"
            list={getInsuranceCompanies as unknown as ListFn}
            create={createInsuranceCompany}
            update={updateInsuranceCompany}
            remove={deleteInsuranceCompany}
            fields={baseFields['insurance']!}
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
            entityLabel="Client"
            list={getClients as unknown as ListFn}
            create={createClient}
            update={updateClient}
            remove={deleteClient}
            fields={baseFields['client']!}
            defaultValues={{ name: '', code: '', contactPerson: '', email: '', phone: '', address: '' }}
            initialSearch={initialSearch}
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
            entityLabel="Policy"
            list={getPolicies as unknown as ListFn}
            create={createPolicy}
            update={updatePolicy}
            remove={deletePolicy}
            fields={baseFields['policy']!}
            initialSearch={initialSearch}
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
              { key: 'client', title: 'Client', render: (row) => (row['client'] as Record<string, unknown> | undefined)?.['name'] as ReactNode },
              { key: 'insuranceCompany', title: 'Insurer', render: (row) => (row['insuranceCompany'] as Record<string, unknown> | undefined)?.['name'] as ReactNode },
              { key: 'claimType', title: 'Type', render: (row) => (row['claimType'] as Record<string, unknown> | undefined)?.['name'] as ReactNode },
              { key: 'sumInsured', title: 'Sum Insured', align: 'right', render: (row) => formatCurrency(row['sumInsured'] as string | number | undefined) },
              { key: 'premium', title: 'Premium', align: 'right', render: (row) => formatCurrency(row['premium'] as string | number | undefined) },
              {
                key: 'startDate',
                title: 'Period',
                render: (row) =>
                  (row['startDate'] as string | undefined)
                    ? `${new Date(row['startDate'] as string).toLocaleDateString()} — ${
                        (row['endDate'] as string | undefined)
                          ? new Date(row['endDate'] as string).toLocaleDateString()
                          : 'Open'
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
            entityLabel="Claim Type"
            list={getClaimTypes as unknown as ListFn}
            create={createClaimType}
            update={updateClaimType}
            remove={deleteClaimType}
            fields={baseFields['claimType']!}
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
            entityLabel="Document Category"
            list={getDocumentCategories as unknown as ListFn}
            create={createDocumentCategory}
            update={updateDocumentCategory}
            remove={deleteDocumentCategory}
            fields={baseFields['documentCategory']!}
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
    <AppLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-headline-lg font-semibold text-primary">Master Data</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Insurance companies, clients, policies, and lookups.</p>
      </div>

      {/* Tabs with icons */}
      <div className="flex gap-1 border-b border-surface-border mb-6 overflow-x-auto">
        {TAB_CONFIG.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-body-md font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-t'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-primary' : 'text-outline'} />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </button>
          );
        })}
      </div>

      {renderSection()}
    </AppLayout>
  );
}
