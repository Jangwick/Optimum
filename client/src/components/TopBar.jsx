import { Search, Bell, HelpCircle, Settings } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-14 bg-surface border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="relative w-64">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          type="text"
          placeholder="Search claims, clients..."
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-primary hover:bg-surface-container-low rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-orange rounded-full" />
        </button>
        <button className="p-2 text-primary hover:bg-surface-container-low rounded-full">
          <HelpCircle size={20} />
        </button>
        <button className="p-2 text-primary hover:bg-surface-container-low rounded-full">
          <Settings size={20} />
        </button>
        <div className="h-8 w-px bg-surface-border mx-2" />
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-md font-semibold">
          AD
        </div>
      </div>
    </header>
  );
}
