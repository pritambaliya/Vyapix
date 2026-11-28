import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShoppingCart,
  Plus,
  Package,
  Boxes,
  FileText,
  Monitor,
  Users,
  Activity,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';

const ALERT_STYLES = {
  danger: {
    icon: AlertCircle,
    bg: 'border-rose-200 bg-rose-50/70 text-rose-800',
    iconColor: 'text-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'border-amber-200 bg-amber-50/70 text-amber-800',
    iconColor: 'text-amber-600',
  },
  success: {
    icon: CheckCircle2,
    bg: 'border-emerald-200 bg-emerald-50/70 text-emerald-800',
    iconColor: 'text-emerald-600',
  },
  info: {
    icon: Info,
    bg: 'border-orange-200 bg-orange-50/70 text-slate-700',
    iconColor: 'text-orange-600',
  },
};

const ActivityAndAlertsSection = ({ alerts = [], recentActivity }) => {
  const navigate = useNavigate();
  const [activityTab, setActivityTab] = useState('invoices');

  const invoices = recentActivity?.invoices || [];
  const inventoryTransactions = recentActivity?.inventoryTransactions || [];

  const quickActions = [
    { label: 'New Sale', icon: ShoppingCart, path: '/billing', primary: true },
    { label: 'Add Product', icon: Plus, path: '/product/create' },
    { label: 'View Products', icon: Package, path: '/products' },
    { label: 'Inventory', icon: Boxes, path: '/products?filter=lowStock' },
    { label: 'Sales Reports', icon: FileText, path: '/invoices' },
    { label: 'Manage Counters', icon: Monitor, path: '/accounts' },
    { label: 'Manage Cashiers', icon: Users, path: '/accounts' },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Left Column: Business Alerts & Quick Actions */}
      <div className="space-y-5">
        {/* Business Alerts */}
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Business Alerts & Insights
              </h2>
              <p className="text-xs text-slate-500">
                Live signals from store records
              </p>
            </div>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-2.5">
              {alerts.map((alert) => {
                const cfg = ALERT_STYLES[alert.severity] || ALERT_STYLES.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium ${cfg.bg}`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.iconColor}`} />
                    <span>{alert.message}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-xs text-slate-400">
              Everything looks steady across sales and stock.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-slate-900">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    action.primary
                      ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600'
                      : 'border-orange-100 bg-orange-50/40 text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Recent Business Activity */}
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Business Activity
              </h2>
              <p className="text-xs text-slate-500">
                Latest invoices and stock movements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl border border-orange-100 bg-orange-50/50 p-1">
              <button
                type="button"
                onClick={() => setActivityTab('invoices')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activityTab === 'invoices'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-orange-700'
                }`}
              >
                Invoices
              </button>
              <button
                type="button"
                onClick={() => setActivityTab('inventory')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  activityTab === 'inventory'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-orange-700'
                }`}
              >
                Stock Updates
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(activityTab === 'invoices' ? '/invoices' : '/activity')
              }
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              View All →
            </button>
          </div>
        </div>

        {activityTab === 'invoices' ? (
          invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="border-b border-orange-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 pr-3">Invoice</th>
                    <th className="py-2.5 px-3">Counter / Cashier</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 pl-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="cursor-pointer transition hover:bg-orange-50/50"
                    >
                      <td className="py-3 pr-3 font-bold text-slate-800">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {inv.counterName} • {inv.cashierName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {formatDateTime(inv.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            inv.status === 'refunded'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right font-bold text-slate-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No recent invoices yet.
            </div>
          )
        ) : inventoryTransactions.length > 0 ? (
          <div className="space-y-2.5">
            {inventoryTransactions.map((act) => (
              <div
                key={act.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">
                    {act.productName}
                    {act.variantName ? ` (${act.variantName})` : ''}
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    <span className="font-semibold capitalize text-orange-600">
                      {act.type.replace('_', ' ')}
                    </span>{' '}
                    • {act.previousStock} → {act.newStock} {act.unit} • by {act.actorName}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(act.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-400">
            No recent stock transactions recorded.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityAndAlertsSection;
