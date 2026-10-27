import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import Badge from '../../Components/common/Badge';
import SearchInput from '../../Components/common/SearchInput';
import EmptyState from '../../Components/common/EmptyState';
import { TableSkeleton } from '../../Components/common/Skeleton';
import accountService from '../../services/accountService';
import { formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const ActivityPage = () => {
  const { error } = useToast();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);

    try {
      const res = await accountService.getAllActivities();

      if (res.success && res.data) {
        setActivities(res.data.activities || []);
      }
    } catch (err) {
      error(err.message || 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    const searchTerm = search.toLowerCase();

    const matchesType = !typeFilter || act.type === typeFilter;

    const matchesSearch =
      !search ||
      (act.description &&
        act.description.toLowerCase().includes(searchTerm)) ||
      (act.billingAccountId?.name &&
        act.billingAccountId.name.toLowerCase().includes(searchTerm)) ||
      (act.billingAccountId?.accountNumber &&
        act.billingAccountId.accountNumber
          .toLowerCase()
          .includes(searchTerm));

    return matchesType && matchesSearch;
  });

  const getActivityBadge = (type) => {
    const badgeStyles = {
      login: 'bg-blue-50 text-blue-700 border-blue-200',
      bill_created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      bill_refunded: 'bg-rose-50 text-rose-700 border-rose-200',
      account_enabled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      account_disabled: 'bg-red-50 text-red-700 border-red-200',
      account_created: 'bg-orange-50 text-orange-700 border-orange-200',
      account_updated: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    const labels = {
      login: 'Operator Login',
      bill_created: 'Bill Created',
      bill_refunded: 'Refund Issued',
      account_enabled: 'Account Enabled',
      account_disabled: 'Account Disabled',
      account_created: 'Account Created',
      account_updated: 'Account Updated',
    };

    return (
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
          badgeStyles[type] || 'bg-slate-50 text-slate-600 border-slate-200'
        }`}
      >
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="min-h-full space-y-6 bg-[#FFFDF9]">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-orange-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Activity size={19} />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Store Management
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Activity Logs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor billing operations, account changes, and store activity.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-orange-100 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {activities.length} Total Events
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={15} className="text-orange-500" />

          <h2 className="text-sm font-semibold text-slate-800">
            Search & Filters
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search description, cashier, or account..."
            />
          </div>

          <div className="relative w-full sm:w-60 sm:shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition-colors hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">All Event Types</option>
              <option value="bill_created">Bill Created</option>
              <option value="bill_refunded">Refund Issued</option>
              <option value="login">Operator Login</option>
              <option value="account_created">Account Created</option>
              <option value="account_updated">Account Updated</option>
              <option value="account_enabled">Account Enabled</option>
              <option value="account_disabled">Account Disabled</option>
            </select>

            <Filter
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-500"
            />
          </div>
        </div>

        {(search || typeFilter) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {filteredActivities.length}
              </span>{' '}
              of {activities.length} events
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTypeFilter('');
              }}
              className="text-xs font-semibold text-orange-600 transition-colors hover:text-orange-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Recent Activity
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              A record of your store's operations
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Activity size={17} />
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {loading ? (
            <TableSkeleton rows={8} cols={4} />
          ) : filteredActivities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity logs found"
              message={
                search || typeFilter
                  ? 'No events matched your filters. Try changing your search criteria.'
                  : 'No store operations have been recorded yet.'
              }
            />
          ) : (
            <div className="relative ml-3 space-y-4 border-l-2 border-orange-100">
              {filteredActivities.map((act) => (
                <div key={act._id} className="relative pl-5 sm:pl-6">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[7px] top-5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-orange-500 bg-white ring-4 ring-orange-50" />

                  {/* Activity Card */}
                  <div className="group rounded-xl border border-slate-100 bg-[#FFFEFC] p-4 transition-colors hover:border-orange-200 hover:bg-orange-50/30">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {getActivityBadge(act.type)}

                          {act.billingAccountId && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />

                              {act.billingAccountId.name ||
                                act.billingAccountId.accountNumber}
                            </span>
                          )}
                        </div>

                        <p className="break-words text-sm font-medium leading-relaxed text-slate-800">
                          {act.description || act.type}
                        </p>

                        {act.ipAddress && (
                          <p className="text-xs text-slate-400">
                            IP Address:{' '}
                            <span className="font-medium text-slate-500">
                              {act.ipAddress}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400 sm:pt-1">
                        <Activity size={13} className="text-orange-400" />

                        <span>{formatDateTime(act.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && filteredActivities.length > 0 && (
          <div className="border-t border-slate-100 bg-[#FFFEFC] px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-500">
              Displaying{' '}
              <span className="font-semibold text-slate-700">
                {filteredActivities.length}
              </span>{' '}
              activity {filteredActivities.length === 1 ? 'event' : 'events'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage; 
