import { Loader2 } from 'lucide-react';

export function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="text-body-md font-medium">Loading…</span>
      </div>
    </div>
  );
}
