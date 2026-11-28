import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const InventoryInsightsSection = ({ inventory }) => {
  const navigate = useNavigate();
  const [movementTab, setMovementTab] = useState('top');

  const totalActiveProducts = inventory?.totalActiveProducts || 0;
  const lowStockCount = inventory?.lowStockCount || 0;
  const outOfStockCount = inventory?.outOfStockCount || 0;
  const stockValuation = inventory?.stockValuation || { available: false, value: 0 };
  const lowStockItems = inventory?.lowStockItems || [];
  const topSelling = inventory?.topSellingProducts || [];
  const slowMoving = inventory?.slowMovingProducts || [];
  const recentlyAdded = inventory?.recentlyAddedProducts || [];

  const movementList =
    movementTab === 'slow'
      ? slowMoving
      : movementTab === 'recent'
        ? recentlyAdded
        : topSelling;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Low Stock & Inventory Summary */}
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Inventory Overview & Low Stock Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Stock valuation:{' '}
                <span className="font-semibold text-slate-800">
                  {stockValuation.available
                    ? formatCurrency(stockValuation.value)
                    : 'Unavailable'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/products?filter=lowStock')}
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            Manage Inventory →
          </button>
        </div>

        {/* Summary Strip */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-medium text-slate-500">Active Products</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {totalActiveProducts.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
            <p className="text-[11px] font-medium text-amber-700">Low Stock Items</p>
            <p className="mt-1 text-lg font-bold text-amber-700">
              {lowStockCount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
            <p className="text-[11px] font-medium text-rose-700">Out of Stock</p>
            <p className="mt-1 text-lg font-bold text-rose-700">
              {outOfStockCount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3">
            <p className="text-[11px] font-medium text-orange-700">Stock Value</p>
            <p className="mt-1 truncate text-lg font-bold text-slate-900">
              {stockValuation.available ? formatCurrency(stockValuation.value) : '—'}
            </p>
          </div>
        </div>

        {/* Low Stock Table */}
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="border-b border-orange-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-3">Product Name</th>
                  <th className="py-2.5 px-3">Variant</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3 text-right">Limit</th>
                  <th className="py-2.5 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.map((item, idx) => (
                  <tr
                    key={`${item.productId}-${item.variantName || idx}`}
                    onClick={() => navigate('/products')}
                    className="cursor-pointer transition hover:bg-orange-50/50"
                  >
                    <td className="py-2.5 pr-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {item.variantName || 'Loose'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {item.lowStockLimit} {item.unit}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.status === 'out_of_stock'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 py-8 text-center text-sm font-medium text-emerald-700">
            All active products and variants are well stocked.
          </div>
        )}
      </div>

      {/* Product Movement (Top Selling / Slow Moving / Recently Added) */}
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Product Insights
            </h2>
            <p className="text-xs text-slate-500">
              Performance & catalog additions
            </p>
          </div>
        </div>

        <div className="mb-4 flex rounded-xl border border-orange-100 bg-orange-50/50 p-1">
          {[
            { id: 'top', label: 'Top Selling' },
            { id: 'slow', label: 'Slow Moving' },
            { id: 'recent', label: 'New' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMovementTab(tab.id)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                movementTab === tab.id
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-orange-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {movementList.length > 0 ? (
          <div className="space-y-2.5">
            {movementList.map((prod) => (
              <button
                key={prod.productId}
                type="button"
                onClick={() => navigate('/products')}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    {movementTab === 'recent' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">
                      {prod.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {prod.category || 'Catalog'}
                      {movementTab !== 'recent'
                        ? ` • Stock: ${prod.currentStock} ${prod.unit}`
                        : ` • ${prod.sellingType}`}
                    </p>
                  </div>
                </div>

                {movementTab !== 'recent' ? (
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(prod.revenue)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {prod.unitsSold} sold
                    </p>
                  </div>
                ) : (
                  <span className="shrink-0 text-[11px] font-medium text-orange-600">
                    {new Date(prod.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-center text-sm text-slate-400">
            No matching product data for this period.
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryInsightsSection;
