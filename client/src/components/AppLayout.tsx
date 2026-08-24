import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-30 lg:hidden">
            <Sidebar />
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-2 p-1.5 text-white/70 hover:text-white rounded z-40"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col w-full lg:ml-[260px]">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
