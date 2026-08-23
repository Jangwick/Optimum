import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { HelpCircle, BookOpen, Keyboard, Mail, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Modal } from './Modal.jsx';

const SHORTCUTS = [
  { keys: 'Ctrl + K', label: 'Quick search (coming soon)' },
  { keys: 'Esc', label: 'Close dialogs / dropdowns' },
  { keys: 'Tab', label: 'Navigate form fields' },
  { keys: 'Enter', label: 'Submit form / activate button' },
];

export function HelpDropdown() {
  const [showGuide, setShowGuide] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton
          className="p-2 text-primary hover:bg-surface-container-low rounded-full"
          aria-label="Help"
        >
          <HelpCircle size={22} />
        </MenuButton>

        <MenuItems className="fixed right-2 sm:absolute sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-64 max-w-64 bg-surface border border-surface-border rounded-lg shadow-lg z-50 origin-top-right focus:outline-none">
          <div className="px-3 py-2 border-b border-surface-border">
            <p className="text-body-sm font-semibold text-on-surface">Help & Support</p>
          </div>

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={() => setShowGuide(true)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left ${
                  focus ? 'bg-surface-container-low' : ''
                }`}
              >
                <BookOpen size={18} className="text-primary shrink-0" />
                <div>
                  <p className="font-medium text-on-surface">User Guide</p>
                  <p className="text-label-md text-on-surface-variant">How to use the system</p>
                </div>
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={() => setShowShortcuts(true)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left ${
                  focus ? 'bg-surface-container-low' : ''
                }`}
              >
                <Keyboard size={18} className="text-primary shrink-0" />
                <div>
                  <p className="font-medium text-on-surface">Keyboard Shortcuts</p>
                  <p className="text-label-md text-on-surface-variant">Quick navigation tips</p>
                </div>
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <a
                href="mailto:support@optimumclaims.com"
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left ${
                  focus ? 'bg-surface-container-low' : ''
                }`}
              >
                <Mail size={18} className="text-primary shrink-0" />
                <div>
                  <p className="font-medium text-on-surface">Contact Support</p>
                  <p className="text-label-md text-on-surface-variant">support@optimumclaims.com</p>
                </div>
              </a>
            )}
          </MenuItem>

          <div className="border-t border-surface-border px-4 py-2.5">
            <a
              href="https://devin.ai/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-label-md text-on-surface-variant hover:text-primary"
            >
              <ExternalLink size={14} />
              Technical support
            </a>
          </div>
        </MenuItems>
      </Menu>

      <Modal open={showGuide} onClose={() => setShowGuide(false)} title="User Guide" size="lg">
        <div className="space-y-4 text-body-md text-on-surface">
          <section>
            <h4 className="font-semibold text-primary mb-1">Getting Started</h4>
            <p className="text-on-surface-variant">
              Log in with your assigned email and password. Your role (Admin, Engineer, or
              Accountant) determines which features you can access.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-primary mb-1">Claims Registry</h4>
            <p className="text-on-surface-variant">
              The Claims Registry at <span className="font-mono text-primary">/claims</span> is your
              main dashboard. Use the Active, Closed, and Cancelled tabs to filter claims by state.
              Search by OCS ref, insured, insurer, policy, broker, or location.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-primary mb-1">Claim Lifecycle</h4>
            <p className="text-on-surface-variant">
              Each claim follows an 18-stage workflow: New → Assigned → Investigation → Inspection →
              Documents → Assessment → Report → Client Review → Settlement → Fees → Closed. Status
              advances automatically as you complete workflow actions.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-primary mb-1">Claim Detail</h4>
            <p className="text-on-surface-variant">
              Click any claim&apos;s <span className="font-medium">View</span> button to open its detail
              page. The detail page has 11 tabs covering Summary, Process Status, Investigation,
              Documents, Assessment, Settlement, Finance, Reports, Insurer Panel, Timeline, and
              Tasks.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-primary mb-1">Cancelling a Claim</h4>
            <p className="text-on-surface-variant">
              In the Summary tab, use the Update Status dropdown to select{' '}
              <span className="font-medium">Cancelled</span>. Cancellation is available from any
              workflow stage and moves the claim to the Cancelled registry view.
            </p>
          </section>
          <section>
            <h4 className="font-semibold text-primary mb-1">Currency</h4>
            <p className="text-on-surface-variant">
              All monetary values are displayed in Philippine Peso (PHP, ₱).
            </p>
          </section>
          <p className="text-label-md text-outline pt-2 border-t border-surface-border">
            For the full step-by-step procedure, see the README.md file in the project root.
          </p>
        </div>
      </Modal>

      <Modal open={showShortcuts} onClose={() => setShowShortcuts(false)} title="Keyboard Shortcuts" size="sm">
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
              <span className="text-body-sm text-on-surface">{s.label}</span>
              <kbd className="px-2 py-1 rounded bg-surface-container-high text-label-md font-mono text-on-surface-variant border border-surface-border">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
