import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Monitor, Users, Award, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const CounterCashierSection = ({ counters, cashiers }) => {
  const navigate = useNavigate();

  const items = counters?.items || [];
  const totalCounterSales = counters?.totalCounterSales || 0;
  const highestCounter = counters?.highestCounter;
  const lowestCounter = counters?.lowestCounter;
  const cashierItems = cashiers || items;

  const handleCounterClick = (counter) => {
    navigate(
      counter.id === 'owner'
        ? '/invoices'
        : `/invoices?counter=${encodeURIComponent(counter.id)}`
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* Counter-wise Sales Analytics */}
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm xl:col-span-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Monitor className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Counter-wise Sales Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Total counter sales: {formatCurrency(totalCounterSales)} across {items.length} counter{items.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {highestCounter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <Award className="h-3.5 w-3.5" />
                Top: {highestCounter.counterName}
              </span>
            )}
            {lowestCounter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <ArrowDownCircle className="h-3.5 w-3.5" />
                Lowest: {lowestCounter.counterName}
              </span>
            )}
          </div>
        </div>

        {items.length > 0 ? (
          <div className="space-y-5">
            {/* Bar Chart */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={items}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#FED7AA" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="counterName"
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
                      borderRadius: '10px',
                      border: '1px solid #FED7AA',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [formatCurrency(val), 'Sales']}
                  />
                  <Bar
                    dataKey="totalSales"
                    fill="#F97316"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Counter Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-xs">
                <thead>
                  <tr className="border-b border-orange-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 pr-3">Counter</th>
                    <th className="py-2.5 px-3">Assigned Cashier</th>
                    <th className="py-2.5 px-3 text-right">Bills</th>
                    <th className="py-2.5 px-3 text-right">Avg Bill</th>
                    <th className="py-2.5 px-3 text-right">Share</th>
                    <th className="py-2.5 pl-3 text-right">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((counter) => {
                    const isTop = highestCounter?.id === counter.id;
                    const isLow = lowestCounter?.id === counter.id;

                    return (
                      <tr
                        key={counter.id}
                        onClick={() => handleCounterClick(counter)}
                        className="cursor-pointer transition hover:bg-orange-50/50"
                        title="View invoices for this counter"
                      >
                        <td className="py-3 pr-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{counter.counterName}</span>
                            {isTop && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Top
                              </span>
                            )}
                            {isLow && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                Low
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 text-slate-300" />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {counter.cashierName}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {counter.billCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {formatCurrency(counter.avgBillValue)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                            {counter.contributionPct}%
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right font-bold text-slate-900">
                          {formatCurrency(counter.totalSales)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
            No billing counters configured yet.
          </div>
        )}
      </div>

      {/* Cashier Performance Comparison */}
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cashier Performance
              </h2>
              <p className="text-xs text-slate-500">
                Sales & bill efficiency by operator
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/accounts')}
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            Manage
          </button>
        </div>

        {cashierItems.length > 0 ? (
          <div className="space-y-3.5">
            {cashierItems.map((cashier, idx) => (
              <div
                key={cashier.id}
                className="rounded-xl border border-slate-100 bg-orange-50/30 p-3.5 transition hover:border-orange-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-700">
                        {idx + 1}
                      </span>
                      <p className="truncate text-sm font-bold text-slate-900">
                        {cashier.cashierName}
                      </p>
                    </div>
                    <p className="mt-0.5 pl-8 text-xs text-slate-500">
                      {cashier.counterName} • {cashier.billCount} bills • Avg {formatCurrency(cashier.avgBillValue)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(cashier.totalSales)}
                    </p>
                    <p className="text-[11px] font-semibold text-orange-600">
                      {cashier.contributionPct}%
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${Math.min(100, cashier.contributionPct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
            No cashier activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterCashierSection;
