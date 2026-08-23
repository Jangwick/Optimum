import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

/** Helper: select a value from the custom Select component by aria-label */
function selectOption(label, textMatch) {
  // Close any open dropdowns first by clicking outside
  fireEvent.mouseDown(document.body);
  const trigger = screen.getByLabelText(label);
  // Open the dropdown
  fireEvent.click(trigger);
  // Find the listbox that was just opened (last one in DOM)
  const listboxes = screen.queryAllByRole('listbox');
  const listbox = listboxes[listboxes.length - 1];
  if (!listbox) throw new Error(`No listbox found after clicking Select "${label}"`);
  const options = within(listbox).getAllByRole('option');
  const option = options.find((o) => o.textContent.includes(textMatch));
  if (!option) throw new Error(`Option matching "${textMatch}" not found in Select "${label}". Available: ${options.map((o) => o.textContent).join(', ')}`);
  fireEvent.click(option);
}

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
  });

  it('filters policies by policy number, client, or insurer', async () => {
    getPolicies.mockResolvedValue({ items: [policy, secondPolicy] });
    render(<NewClaimModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    const search = await screen.findByLabelText('Search policies');
    fireEvent.change(search, { target: { value: 'Harbor Mutual' } });

    const policySelect = screen.getByLabelText('Policy');
    fireEvent.click(policySelect);
    expect(screen.getByRole('option', { name: /POL-2026-0008/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /POL-2026-0007/ })).not.toBeInTheDocument();
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
    fireEvent.click(employee);
    expect(screen.getByRole('option', { name: /Field Engineer — Engineer/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Senior Accountant — Accountant/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Engineer')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Accountant')).not.toBeInTheDocument();

    // Select policy
    selectOption('Policy', 'POL-2026-0007');
    // Select employee
    selectOption('Assign Employee', 'Field Engineer');
    // Date of loss
    fireEvent.change(screen.getByLabelText(/Date of Loss/), { target: { value: '2026-08-24' } });
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

    selectOption('Policy', 'POL-2026-0007');
    fireEvent.change(screen.getByLabelText(/Date of Loss/), { target: { value: '2026-08-24' } });
    fireEvent.change(lossReserved, { target: { value: '250000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Claim' }));

    await waitFor(() => expect(createClaim).toHaveBeenCalledOnce());
    const payload = createClaim.mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ estimatedLoss: 250000, reserve: 250000 }));
    expect(payload).not.toHaveProperty('lossReserved');
  });

  it('fills linked party and policy details when an existing policy is selected', async () => {
    const { container } = render(<NewClaimModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    // Wait for the Select to appear, then select the policy
    const policyTrigger = await screen.findByLabelText('Policy');
    // Open the dropdown
    fireEvent.click(policyTrigger);
    // Find the option and click it
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    const policyOption = options.find((o) => o.textContent.includes('POL-2026-0007'));
    expect(policyOption).toBeTruthy();
    fireEvent.click(policyOption);

    // Check that the policy selection triggered the form update
    await waitFor(() => {
      const inputs = container.querySelectorAll('input');
      const insuredInput = Array.from(inputs).find((i) => i.id === 'new-claim-insured-name');
      expect(insuredInput).toBeTruthy();
      expect(insuredInput.value).toBe('Acme Trading');
    });
    expect(screen.getByLabelText('Client (linked)')).toHaveTextContent('Acme Trading');
    expect(screen.getByLabelText('Insurer')).toHaveTextContent('Optimum Insurance');
    expect(screen.getByLabelText('Claim Type')).toHaveTextContent('Property');
    expect(screen.getByLabelText('Policy No.')).toHaveValue('POL-2026-0007');
    expect(screen.getByLabelText('Type of Policy')).toHaveValue('Fire');
  }, 20000);
});
