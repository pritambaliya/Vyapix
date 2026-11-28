import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const PAYMENT_COLORS = {
  cash: '#EA580C',
  upi: '#059669',
  card: '#F59E0B',
  mixed: '#475569',
};

const SalesAnalyticsSection = ({ salesAnalytics }) => {
  const [trendMode, setTrendMode] = useState('daily');

  const dailyTrend = salesAnalytics?.dailyTrend || [];
  const weeklyTrend = salesAnalytics?.weeklyTrend || [];
  const monthlyTrend = salesAnalytics?.monthlyTrend || [];
  const paymentBreakdown = salesAnalytics?.paymentBreakdown || [];
  const comparison = salesAnalytics?.periodComparison || {
    currentRevenue: 0,
    previousRevenue: 0,
    revenueChangePct: null,
  };

  const chartData =
    trendMode === 'weekly'
      ? weeklyTrend
      : trendMode === 'monthly'
        ? monthlyTrend
        : dailyTrend;

  const totalPayments = paymentBreakdown.reduce((sum, p) => sum + Number(p.value || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Sales Trend & Period Comparison */}
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sales & Revenue Trend
              </h2>
              <p className="text-xs text-slate-500">
                Current: {formatCurrency(comparison.currentRevenue)} vs Prev: {formatCurrency(comparison.previousRevenue)}
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl border border-orange-100 bg-orange-50/50 p-1">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTrendMode(tab.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  trendMode === tab.id
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-orange-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="vyapixSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FED7AA" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #FED7AA',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === 'previousSales' ? 'Previous Period' : 'Sales',
                  ]}
                />
                {trendMode === 'daily' && (
                  <Area
                    type="monotone"
                    dataKey="previousSales"
                    stroke="#CBD5E1"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  fill="url(#vyapixSalesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No sales trend data for this period.
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Breakdown Donut */}
      <div className="flex flex-col rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Payment Methods
            </h2>
            <p className="text-xs text-slate-500">
              Revenue split by payment mode
            </p>
          </div>
        </div>

        {paymentBreakdown.length > 0 ? (
          <>
            <div className="relative h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {paymentBreakdown.map((entry) => (
                      <Cell
                        key={entry.method}
                        fill={PAYMENT_COLORS[entry.method] || '#F97316'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #FED7AA',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-medium text-slate-400">Total</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(totalPayments)}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {paymentBreakdown.map((item) => (
                <div
                  key={item.method}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: PAYMENT_COLORS[item.method] || '#F97316',
                      }}
                    />
                    <span className="font-semibold text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.value)}
                    </span>
                    <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium text-orange-700">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center py-12 text-center text-sm text-slate-400">
            No completed payments recorded in this period.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalyticsSection;
