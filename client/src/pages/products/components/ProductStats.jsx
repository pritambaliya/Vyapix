import React from 'react';
import {
  Package,
  AlertTriangle,
  Boxes,
} from 'lucide-react';

import {
  getStockSummary,
} from '../../../utils/productHelpers';

const ProductStats = ({ products = [] }) => {
  const lowStockCount = products.reduce(
    (total, product) =>
      total + getStockSummary(product).lowStockCount,
    0
  );

  const outOfStockCount = products.reduce(
    (total, product) =>
      total + getStockSummary(product).outOfStockCount,
    0
  );

  const totalVariants = products.reduce(
    (total, product) => {
      if (product.sellingType === 'VARIANT') {
        return (
          total +
          (product.variants || []).filter(
            (variant) => variant.isActive !== false
          ).length
        );
      }

      return total;
    },
    0
  );

  const stats = [
    {
      title: 'Products on this page',
      value: products.length,
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Low stock items',
      value: lowStockCount,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Out of stock items',
      value: outOfStockCount,
      icon: Boxes,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-medium text-slate-500">
                  {stat.title}
                </p>

                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-lg p-2.5 ${stat.bg} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>

            </div>
          </div>
        );
      })}

      {totalVariants > 0 && (
        <div className="sm:col-span-3">
          <p className="text-xs text-slate-500">
            Active variants across these products: {totalVariants}
          </p>
        </div>
      )}

    </div>
  );
};

export default ProductStats;