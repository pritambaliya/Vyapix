import React, { useEffect, useState } from 'react';
import {
  X,
  Activity,
  Clock3,
  Globe,
  RefreshCw,
  AlertCircle,
  History,
} from 'lucide-react';

import Badge from '../common/Badge';
import { TableSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import accountService from '../../services/accountService';
import { formatDateTime } from '../../utils/formatters';

export const ActivityDrawer = ({ isOpen, onClose, accountId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !accountId) return;

    let isMounted = true;

    const fetchActivities = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await accountService.getAccountActivity(accountId);

        if (!isMounted) return;

        if (res?.success && res?.data) {
          setActivities(res.data.activities || []);
        } else {
          setActivities([]);
          setError('Unable to load activity records. Please try again.');
        }
      } catch {
        if (isMounted) {
          setActivities([]);
          setError('Something went wrong while loading activity records.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActivities();

    return () => {
      isMounted = false;
    };
  }, [isOpen, accountId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleRetry = async () => {
    if (!accountId) return;

    setLoading(true);
    setError('');

    try {
      const res = await accountService.getAccountActivity(accountId);

      if (res?.success && res?.data) {
        setActivities(res.data.activities || []);
      } else {
        setActivities([]);
        setError('Unable to load activity records. Please try again.');
      }
    } catch {
      setActivities([]);
      setError('Something went wrong while loading activity records.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-drawer-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label="Close activity panel"
        tabIndex={-1}
      />

      {/* Drawer container */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-full sm:pl-8">
        <aside className="ml-auto flex h-full w-full flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl sm:max-w-md lg:max-w-lg">
          {/* Header */}
          <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <Activity size={20} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="activity-drawer-title"
                    className="text-base font-bold tracking-tight text-slate-900 sm:text-lg"
                  >
                    Activity History
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                    Review billing account operations and activity logs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label="Close activity drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Activity summary */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/70">
                  <History size={16} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Recorded Activities
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Account operation history
                  </p>
                </div>
              </div>

              <span className="inline-flex min-w-8 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-sm font-bold text-orange-700">
                {loading ? '...' : activities.length}
              </span>
            </div>
          </div>

          {/* Activity list */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 p-4 sm:p-6">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <TableSkeleton rows={6} cols={2} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-5 py-12 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertCircle size={23} />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  Unable to load activities
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            ) : activities.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 sm:py-12">
                <EmptyState
                  icon={Activity}
                  title="No activity records"
                  message="This cashier account has no logged operations yet. New activity will appear here when available."
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Recent Activity
                  </h3>

                  <span className="text-xs text-slate-500">
                    {activities.length}{' '}
                    {activities.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {activities.map((act, index) => (
                  <article
                    key={act._id || `${act.type}-${act.createdAt}-${index}`}
                    className="group relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
                  >
                    {/* Activity timeline indicator */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-colors group-hover:bg-orange-100">
                        <Activity size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Badge variant="neutral" size="xs">
                            {act.type || 'Activity'}
                          </Badge>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock3 size={12} className="shrink-0" />
                            <span className="break-words">
                              {act.createdAt
                                ? formatDateTime(act.createdAt)
                                : 'Date unavailable'}
                            </span>
                          </div>
                        </div>

                        <p className="mt-2.5 break-words text-sm font-medium leading-relaxed text-slate-800">
                          {act.description || act.type || 'Account activity'}
                        </p>

                        {act.ipAddress && (
                          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                            <Globe
                              size={13}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="text-xs text-slate-500">
                              IP Address
                            </span>

                            <span className="ml-auto break-all text-right font-mono text-xs text-slate-600">
                              {act.ipAddress}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-slate-500">
                Activity records are provided by your billing system.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ActivityDrawer; 
