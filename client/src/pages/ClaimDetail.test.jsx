import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLAIM_DETAIL_TABS, DocumentPreview, InspectionSummary, WorkflowProgress } from './ClaimDetail.jsx';

vi.mock('../components/Modal.jsx', () => ({
  Modal: ({ open, title, children }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

afterEach(cleanup);

describe('WorkflowProgress', () => {
  it('renders workflow progress without errors', () => {
    render(<WorkflowProgress currentStatus="INVESTIGATION" isCancelled={false} />);
    expect(screen.getByText('Investigation')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('renders cancelled workflow progress', () => {
    render(<WorkflowProgress currentStatus="CANCELLED" isCancelled />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});

describe('ClaimDetail tabs', () => {
  it('does not include Timeline or Tasks', () => {
    const labels = CLAIM_DETAIL_TABS.map((tab) => tab.label);

    expect(labels).not.toContain('Timeline');
    expect(labels).not.toContain('Tasks');
  });
});

describe('DocumentPreview', () => {
  const documents = [
    { id: 11, originalName: 'policy.pdf', category: 'Policy', mimeType: 'application/pdf' },
    { id: 12, originalName: 'photos.pdf', category: 'Photos', mimeType: 'application/pdf' },
  ];

  it('opens saved documents in an iframe modal and switches the preview', () => {
    render(<DocumentPreview claimId="3" documents={documents} />);

    fireEvent.click(screen.getByRole('button', { name: '2 Documents' }));

    const dialog = screen.getByRole('dialog', { name: 'Document Preview' });
    expect(within(dialog).getByTitle('Document preview')).toHaveAttribute(
      'src',
      '/api/claims/3/documents/11/preview'
    );

    // Switch to the second document using the custom Select
    // The listbox is rendered in a portal at document.body, so use screen
    const trigger = within(dialog).getByLabelText('Preview document');
    fireEvent.click(trigger);
    const option = screen.getByRole('option', { name: /photos.pdf/ });
    fireEvent.click(option);
    expect(within(dialog).getByTitle('Document preview')).toHaveAttribute(
      'src',
      '/api/claims/3/documents/12/preview'
    );
  });

  it('renders .docx content inline via mammoth instead of auto-downloading', async () => {
    const docxDocs = [
      { id: 20, originalName: 'report.docx', category: 'Report', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    ];

    render(<DocumentPreview claimId="3" documents={docxDocs} />);

    fireEvent.click(screen.getByRole('button', { name: '1 Document' }));

    const dialog = screen.getByRole('dialog', { name: 'Document Preview' });
    // No iframe should be rendered for .docx files (prevents auto-download)
    expect(within(dialog).queryByTitle('Document preview')).not.toBeInTheDocument();
    // Download link should still be present
    expect(within(dialog).getByRole('link', { name: /download/i })).toHaveAttribute(
      'href',
      '/api/claims/3/documents/20/download'
    );
  });
});

describe('InspectionSummary', () => {
  const inspection = {
    id: 4,
    scheduledAt: '2026-09-01T02:00:00.000Z',
    conductedAt: null,
    location: 'Test Site Location',
    findings: null,
    notes: 'Coordinate with the site manager.',
    inspector: { firstName: 'Field', lastName: 'Engineer' },
    photos: [{ id: 11, originalName: 'site.jpg', caption: 'Front elevation' }],
  };

  it('shows saved inspection data as embedded Summary content and opens a read-only modal', () => {
    const { container } = render(<InspectionSummary claimId="3" inspections={[inspection]} />);

    expect(container.querySelector('section')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Latest Inspection' })).toBeInTheDocument();
    expect(screen.getByText('Test Site Location')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('1 Photo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View Inspection' }));

    const dialog = screen.getByRole('dialog', { name: 'Inspection Details' });
    expect(within(dialog).getByText('Coordinate with the site manager.')).toBeInTheDocument();
    expect(within(dialog).getByText('Field Engineer')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'site.jpg' })).toHaveAttribute(
      'src',
      '/api/claims/3/inspections/photos/11'
    );
  });

  it('renders nothing when no inspections are saved', () => {
    const { container } = render(<InspectionSummary claimId="3" inspections={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
