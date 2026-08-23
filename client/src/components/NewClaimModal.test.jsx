import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewClaimModal } from './NewClaimModal.jsx';

vi.mock('../services/claim.service.js', () => ({ createClaim: vi.fn() }));
vi.mock('../services/master-data.service.js', () => ({
  getPolicies: vi.fn(),
  getClaimTypes: vi.fn(),
  getInsuranceCompanies: vi.fn(),
  getClients: vi.fn(),
}));
vi.mock('../services/user.service.js', () => ({ getUsers: vi.fn() }));
vi.mock('./Modal.jsx', () => ({
  Modal: ({ open, children }) => (open ? <div>{children}</div> : null),
}));

import {
  getPolicies,
  getClaimTypes,
  getInsuranceCompanies,
  getClients,
} from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { createClaim } from '../services/claim.service.js';

const policy = {
  id: 7,
  policyNumber: 'POL-2026-0007',
  policyType: 'Fire',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  coverageDetails: 'Building and contents',
  client: { id: 2, name: 'Acme Trading' },
  insuranceCompany: { id: 3, name: 'Optimum Insurance' },
  claimType: { id: 4, name: 'Property' },
};

const secondPolicy = {
  ...policy,
  id: 8,
  policyNumber: 'POL-2026-0008',
  client: { id: 5, name: 'Northwind Logistics' },
  insuranceCompany: { id: 6, name: 'Harbor Mutual' },
};

describe('NewClaimModal', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    getPolicies.mockResolvedValue({ items: [policy] });
    getUsers.mockResolvedValue({ users: [] });
    getClaimTypes.mockResolvedValue({ items: [policy.claimType] });
    getInsuranceCompanies.mockResolvedValue({ items: [policy.insuranceCompany] });
    getClients.mockResolvedValue({ items: [policy.client] });
  });

  it('shows policy and assignment fields together without intake mode tabs', async () => {
    render(<NewClaimModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Policy & Parties' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assignment Information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Insured & Insurance' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /From Policy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Record Assignment/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Policy')).not.toBeRequired();
  });

  it('filters policies by policy number, client, or insurer', async () => {
    getPolicies.mockResolvedValue({ items: [policy, secondPolicy] });
    render(<NewClaimModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    const search = await screen.findByLabelText('Search policies');
    fireEvent.change(search, { target: { value: 'Harbor Mutual' } });

    const policySelect = screen.getByLabelText('Policy');
    expect(policySelect).toHaveTextContent('POL-2026-0008');
    expect(policySelect).not.toHaveTextContent('POL-2026-0007');
  });

  it('assigns one employee according to their role', async () => {
    getUsers.mockResolvedValue({
      users: [
        { id: 2, fullName: 'Field Engineer', role: 'ENGINEER' },
        { id: 3, fullName: 'Senior Accountant', role: 'ACCOUNTANT' },
      ],
    });
    createClaim.mockResolvedValue({ item: { id: 12 } });
    render(<NewClaimModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    const employee = await screen.findByLabelText('Assign Employee');
    expect(employee).toHaveTextContent('Field Engineer — Engineer');
    expect(employee).toHaveTextContent('Senior Accountant — Accountant');
    expect(screen.queryByLabelText('Engineer')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Accountant')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Policy'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Date of Loss/), { target: { value: '2026-08-24' } });
    fireEvent.change(employee, { target: { value: 'ENGINEER:2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Claim' }));

    await waitFor(() => expect(createClaim).toHaveBeenCalledOnce());
    expect(createClaim.mock.calls[0][0]).toEqual(
      expect.objectContaining({ engineerId: 2, accountantId: null })
    );
  });

  it('uses one Loss Reserved value for estimated loss and reserve', async () => {
    createClaim.mockResolvedValue({ item: { id: 12 } });
    render(<NewClaimModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    const lossReserved = await screen.findByLabelText('Loss Reserved');
    expect(screen.queryByLabelText('Estimated Loss')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Reserve')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Policy'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Date of Loss/), { target: { value: '2026-08-24' } });
    fireEvent.change(lossReserved, { target: { value: '250000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Claim' }));

    await waitFor(() => expect(createClaim).toHaveBeenCalledOnce());
    const payload = createClaim.mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ estimatedLoss: 250000, reserve: 250000 }));
    expect(payload).not.toHaveProperty('lossReserved');
  });

  it('fills linked party and policy details when an existing policy is selected', async () => {
    render(<NewClaimModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    const policySelect = await screen.findByLabelText('Policy');
    fireEvent.change(policySelect, { target: { value: '7' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Insured Name/)).toHaveValue('Acme Trading');
      expect(screen.getByLabelText('Client (linked)')).toHaveValue('2');
      expect(screen.getByLabelText('Insurer')).toHaveValue('3');
      expect(screen.getByLabelText('Claim Type')).toHaveValue('4');
      expect(screen.getByLabelText('Policy No.')).toHaveValue('POL-2026-0007');
      expect(screen.getByLabelText('Type of Policy')).toHaveValue('Fire');
    });
  });
});
