import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Receipt,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

import ProductSelector from '../../Components/billing/ProductSelector';
import CartItem from '../../Components/billing/CartItem';
import CheckoutModal from '../../Components/billing/CheckoutModal';
import InvoiceReceiptModal from '../../Components/billing/InvoiceReceiptModal';
import Button from '../../Components/common/Button';
import ConfirmModal from '../../Components/common/ConfirmModal';

import { calculateCartTotals } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import billingService from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PosBillingPage = () => {
  const { isOwner, user } = useAuth();
  const { success, error, warning } = useToast();

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Receipt Modal
  const [createdBill, setCreatedBill] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Clear Cart Modal
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Calculate Cart Totals
  const totals = useMemo(
    () => calculateCartTotals(cart, discount),
    [cart, discount]
  );

  // Keyboard Shortcuts
  useKeyboardShortcut('F8', () => {
    if (cart.length > 0 && !isCheckoutOpen && !isReceiptOpen) {
      setIsCheckoutOpen(true);
    }
  });

  useKeyboardShortcut('Escape', () => {
    if (isCheckoutOpen) {
      setIsCheckoutOpen(false);
    } else if (isReceiptOpen) {
      setIsReceiptOpen(false);
    } else if (cart.length > 0) {
      setClearConfirmOpen(true);
    }
  });

  // Add Product to Cart
  const handleAddToCart = (product) => {
    const productId = product._id || product.id;
    const availableStock = Number(product.stock) || 0;

    if (availableStock <= 0) {
      warning(`${product.name} is currently out of stock`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => (item.productId || item._id) === productId
      );

      if (existingIndex > -1) {
        const existing = prev[existingIndex];

        if (existing.quantity >= availableStock) {
          warning(`Cannot add more than available stock (${availableStock})`);
          return prev;
        }

        const updated = [...prev];

        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
        };

        return updated;
      }

      return [
        ...prev,
        {
          productId,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unit: product.unit || 'pcs',
          sellingPrice: Number(product.sellingPrice),
          gstRate: Number(product.gstRate || 0),
          stock: availableStock,
          quantity: 1,
        },
      ];
    });
  };

  // Update Product Quantity
  const handleUpdateQuantity = (productId, newQuantity) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((item.productId || item._id) === productId) {
          return { ...item, quantity: newQuantity };
        }

        return item;
      })
    );
  };

  // Remove Product from Cart
  const handleRemoveFromCart = (productId) => {
    setCart((prev) =>
      prev.filter((item) => (item.productId || item._id) !== productId)
    );
  };

  // Clear Cart
  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    setClearConfirmOpen(false);
  };

  // Process Checkout
  const handleConfirmCheckout = async (checkoutPayload) => {
    if (cart.length === 0) {
      error('Cart is empty. Please add items before checking out.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId || item._id,
          quantity: Number(item.quantity),
        })),
        paymentMethod: checkoutPayload.paymentMethod,
        discount: Number(checkoutPayload.discount || 0),
        customerName: checkoutPayload.customerName,
        customerPhone: checkoutPayload.customerPhone,
        notes: checkoutPayload.notes,
      };

      const res = await billingService.createBill(payload);

      if (res.success && res.data?.bill) {
        success(`Invoice ${res.data.bill.invoiceNumber} generated!`);

        setCreatedBill(res.data.bill);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);

        setCart([]);
        setDiscount(0);
      }
    } catch (err) {
      error(
        err.message || 'Failed to generate bill. Please check item stock.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] min-h-[500px] flex-col gap-4">
      {/* Page Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-100">
              <ShoppingCart className="h-4 w-4 text-emerald-700" />
            </div>

            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                Point of Sale
              </h1>

              <p className="text-xs text-slate-600">
                Operator:{' '}
                <span className="font-semibold text-slate-800">
                  {user?.name || user?.employeeName || 'Cashier'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setClearConfirmOpen(true)}
            icon={RotateCcw}
            className="shrink-0 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
          >
            <span className="hidden sm:inline">Clear Cart (Esc)</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}
      </div>

      {/* POS Workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Product Selection */}
        <section className="flex min-h-[400px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-slate-200/70 p-3 lg:col-span-7 xl:col-span-8">
          <ProductSelector
            onAddToCart={handleAddToCart}
            cartItems={cart}
            isOwner={isOwner}
          />
        </section>

        {/* Current Sale */}
        <section className="flex min-h-[400px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm lg:col-span-5 xl:col-span-4">
          {/* Cart Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-slate-200/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-600" />

              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                Current Sale
              </h2>
            </div>

            <span className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
              {totals.totalItems} Items
            </span>
          </div>

          {/* Cart Items */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-300 bg-slate-200">
                  <ShoppingCart className="h-6 w-6 text-slate-500" />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  Cart is empty
                </p>

                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">
                  Select a product or scan a barcode to add items to the
                  current bill.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItem
                  key={item.productId || item._id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveFromCart}
                />
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="shrink-0 space-y-3 border-t border-slate-300 bg-slate-200/80 p-4">
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>Subtotal</span>

                <span className="font-semibold text-slate-900">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Estimated GST</span>

                <span className="font-semibold text-slate-900">
                  +{formatCurrency(totals.gstTotal)}
                </span>
              </div>

              {totals.discount > 0 && (
                <div className="flex items-center justify-between gap-3 text-emerald-700">
                  <span>Discount</span>

                  <span className="font-semibold">
                    -{formatCurrency(totals.discount)}
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total & Checkout */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-300 pt-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Grand Total
                </p>

                <p className="mt-0.5 truncate text-xl font-bold text-slate-950">
                  {formatCurrency(totals.grandTotal)}
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                disabled={cart.length === 0 || checkoutLoading}
                onClick={() => setIsCheckoutOpen(true)}
                icon={CheckCircle2}
              >
                Checkout (F8)
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totals={totals}
        discount={discount}
        setDiscount={setDiscount}
        onConfirmCheckout={handleConfirmCheckout}
        loading={checkoutLoading}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={createdBill}
        isOwner={isOwner}
        onNewSale={() => {
          setIsReceiptOpen(false);
          setCreatedBill(null);
        }}
      />

      {/* Clear Cart Confirmation */}
      <ConfirmModal
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleClearCart}
        title="Clear Current Cart"
        message="Are you sure you want to remove all items from the active sale?"
        confirmText="Clear Cart"
        variant="warning"
      />
    </div>
  );
};

export default PosBillingPage;
