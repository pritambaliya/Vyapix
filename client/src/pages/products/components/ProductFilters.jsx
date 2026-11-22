import React from 'react';
import {
  Filter,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

import SearchInput from '../../../Components/common/SearchInput';

const ProductFilters = ({
  search,
  setSearch,
  categoryId,
  setCategoryId,
  categories,
  lowStockOnly,
  setLowStockOnly,
  onReset,
}) => {
  const hasFilters = search || categoryId || lowStockOnly;

  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">

      <div className="mb-3 flex items-center justify-between">

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-orange-500" />

          <h2 className="text-sm font-semibold text-slate-800">
            Search & Filters
          </h2>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 transition hover:text-orange-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        )}

      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

        <div className="min-w-0 flex-1">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search product, brand, SKU, or barcode..."
          />
        </div>

        <div className="w-full lg:w-56">
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">
              All Categories
            </option>

            {categories.map((item) => (
              <option
                key={item._id || item.id}
                value={item._id || item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-orange-100 bg-orange-50/60 px-3 text-sm font-medium text-slate-700 transition hover:bg-orange-50">

          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(event) =>
              setLowStockOnly(event.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 accent-orange-500 focus:ring-orange-400"
          />

          <AlertTriangle className="h-4 w-4 text-amber-500" />

          <span className="whitespace-nowrap">
            Low stock only
          </span>

        </label>

      </div>
    </div>
  );
};

export default ProductFilters;