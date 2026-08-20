import { Breadcrumbs } from './Breadcrumbs.jsx';
import { NotificationsDropdown } from './NotificationsDropdown.jsx';
import { HelpDropdown } from './HelpDropdown.jsx';
import { SettingsDropdown } from './SettingsDropdown.jsx';

export function TopBar() {
  return (
    <header className="h-16 bg-surface border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <NotificationsDropdown />
        <HelpDropdown />
        <div className="h-8 w-px bg-surface-border mx-2" />
        <SettingsDropdown />
      </div>
    </header>
  );
}
