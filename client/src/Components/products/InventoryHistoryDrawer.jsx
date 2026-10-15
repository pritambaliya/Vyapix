import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

import Badge from '../common/Badge';
import { TableSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import productService from '../../services/productService';
import { formatDateTime } from '../../utils/formatters';

export const InventoryHistoryDrawer = ({
  isOpen,
  onClose,
  productId,
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productName, setProductName] = useState('');

  useEffect(() => {
    if (!isOpen || !productId) return;

    let cancelled = false;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      setHistory([]);
      setProductName('');

      try {
        const res = await productService.getInventoryHistory(productId);

        if (cancelled) return;

        if (res?.success && res?.data) {
          const records = res.data.inventoryHistory || [];

          setHistory(records);

          const name = records[0]?.productId?.name;
          if (name) {
            setProductName(name);
          }
        } else {
          setError('Unable to load inventory history. Please try again.');
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err?.response?.data?.message ||
            'Failed to load inventory history. Please try again.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [isOpen, productId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeDetails = (type) => {
    switch (type) {
      case 'stock_added':
        return {
          label: 'Stock In',
          icon: ArrowDownLeft,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        };

      case 'stock_removed':
        return {
          label: 'Stock Out',
          icon: ArrowUpRight,
          color: 'text-rose-600 bg-rose-50 border-rose-100',
        };

      case 'sale':
        return {
          label: 'Sale',
          icon: ArrowUpRight,
          color: 'text-orange-600 bg-orange-50 border-orange-100',
        };

      case 'sale_return':
        return {
          label: 'Sale Return',
          icon: RotateCcw,
          color: 'text-blue-600 bg-blue-50 border-blue-100',
        };

      default:
        return {
          label: type
            ? type.replace(/_/g, ' ')
            : 'Other',
          icon: History,
          color: 'text-slate-600 bg-slate-100 border-slate-200',
        };
    }
  };

  const handleRetry = () => {
    // Changing the product ID or reopening the drawer triggers a fetch.
    // Retry is handled separately below through a retry counter.
    setRetryCount((count) => count + 1);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label="Close inventory history"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 flex w-full max-w-full sm:pl-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inventory-history-title"
          className="ml-auto flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <History className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h3
                  id="inventory-history-title"
                  className="text-sm font-bold text-slate-800"
                >
                  Stock Audit Trail
                </h3>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {productName || 'Inventory movement history'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-3 rounded-lg p-2 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Summary */}
          {!loading && !error && history.length > 0 && (
            <div className="border-b border-slate-100 bg-orange-50/50 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  Total stock movements
                </span>

                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                  {history.length} records
                </span>
              </div>
            </div>
          )}

          {/* Audit List */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4 sm:p-5">
            {loading ? (
              <TableSkeleton rows={6} cols={3} />
            ) : error ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-red-100 bg-white p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertCircle className="h-6 w-6" />
                </div>

                <h4 className="text-sm font-semibold text-slate-800">
                  Couldn't load history
                </h4>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {error}
                </p>
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={History}
                title="No stock movements"
                message="Inventory adjustments and stock changes will appear here."
              />
            ) : (
              history.map((record) => {
                const typeDetails = getTypeDetails(record.type);
                const TypeIcon = typeDetails.icon;
                const quantity = Number(record.quantityChange) || 0;

                return (
                  <div
                    key={record._id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
                  >
                    {/* Record Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${typeDetails.color}`}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                        <span>{typeDetails.label}</span>
                      </div>

                      <span className="pt-1 text-right text-[11px] leading-4 text-slate-400">
                        {formatDateTime(record.createdAt)}
                      </span>
                    </div>

                    {/* Quantity Change */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Quantity Change
                      </span>

                      <span
                        className={`text-base font-bold ${
                          quantity > 0
                            ? 'text-emerald-600'
                            : quantity < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                        }`}
                      >
                        {quantity > 0 ? '+' : ''}
                        {quantity}
                      </span>
                    </div>

                    {/* Resulting Stock */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-500">
                        Resulting Stock
                      </span>

                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-800">
                        {record.finalStock ?? '—'}
                      </span>
                    </div>

                    {/* Reason */}
                    {record.reason && (
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-slate-500">
                          Reason
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-700">
                          {record.reason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-white px-5 py-3">
            <p className="text-center text-[11px] text-slate-400">
              Inventory history · Vyapix
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistoryDrawer;
