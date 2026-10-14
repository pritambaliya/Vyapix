import React, { useState } from 'react';
import {
  Banknote,
  QrCode,
  CreditCard,
  Layers,
  User,
  Phone,
  CheckCircle2,
} from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'upi', label: 'UPI / QR', icon: QrCode },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'mixed', label: 'Split / Mixed', icon: Layers },
];

export const CheckoutModal = ({
  isOpen,
  onClose,
  totals,
  discount,
  setDiscount,
  onConfirmCheckout,
  loading = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading) return;

    onConfirmCheckout({
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      discount: Number(discount || 0),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Sale & Invoice"
      subtitle={`${totals.totalItems} items in cart`}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Back to Cart
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={loading}
            icon={CheckCircle2}
          >
            Create Bill ({formatCurrency(totals.grandTotal)})
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Payment Mode
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-100/70 font-semibold text-emerald-800 shadow-sm'
                      : 'border-slate-300 bg-slate-100 text-slate-600 hover:border-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 gap-3 border-t border-slate-300 pt-4 sm:grid-cols-2">
          <Input
            label="Customer Name (Optional)"
            name="customerName"
            placeholder="Walk-in Customer"
            icon={User}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <Input
            label="Customer Mobile (Optional)"
            name="customerPhone"
            type="tel"
            placeholder="e.g. 9876543210"
            icon={Phone}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        {/* Discount & Notes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Bill Discount (₹)"
            name="discount"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            prefix="₹"
            value={discount || ''}
            onChange={(e) => {
              const value = e.target.value;
              setDiscount(value === '' ? 0 : Math.max(0, Number(value)));
            }}
          />

          <Input
            label="Notes / Reference (Optional)"
            name="notes"
            placeholder="e.g. GPay UPI Ref 9284"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Bill Summary */}
        <div className="space-y-2 rounded-lg border border-slate-300 bg-slate-200/60 p-4">
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Items Subtotal:</span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>

          <div className="flex justify-between gap-3 text-slate-600">
            <span>Total GST:</span>
            <span className="font-semibold text-slate-800">
              +{formatCurrency(totals.gstTotal)}
            </span>
          </div>

          {totals.discount > 0 && (
            <div className="flex justify-between gap-3 text-emerald-700">
              <span>Discount Applied:</span>
              <span className="font-semibold">
                -{formatCurrency(totals.discount)}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3 border-t border-slate-300 pt-3 text-sm font-bold text-slate-900">
            <span>Payable Grand Total:</span>
            <span className="text-base font-black text-emerald-700">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CheckoutModal;
