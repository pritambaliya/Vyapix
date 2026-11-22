import React from 'react';

import {
  Package,
  Sliders,
  History,
  Edit2,
  Trash2,
  Barcode,
  Layers,
} from 'lucide-react';

import Badge from '../../../Components/common/Badge';
import EmptyState from '../../../Components/common/EmptyState';

import {
  getProductName,
  getCategoryName,
  getMainProductName,
  getBrandName,
  getStockSummary,
  getProductPrice,
  getProductCostPrice,
  formatPriceRange,
  isProductLowStock,
  isProductOutOfStock,
} from '../../../utils/productHelpers';

import { formatCurrency } from '../../../utils/formatters';

const ProductTable = ({
  products,
  isOwner,
  onAdjustStock,
  onViewHistory,
  onEdit,
  onDelete,
  search,
  categoryId,
  lowStockOnly,
}) => {

  if (!products.length) {
    return (
      <div className="px-4 py-12">
        <EmptyState
          icon={Package}
          title="No products found"
          message={
            search || categoryId || lowStockOnly
              ? 'Try changing your search or filters to find products.'
              : 'Your product catalog is empty. Add your first product to get started.'
          }
          actionText={undefined}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">

      <table className="w-full min-w-[1100px] text-left text-sm">

        <thead>
          <tr className="border-b border-orange-100 bg-orange-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">

            <th className="px-4 py-3.5">Product</th>

            <th className="px-4 py-3.5">Category</th>

            <th className="px-4 py-3.5">Main Product</th>

            <th className="px-4 py-3.5">Brand</th>

            <th className="px-4 py-3.5">Type</th>

            {isOwner && (
              <th className="px-4 py-3.5">Cost Price</th>
            )}

            <th className="px-4 py-3.5">Selling Price</th>

            <th className="px-4 py-3.5">GST</th>

            <th className="px-4 py-3.5">Stock Status</th>

            <th className="px-4 py-3.5 text-right">Actions</th>

          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">

          {products.map((product) => {
            const productId = product._id || product.id;

            const productName = getProductName(product);

            const stockSummary = getStockSummary(product);

            const price = getProductPrice(product);

            const costPrice = getProductCostPrice(product);

            const isVariant = product.sellingType === 'VARIANT';

            const isOutOfStock = isProductOutOfStock(product);

            const isLowStock = isProductLowStock(product);

            return (
              <tr
                key={productId}
                className="group transition-colors hover:bg-orange-50/40"
              >

                {/* PRODUCT */}

                <td className="px-4 py-3.5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600 transition group-hover:bg-orange-100">
                      <Package className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">

                      <p className="max-w-[200px] truncate text-sm font-semibold text-slate-800">
                        {productName}
                      </p>

                      {isVariant ? (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                          <Layers className="h-3 w-3" />
                          {stockSummary.variantCount} variants
                        </div>
                      ) : (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">

                          {product.sku && (
                            <span>SKU: {product.sku}</span>
                          )}

                          {product.barcode && (
                            <span className="flex items-center gap-1">
                              <Barcode className="h-3 w-3" />
                              {product.barcode}
                            </span>
                          )}

                          {!product.sku && !product.barcode && (
                            <span>No identifiers</span>
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                </td>

                {/* CATEGORY */}

                <td className="px-4 py-3.5">
                  <span className="inline-flex whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                    {getCategoryName(product)}
                  </span>
                </td>

                {/* MAIN PRODUCT */}

                <td className="px-4 py-3.5 text-sm text-slate-600">
                  {getMainProductName(product)}
                </td>

                {/* BRAND */}

                <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                  {getBrandName(product)}
                </td>

                {/* SELLING TYPE */}

                <td className="px-4 py-3.5">
                  <Badge
                    variant={isVariant ? 'info' : 'default'}
                    size="xs"
                  >
                    {isVariant ? 'Variant' : 'Loose'}
                  </Badge>
                </td>

                {/* COST PRICE */}

                {isOwner && (
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-600">
                    {formatPriceRange(costPrice, formatCurrency)}
                  </td>
                )}

                {/* SELLING PRICE */}

                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="text-sm font-bold text-slate-900">
                    {formatPriceRange(price, formatCurrency)}
                  </span>
                </td>

                {/* GST */}

                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {product.gstRate ?? 0}%
                  </span>
                </td>

                {/* STOCK STATUS */}

                <td className="whitespace-nowrap px-4 py-3.5">

                  <div className="flex flex-col items-start gap-1.5">

                    <span className="text-sm font-bold text-slate-800">
                      {stockSummary.totalStock}
                      {' '}
                      {isVariant ? 'units' : (product.unit || 'pcs')}
                    </span>

                    {isOutOfStock ? (
                      <Badge variant="danger" size="xs">
                        Out of stock
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning" size="xs">
                        Low stock
                      </Badge>
                    ) : (
                      <Badge variant="success" size="xs">
                        In stock
                      </Badge>
                    )}

                    {isVariant && (
                      <span className="text-[10px] text-slate-400">
                        {stockSummary.outOfStockCount} variants out of stock
                      </span>
                    )}

                  </div>

                </td>

                {/* ACTIONS */}

                <td className="px-4 py-3.5">

                  <div className="flex items-center justify-end gap-1">

                    {isOwner ? (
                      <>

                        <button
                          type="button"
                          onClick={() => onAdjustStock(product)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100 hover:text-orange-600"
                          title="Adjust stock"
                          aria-label={`Adjust stock for ${productName}`}
                        >
                          <Sliders className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewHistory(product)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                          title="Inventory history"
                          aria-label={`View inventory history for ${productName}`}
                        >
                          <History className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Edit product"
                          aria-label={`Edit ${productName}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(product)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete product"
                          aria-label={`Delete ${productName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        View only
                      </span>
                    )}

                  </div>

                </td>

              </tr>
            );
          })}

        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;