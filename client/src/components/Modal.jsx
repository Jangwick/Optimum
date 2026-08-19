import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className={`w-full ${sizeClass} bg-surface rounded-lg shadow-xl border border-surface-border p-6`}>
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-headline-sm font-semibold text-primary">{title}</DialogTitle>
            <button onClick={onClose} className="p-1 text-outline hover:text-primary rounded">
              <X size={20} />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
