import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../services/notification.service.js';
import { toast } from 'sonner';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const [hasFetched, setHasFetched] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: getNotifications,
    enabled: hasFetched,
    staleTime: 10000,
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notifData?.items ?? [];

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const handleOpen = () => {
    if (!hasFetched) setHasFetched(true);
  };

  return (
    <Menu as="div" className="relative">
      {() => (
        <>
          <MenuButton
            onClick={handleOpen}
            className="p-2 text-primary hover:bg-surface-container-low rounded-full relative"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 bg-accent-orange rounded-full text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </MenuButton>

          <MenuItems className="absolute right-0 mt-2 w-80 bg-surface border border-surface-border rounded-lg shadow-lg z-50 origin-top-right focus:outline-none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <h3 className="text-body-md font-semibold text-on-surface">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="text-label-md text-primary hover:text-primary-container font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
                  <BellOff size={28} className="mb-2 text-outline" />
                  <p className="text-body-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <MenuItem key={n.id}>
                    {({ focus }) => (
                      <div
                        className={`px-4 py-3 border-b border-surface-border last:border-0 ${
                          focus ? 'bg-surface-container-low' : ''
                        } ${!n.isRead ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-accent-orange shrink-0 mt-1.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-medium text-on-surface truncate">
                              {n.title}
                            </p>
                            <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-label-md text-outline font-mono">
                                {timeAgo(n.createdAt)}
                              </span>
                              <div className="flex items-center gap-2">
                                {n.claimId && (
                                  <Link
                                    to={`/claims/${n.claimId}`}
                                    className="text-label-md text-primary hover:underline font-medium"
                                  >
                                    View claim
                                  </Link>
                                )}
                                {!n.isRead && (
                                  <button
                                    onClick={() => markReadMutation.mutate(n.id)}
                                    className="text-label-md text-on-surface-variant hover:text-primary font-medium"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </MenuItem>
                ))
              )}
            </div>
          </MenuItems>
        </>
      )}
    </Menu>
  );
}
