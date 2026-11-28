import React from 'react';
import {
  Calendar,
  RefreshCw,
  ShoppingCart,
  Plus,
  Store,
} from 'lucide-react';
import Button from '../../../Components/common/Button';

const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'custom', label: 'Custom Range' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const DashboardHeader = ({
  shopName,
  ownerName,
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  onApplyCustomRange,
  selectedRangeLabel,
  loading,
  onRefresh,
  onNewSale,
  onAddProduct,
}) => {
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting & Store */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <Store className="h-3.5 w-3.5" />
              {shopName || 'Your Store'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {todayLabel}
            </span>
            {selectedRangeLabel && (
              <span className="inline-flex items-center rounded-full border border-orange-200 bg-white px-2.5 py-0.5 text-xs font-medium text-orange-600">
                Showing: {selectedRangeLabel}
              </span>
            )}
          </div>

          <h1 className="mt-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {getGreeting()}
            {ownerName ? `, ${ownerName.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            Monitor store revenue, counter performance, cashiers, and inventory health in real time.
          </p>
        </div>

        {/* Right: Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50 sm:text-sm"
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
            Refresh
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onAddProduct}
            icon={Plus}
          >
            Add Product
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewSale}
            icon={ShoppingCart}
          >
            New Sale
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="mt-4 flex flex-col gap-3 border-t border-orange-50 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_RANGES.map((item) => {
            const active = range === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onRangeChange(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-orange-50/60 text-slate-600 hover:bg-orange-100/70 hover:text-orange-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-500"
              aria-label="Start date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-500"
              aria-label="End date"
            />
            <button
              type="button"
              onClick={onApplyCustomRange}
              disabled={!customStart || !customEnd || loading}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
