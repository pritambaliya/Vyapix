import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const CartItem = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const itemTotal =
    item.sellingPrice * item.quantity +
    (item.sellingPrice * item.quantity * (item.gstRate / 100));

  const productId = item.productId || item._id;

  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(productId, item.quantity - 1);
    } else {
      onRemove(productId);
    }
  };

  const increaseQuantity = () => {
    if (item.stock != null && item.quantity >= item.stock) {
      return;
    }

    onUpdateQuantity(productId, item.quantity + 1);
  };

  const isMaxStockReached =
    item.stock != null && item.quantity >= item.stock;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-300 bg-slate-100 p-3 text-xs transition-colors hover:bg-slate-200/60">
      {/* Product Name & SKU */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
          {item.name}
        </h4>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
          <span>{formatCurrency(item.sellingPrice)}</span>

          <span className="text-slate-400">•</span>

          <span>{item.gstRate}% GST</span>

          {item.sku && (
            <>
              <span className="text-slate-400">•</span>
              <span className="max-w-[80px] truncate">
                SKU: {item.sku}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quantity Adjuster */}
      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-slate-200/80 p-1">
        <button
          type="button"
          onClick={decreaseQuantity}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-slate-700 shadow-sm transition-colors hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <span className="w-7 text-center text-xs font-bold text-slate-900">
          {item.quantity}
        </span>

        <button
          type="button"
          onClick={increaseQuantity}
          disabled={isMaxStockReached}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-slate-700 shadow-sm transition-colors hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Line Item Total & Remove */}
      <div className="min-w-[70px] shrink-0 text-right">
        <p className="text-xs font-bold text-slate-900 sm:text-sm">
          {formatCurrency(itemTotal)}
        </p>

        <button
          type="button"
          onClick={() => onRemove(productId)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
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
