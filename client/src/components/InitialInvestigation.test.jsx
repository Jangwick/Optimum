import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InitialInvestigation from './InitialInvestigation.jsx';

vi.mock('../services/discussion-note.service.js', () => ({
  getDiscussionNotes: vi.fn(() => Promise.resolve({ items: [] })),
  createDiscussionNote: vi.fn((claimId, payload) =>
    Promise.resolve({ success: true, item: { id: 1, ...payload, createdBy: { firstName: 'Test', lastName: 'User' } } })
  ),
  deleteDiscussionNote: vi.fn(() => Promise.resolve({ success: true })),
  getAutoReserve: vi.fn(() =>
    Promise.resolve({
      success: true,
      suggestedReserve: '10000.00',
      basis: 'assessment',
      calculation: 'Assessment total ₱9090.91 × 1.10 = ₱10000.00',
    })
  ),
}));

vi.mock('../services/claim.service.js', () => ({
  updateClaim: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('../services/investigation.service.js', () => ({
  getInspections: vi.fn(() => Promise.resolve({ items: [] })),
  ensureInspection: vi.fn(() => Promise.resolve({ id: 1 })),
  uploadInspectionPhoto: vi.fn(() => Promise.resolve({ success: true })),
  deleteInspectionPhoto: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('../utils/currency.js', () => ({
  formatCurrency: (v) => `₱${Number(v || 0).toFixed(2)}`,
}));

afterEach(cleanup);

const defaultProps = {
  claimId: '1',
  claim: { estimatedLoss: '5000', reserve: '5000' },
  onClaimChange: vi.fn(),
};

describe('InitialInvestigation', () => {
  it('renders the 3-step stepper', () => {
    render(<InitialInvestigation {...defaultProps} />);

    expect(screen.getByText('Discussion Notes')).toBeInTheDocument();
    expect(screen.getByText('Loss Reserve')).toBeInTheDocument();
    expect(screen.getByText('Investigation Photos')).toBeInTheDocument();
  });

  it('starts on step 1 (Discussion Notes)', () => {
    render(<InitialInvestigation {...defaultProps} />);

    expect(screen.getByText('Add Discussion Note')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Discussion details...')).toBeInTheDocument();
  });

  it('creates a discussion note on submit', async () => {
    const { createDiscussionNote } = await import('../services/discussion-note.service.js');
    render(<InitialInvestigation {...defaultProps} />);

    const notesField = screen.getByPlaceholderText('Discussion details...');
    fireEvent.change(notesField, { target: { value: 'Test discussion' } });

    const form = notesField.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createDiscussionNote).toHaveBeenCalledWith('1', expect.objectContaining({
        notes: 'Test discussion',
      }));
    });
  });

  it('navigates to step 2 (Reserve) and auto-calculates', async () => {
    const { getAutoReserve } = await import('../services/discussion-note.service.js');
    render(<InitialInvestigation {...defaultProps} />);

    // Click step 2
    fireEvent.click(screen.getByText('Loss Reserve'));

    await waitFor(() => {
      expect(screen.getByText('Auto-Calculate Reserve')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Calculate'));

    await waitFor(() => {
      expect(getAutoReserve).toHaveBeenCalledWith('1');
    });
  });

  it('navigates to step 3 (Photos)', async () => {
    render(<InitialInvestigation {...defaultProps} />);

    fireEvent.click(screen.getByText('Investigation Photos'));

    await waitFor(() => {
      expect(screen.getByText('Click or drag photos here to upload')).toBeInTheDocument();
    });
  });
});
