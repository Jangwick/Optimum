import { type ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string | undefined;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface SizeConfig {
  panel: string;
  padding: string;
  scroll: boolean;
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeConfig: SizeConfig = {
    sm: { panel: 'max-w-[95vw] sm:max-w-md', padding: 'p-6', scroll: true },
    md: { panel: 'max-w-[95vw] sm:max-w-lg', padding: 'p-6', scroll: true },
    lg: { panel: 'max-w-[95vw] sm:max-w-2xl', padding: 'p-6', scroll: true },
    xl: { panel: 'max-w-[95vw] sm:max-w-4xl', padding: 'p-6', scroll: true },
    full: { panel: 'max-w-[95vw] max-h-[92vh]', padding: 'p-0', scroll: false },
  }[size];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full ${sizeConfig.panel} bg-surface rounded-lg shadow-xl border border-surface-border ${sizeConfig.padding} ${
            sizeConfig.scroll ? 'max-h-[90vh] overflow-y-auto' : 'flex flex-col max-h-[92vh]'
          }`}
        >
          {title && (
            <div className="flex items-center justify-between mb-4 shrink-0">
              <DialogTitle className="text-headline-sm font-semibold text-primary">{title}</DialogTitle>
              <button onClick={onClose} className="p-1 text-outline hover:text-primary rounded">
                <X size={20} />
              </button>
            </div>
          )}
          {size === 'full' ? (
            <div className="flex-1 overflow-y-auto">{children}</div>
          ) : (
            children
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
