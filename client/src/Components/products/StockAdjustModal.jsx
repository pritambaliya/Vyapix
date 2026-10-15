import React, { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle, SlidersHorizontal, Package, ArrowRight, AlertCircle } from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

export const StockAdjustModal = ({
  isOpen,
  onClose,
  onAdjust,
  product = null,
  loading = false,
}) => {
  const [mode, setMode] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode('add');
      setQuantity('');
      setReason('');
      setErrorMsg('');
    }
  }, [isOpen, product?._id, product?.id]);

  if (!isOpen || !product) return null;

  const currentStock = Math.max(0, Number(product.stock) || 0);
  const numQuantity = Number(quantity);
  const validQuantity =
    quantity.trim() !== '' &&
    Number.isFinite(numQuantity) &&
    numQuantity > 0;

  const projectedStock = validQuantity
    ? mode === 'add'
      ? currentStock + numQuantity
      : currentStock - numQuantity
    : currentStock;

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validQuantity) {
      setErrorMsg('Please enter a valid quantity greater than 0.');
      return;
    }

    if (mode === 'remove' && numQuantity > currentStock) {
      setErrorMsg(
        `Insufficient stock. You currently have ${currentStock} ${
          product.unit || 'pcs'
        }.`
      );
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please provide a reason for this stock adjustment.');
      return;
    }

    setErrorMsg('');

    try {
      await onAdjust({
        productId: product._id || product.id,
        mode,
        quantity: numQuantity,
        reason: reason.trim(),
      });
    } catch (error) {
      setErrorMsg(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to adjust stock. Please try again.'
      );
    }
  };

  const isAdd = mode === 'add';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Stock"
      subtitle="Update your inventory quantity"
      maxWidth="max-w-md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            {isAdd ? 'Add Stock' : 'Deduct Stock'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product Information */}
        <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
            <Package className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {product.name}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Inventory adjustment
            </p>
          </div>

          <div className="rounded-lg border border-orange-100 bg-white px-2.5 py-1.5">
            <span className="text-xs font-semibold text-orange-700">
              {currentStock} {product.unit || 'pcs'}
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-700">
            Adjustment Type
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('add')}
              disabled={loading}
              aria-pressed={isAdd}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold transition-all duration-200 ${
                isAdd
                  ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              Add Stock
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('remove')}
              disabled={loading}
              aria-pressed={!isAdd}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold transition-all duration-200 ${
                !isAdd
                  ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MinusCircle className="h-4 w-4" />
              Remove Stock
            </button>
          </div>
        </div>

        {/* Quantity Input */}
        <Input
          label={`Quantity (${product.unit || 'pcs'})`}
          name="quantity"
          type="number"
          min="0.01"
          step="any"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setErrorMsg('');
          }}
          required
          autoFocus
          disabled={loading}
        />

        {/* Stock Preview */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-orange-500" />

            <h4 className="text-xs font-semibold text-slate-700">
              Stock Preview
            </h4>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-[11px] text-slate-500">Current</p>

              <p className="mt-1 text-lg font-bold text-slate-800">
                {currentStock}
              </p>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />

            <div
              className={`flex-1 rounded-lg p-3 text-center ${
                validQuantity && projectedStock >= 0
                  ? 'bg-orange-50'
                  : 'bg-slate-50'
              }`}
            >
              <p className="text-[11px] text-slate-500">After Adjustment</p>

              <p
                className={`mt-1 text-lg font-bold ${
                  validQuantity && projectedStock >= 0
                    ? 'text-orange-600'
                    : 'text-slate-800'
                }`}
              >
                {projectedStock < 0 ? '—' : projectedStock}
              </p>
            </div>
          </div>

          {validQuantity && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {isAdd ? 'Adding' : 'Removing'}{' '}
              <span className="font-semibold text-orange-600">
                {numQuantity} {product.unit || 'pcs'}
              </span>
              {isAdd ? ' to inventory' : ' from inventory'}
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor="stock-adjustment-reason"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Reason / Memo <span className="text-red-500">*</span>
          </label>

          <input
            id="stock-adjustment-reason"
            name="reason"
            type="text"
            placeholder={
              isAdd
                ? 'e.g. Supplier delivery, new stock'
                : 'e.g. Damaged goods, expired stock'
            }
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrorMsg('');
            }}
            maxLength={250}
            disabled={loading}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all hover:border-orange-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            required
          />

          <p className="mt-1 text-[11px] text-slate-400">
            Required for inventory audit records.
          </p>
        </div>

        {/* Validation Error */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

            <p className="text-xs font-medium leading-5 text-red-600">
              {errorMsg}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default StockAdjustModal;
