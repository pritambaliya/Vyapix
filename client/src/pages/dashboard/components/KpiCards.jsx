import React from 'react';
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  Wallet,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const TrendBadge = ({ changePct, suffix = 'vs prev' }) => {
  if (changePct === null || changePct === undefined) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        No prior data
      </span>
    );
  }

  const isPositive = changePct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isPositive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-rose-50 text-rose-700'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(changePct)}% {suffix}
    </span>
  );
};

const KpiCards = ({ kpis, rangeLabel }) => {
  const todaySales = kpis?.todaySales || { value: 0, changePct: null };
  const totalBills = kpis?.totalBills || { value: 0, changePct: null };
  const totalRevenue = kpis?.totalRevenue || { value: 0, changePct: null };
  const grossProfit = kpis?.grossProfit || { available: false, value: 0 };
  const totalActiveProducts = kpis?.totalActiveProducts || { value: 0 };
  const lowStockProducts = kpis?.lowStockProducts || { value: 0, outOfStock: 0 };

  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(todaySales.value),
      icon: IndianRupee,
      iconBg: 'bg-orange-50 text-orange-600',
      footer: <TrendBadge changePct={todaySales.changePct} suffix="vs yesterday" />,
    },
    {
      title: 'Total Bills / Orders',
      value: Number(totalBills.value || 0).toLocaleString('en-IN'),
      icon: Receipt,
      iconBg: 'bg-amber-50 text-amber-600',
      footer: <TrendBadge changePct={totalBills.changePct} />,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue.value),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600',
      footer: <TrendBadge changePct={totalRevenue.changePct} />,
    },
    {
      title: 'Est. Gross Profit',
      value: grossProfit.available
        ? formatCurrency(grossProfit.value)
        : 'Unavailable',
      icon: Wallet,
      iconBg: 'bg-orange-50 text-orange-600',
      footer: (
        <span className="text-[11px] text-slate-500" title={grossProfit.note}>
          {grossProfit.available
            ? `Based on current cost (${grossProfit.matchedItems || 0}/${grossProfit.totalItems || 0} items)`
            : 'Insufficient cost data'}
        </span>
      ),
    },
    {
      title: 'Total Active Products',
      value: Number(totalActiveProducts.value || 0).toLocaleString('en-IN'),
      icon: Package,
      iconBg: 'bg-slate-100 text-slate-700',
      footer: (
        <span className="text-[11px] text-slate-500">
          Active catalog SKUs ({rangeLabel || 'Store'})
        </span>
      ),
    },
    {
      title: 'Low Stock Items',
      value: Number(lowStockProducts.value || 0).toLocaleString('en-IN'),
      icon: AlertTriangle,
      iconBg:
        lowStockProducts.value > 0
          ? 'bg-rose-50 text-rose-600'
          : 'bg-emerald-50 text-emerald-600',
      footer: (
        <span
          className={`text-[11px] font-medium ${
            lowStockProducts.outOfStock > 0 ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {lowStockProducts.outOfStock > 0
            ? `${lowStockProducts.outOfStock} out of stock`
            : lowStockProducts.value > 0
              ? 'Needs restocking soon'
              : 'All stock levels healthy'}
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="flex flex-col justify-between rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {card.title}
              </span>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {card.value}
              </p>
              <div className="mt-2">{card.footer}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;
