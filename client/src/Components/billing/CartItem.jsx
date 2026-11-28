import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const CartItem = ({
  item,
  onUpdateQuantity,
  onRemove,
  onStockWarning,
}) => {
  const [draftQty, setDraftQty] = useState(String(item.quantity));

  useEffect(() => {
    setDraftQty(String(item.quantity));
  }, [item.quantity]);

  const itemTotal =
    item.sellingPrice * item.quantity +
    item.sellingPrice * item.quantity * ((item.gstRate || 0) / 100);

  const itemKey =
    item.cartKey ||
    (item.variantId
      ? `${item.productId || item._id}__${item.variantId}`
      : item.productId || item._id);

  const availableStock = item.stock != null ? Number(item.stock) : null;
  const isUnavailable = Boolean(item.unavailable);
  const isOutOfStock = availableStock !== null && availableStock <= 0;
  const isMaxStockReached =
    availableStock !== null && item.quantity >= availableStock;

  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(itemKey, item.quantity - 1);
    } else {
      onRemove(itemKey);
    }
  };

  const increaseQuantity = () => {
    if (isUnavailable || isOutOfStock) return;
    if (availableStock !== null && item.quantity >= availableStock) {
      onStockWarning?.(
        `Cannot exceed available stock (${availableStock} ${item.unit || 'pcs'})`
      );
      return;
    }

    onUpdateQuantity(itemKey, item.quantity + 1);
  };

  const commitManualQuantity = (rawVal) => {
    if (isUnavailable || isOutOfStock) {
      setDraftQty(String(item.quantity));
      return;
    }

    const parsed = Number(rawVal);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraftQty(String(item.quantity));
      return;
    }

    const clamped =
      availableStock !== null && parsed > availableStock
        ? availableStock
        : parsed;

    if (availableStock !== null && parsed > availableStock) {
      onStockWarning?.(
        `Only ${availableStock} ${item.unit || 'pcs'} available for ${item.name}`
      );
    }

    const normalized = Number(clamped.toFixed(3));
    setDraftQty(String(normalized));
    if (normalized !== item.quantity) {
      onUpdateQuantity(itemKey, normalized);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-2.5 rounded-xl border p-2.5 text-xs shadow-xs transition ${
        isUnavailable || isOutOfStock
          ? 'border-rose-200 bg-rose-50/60'
          : 'border-orange-100 bg-white hover:border-orange-200'
      }`}
    >
      {/* Product Name & Price */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
            {item.name}
          </h4>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="font-medium text-slate-700">
            {formatCurrency(item.sellingPrice)}/{item.unit || 'pcs'}
          </span>
          <span className="text-slate-300">•</span>
          <span>+{item.gstRate || 0}% GST</span>
          {availableStock !== null && !isUnavailable && (
            <>
              <span className="text-slate-300">•</span>
              <span
                className={
                  isOutOfStock
                    ? 'font-semibold text-rose-600'
                    : isMaxStockReached
                      ? 'font-semibold text-amber-600'
                      : 'text-slate-500'
                }
              >
                {isOutOfStock ? 'Out of stock' : `Stock: ${availableStock}`}
              </span>
            </>
          )}
        </div>

        {(isUnavailable || isOutOfStock) && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {isUnavailable
              ? 'Item is no longer active — remove to continue'
              : 'Out of stock — remove or restock'}
          </p>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-orange-100 bg-orange-50/60 p-0.5">
        <button
          type="button"
          onClick={decreaseQuantity}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-700 shadow-xs transition hover:bg-orange-100 hover:text-orange-700"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <input
          type="number"
          min="0.001"
          step="any"
          disabled={isUnavailable || isOutOfStock}
          value={draftQty}
          onChange={(e) => setDraftQty(e.target.value)}
          onBlur={(e) => commitManualQuantity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitManualQuantity(draftQty);
              e.currentTarget.blur();
            }
          }}
          aria-label={`Quantity for ${item.name}`}
          className="h-7 w-11 rounded-md bg-white text-center text-xs font-bold text-slate-900 outline-none ring-1 ring-transparent focus:ring-orange-400 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={increaseQuantity}
          disabled={isUnavailable || isOutOfStock || isMaxStockReached}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-700 shadow-xs transition hover:bg-orange-100 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Line Total & Remove */}
      <div className="min-w-[68px] shrink-0 text-right">
        <p className="text-xs font-bold text-slate-900 sm:text-sm">
          {formatCurrency(itemTotal)}
        </p>

        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-rose-600"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;
