import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Banknote,
  QrCode,
  CreditCard,
  Layers,
  X,
  Check,
  Monitor,
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
import accountService from '../../services/accountService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFullscreen } from '../../context/FullscreenContext';
import SEO from '../../Components/common/SEO';

const QUICK_PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'upi', label: 'UPI', icon: QrCode },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'mixed', label: 'Mixed', icon: Layers },
];

const getCartStorageKey = ({ user, shop, role }) => {
  const userId = user?._id || user?.id;
  if (!userId) return null;
  const shopId = shop?._id || shop?.id || user?.shopId || 'default';
  const actorScope = role === 'cashier' ? `counter_${userId}` : `owner_${userId}`;
  return `vyapix_pos_cart_v1__${shopId}__${actorScope}`;
};

const getCartKey = (item) =>
  item.variantId
    ? `${item.productId || item._id}__${item.variantId}`
    : String(item.productId || item._id);

const sanitizeSavedCart = (rawCart) => {
  if (!Array.isArray(rawCart)) return [];
  return rawCart.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item.productId || item._id) &&
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) > 0 &&
      Number.isFinite(Number(item.sellingPrice))
  );
};

export const PosBillingPage = () => {
  const { isOwner, user, shop, role } = useAuth();
  const { success, error, warning } = useToast();
  const { isFullscreen } = useFullscreen();

  const storageKey = useMemo(
    () => getCartStorageKey({ user, shop, role }),
    [user, shop, role]
  );

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  // Prevents initial empty render from overwriting saved cart before restoration runs
  const restoredKeyRef = useRef(null);
  const unavailableWarnedRef = useRef(false);

  // Mobile cart drawer
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Receipt Modal
  const [createdBill, setCreatedBill] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Clear Cart Modal
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Owner counter selection (empty string = Owner Desk)
  const [counters, setCounters] = useState([]);
  const [selectedCounterId, setSelectedCounterId] = useState(() => {
    const sId = shop?._id || shop?.id || 'default';
    try {
      return localStorage.getItem(`vyapix_pos_counter__${sId}`) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;
    const loadCounters = async () => {
      try {
        const res = await accountService.getBillingAccounts();
        if (!cancelled && res.success && Array.isArray(res.data?.accounts)) {
          const active = res.data.accounts.filter((a) => a.status === 'active');
          setCounters(active);
          if (
            selectedCounterId &&
            !active.some((a) => String(a._id) === String(selectedCounterId))
          ) {
            setSelectedCounterId('');
          }
        }
      } catch {
        // Non-fatal; owner can still bill from Owner Desk
      }
    };
    loadCounters();
    return () => {
      cancelled = true;
    };
  }, [isOwner, selectedCounterId]);

  const handleCounterSelect = (nextId) => {
    setSelectedCounterId(nextId);
    const sId = shop?._id || shop?.id || 'default';
    try {
      if (nextId) {
        localStorage.setItem(`vyapix_pos_counter__${sId}`, nextId);
      } else {
        localStorage.removeItem(`vyapix_pos_counter__${sId}`);
      }
    } catch {
      // Ignore storage errors
    }
  };

  // 1. Restore saved cart on mount / session key ready
  useEffect(() => {
    if (!storageKey) return;
    if (restoredKeyRef.current === storageKey) return;

    restoredKeyRef.current = storageKey;
    unavailableWarnedRef.current = false;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const validItems = sanitizeSavedCart(parsed?.cart);
      const savedDiscount = Number(parsed?.discount || 0);
      const savedPayment = ['cash', 'upi', 'card', 'mixed'].includes(
        parsed?.paymentMethod
      )
        ? parsed.paymentMethod
        : 'cash';

      if (validItems.length > 0) {
        setCart(validItems);
      }
      if (Number.isFinite(savedDiscount) && savedDiscount >= 0) {
        setDiscount(savedDiscount);
      }
      setPaymentMethod(savedPayment);
      setSaveStatus('saved');
    } catch {
      // Safely ignore corrupted saved data
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // 2. AutoSave cart, discount, and payment method on every change
  useEffect(() => {
    if (!storageKey || restoredKeyRef.current !== storageKey) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        if (cart.length === 0 && discount === 0) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              cart,
              discount,
              paymentMethod,
              updatedAt: Date.now(),
            })
          );
        }
      } catch {
        // Ignore storage quota errors cleanly
      }
      setSaveStatus('saved');
    }, 150);

    return () => clearTimeout(timer);
  }, [storageKey, cart, discount, paymentMethod]);

  // 3. Validate restored cart items against live catalog products & variants
  const handleProductsLoaded = useCallback(
    (liveProducts) => {
      if (!Array.isArray(liveProducts)) return;

      setCart((prevCart) => {
        if (prevCart.length === 0) return prevCart;

        let changed = false;
        let foundUnavailable = false;
        let stockClamped = false;

        const nextCart = prevCart.map((item) => {
          const pId = String(item.productId || item._id);
          const matchedProduct = liveProducts.find(
            (p) => String(p._id || p.id) === pId
          );

          if (!matchedProduct || matchedProduct.isActive === false) {
            foundUnavailable = true;
            if (!item.unavailable) changed = true;
            return { ...item, unavailable: true };
          }

          if (item.variantId) {
            const activeVariants = (matchedProduct.variants || []).filter(
              (v) => v.isActive !== false
            );
            const matchedVariant = activeVariants.find(
              (v) => String(v._id) === String(item.variantId)
            );

            if (!matchedVariant) {
              foundUnavailable = true;
              if (!item.unavailable) changed = true;
              return { ...item, unavailable: true };
            }

            const liveStock = Number(matchedVariant.stock ?? 0);
            const livePrice = Number(matchedVariant.sellingPrice);
            const liveGst = Number(
              matchedVariant.gstRate ?? matchedProduct.gstRate ?? 0
            );
            const nextQty =
              liveStock > 0 && item.quantity > liveStock
                ? liveStock
                : item.quantity;

            if (liveStock > 0 && item.quantity > liveStock) {
              stockClamped = true;
            }
            if (liveStock <= 0) {
              foundUnavailable = true;
            }

            if (
              item.unavailable ||
              item.stock !== liveStock ||
              item.sellingPrice !== livePrice ||
              item.gstRate !== liveGst ||
              item.quantity !== nextQty
            ) {
              changed = true;
            }

            return {
              ...item,
              unavailable: false,
              stock: liveStock,
              sellingPrice: livePrice,
              gstRate: liveGst,
              unit: matchedVariant.unit || item.unit || 'pcs',
              variantName: matchedVariant.variantName,
              quantity: nextQty,
            };
          }

          // LOOSE product
          const liveStock = Number(matchedProduct.stock ?? 0);
          const livePrice = Number(matchedProduct.sellingPrice);
          const liveGst = Number(matchedProduct.gstRate ?? 0);
          const nextQty =
            liveStock > 0 && item.quantity > liveStock
              ? liveStock
              : item.quantity;

          if (liveStock > 0 && item.quantity > liveStock) {
            stockClamped = true;
          }
          if (liveStock <= 0) {
            foundUnavailable = true;
          }

          if (
            item.unavailable ||
            item.stock !== liveStock ||
            item.sellingPrice !== livePrice ||
            item.gstRate !== liveGst ||
            item.quantity !== nextQty
          ) {
            changed = true;
          }

          return {
            ...item,
            unavailable: false,
            stock: liveStock,
            sellingPrice: livePrice,
            gstRate: liveGst,
            unit: matchedProduct.unit || item.unit || 'pcs',
            quantity: nextQty,
          };
        });

        if ((foundUnavailable || stockClamped) && !unavailableWarnedRef.current) {
          unavailableWarnedRef.current = true;
          warning(
            foundUnavailable
              ? 'Some saved cart items are out of stock or inactive. Please review your cart.'
              : 'Cart quantities were adjusted to match current available stock.'
          );
        }

        return changed ? nextCart : prevCart;
      });
    },
    [warning]
  );

  // Calculate Cart Totals
  const totals = useMemo(
    () => calculateCartTotals(cart, discount),
    [cart, discount]
  );

  const hasUnavailableItems = useMemo(
    () =>
      cart.some(
        (item) =>
          item.unavailable || (item.stock != null && Number(item.stock) <= 0)
      ),
    [cart]
  );

  // Keyboard Shortcuts
  const openCheckout = () => {
    if (
      cart.length > 0 &&
      !hasUnavailableItems &&
      !isCheckoutOpen &&
      !isReceiptOpen
    ) {
      setIsCheckoutOpen(true);
    }
  };

  useKeyboardShortcut('F4', openCheckout);
  useKeyboardShortcut('F8', openCheckout);

  useKeyboardShortcut('Escape', () => {
    if (isCheckoutOpen) {
      setIsCheckoutOpen(false);
    } else if (isReceiptOpen) {
      setIsReceiptOpen(false);
    } else if (clearConfirmOpen) {
      setClearConfirmOpen(false);
    } else if (mobileCartOpen) {
      setMobileCartOpen(false);
    }
  });

  // Add Product or Variant to Cart
  const handleAddToCart = (product) => {
    const productId = product._id || product.id;
    const variantId = product.variantId || null;
    const cartKey = getCartKey({ productId, variantId });
    const availableStock = Number(product.stock) || 0;

    if (availableStock <= 0) {
      warning(`${product.name} is currently out of stock`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => getCartKey(item) === cartKey
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
          unavailable: false,
          stock: availableStock,
          quantity: existing.quantity + 1,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cartKey,
          productId,
          variantId,
          variantName: product.variantName || null,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unit: product.unit || 'pcs',
          sellingPrice: Number(product.sellingPrice),
          gstRate: Number(product.gstRate || 0),
          stock: availableStock,
          quantity: 1,
          unavailable: false,
        },
      ];
    });
  };

  // Update Product Quantity
  const handleUpdateQuantity = (cartKey, newQuantity) => {
    const numericQty = Number(newQuantity);
    if (!Number.isFinite(numericQty) || numericQty <= 0) return;

    setCart((prev) =>
      prev.map((item) => {
        if (getCartKey(item) !== String(cartKey)) return item;
        const maxStock = item.stock != null ? Number(item.stock) : null;
        const safeQty =
          maxStock !== null && numericQty > maxStock ? maxStock : numericQty;
        return { ...item, quantity: safeQty };
      })
    );
  };

  // Remove Product from Cart
  const handleRemoveFromCart = (cartKey) => {
    setCart((prev) =>
      prev.filter((item) => getCartKey(item) !== String(cartKey))
    );
  };

  // Clear Cart (explicit confirmation only)
  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    setClearConfirmOpen(false);
    setMobileCartOpen(false);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  // Process Checkout (cart clears ONLY after backend confirms invoice creation)
  const handleConfirmCheckout = async (checkoutPayload) => {
    if (cart.length === 0 || checkoutLoading) {
      if (cart.length === 0) {
        error('Cart is empty. Please add items before checking out.');
      }
      return;
    }

    if (hasUnavailableItems) {
      error('Please remove unavailable or out-of-stock items before billing.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId || item._id,
          variantId: item.variantId || undefined,
          quantity: Number(item.quantity),
          name: item.name,
        })),
        paymentMethod: checkoutPayload.paymentMethod || paymentMethod,
        discount: Number(checkoutPayload.discount || 0),
        customerName: checkoutPayload.customerName,
        customerPhone: checkoutPayload.customerPhone,
        notes: checkoutPayload.notes,
        ...(isOwner && selectedCounterId
          ? { billingAccountId: selectedCounterId }
          : {}),
      };

      const res = await billingService.createBill(payload);

      if (res.success && res.data?.bill) {
        success(`Invoice ${res.data.bill.invoiceNumber} generated!`);

        setCreatedBill(res.data.bill);
        setIsCheckoutOpen(false);
        setMobileCartOpen(false);
        setIsReceiptOpen(true);

        setCart([]);
        setDiscount(0);
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
        setRefreshTrigger((n) => n + 1);
      }
    } catch (err) {
      error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to generate bill. Please check item stock.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cartPanelContent = (
    <>
      {/* Cart Header with AutoSave Status */}
      <div className="flex shrink-0 items-center justify-between border-b border-orange-100 bg-orange-50/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-orange-600" />
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-900">
            Billing Cart
          </h2>
          {cart.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-2.5 w-2.5" />
              {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
            {totals.totalItems} {totals.totalItems === 1 ? 'Item' : 'Items'}
          </span>
          {mobileCartOpen && (
            <button
              type="button"
              onClick={() => setMobileCartOpen(false)}
              className="rounded-lg p-1 text-slate-500 hover:bg-white lg:hidden"
              aria-label="Close cart drawer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">
              <ShoppingCart className="h-6 w-6 text-orange-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Cart is empty
            </p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
              Click any product or variant to add items to the current bill.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItem
              key={getCartKey(item)}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveFromCart}
              onStockWarning={warning}
            />
          ))
        )}
      </div>

      {/* Cart Summary & Payment Footer */}
      <div className="shrink-0 space-y-3 border-t border-orange-100 bg-orange-50/40 p-4">
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span>GST</span>
            <span className="font-semibold text-slate-900">
              +{formatCurrency(totals.gstTotal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span>Bill Discount (₹)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={discount || ''}
              placeholder="0"
              onChange={(e) => {
                const val = Number(e.target.value);
                setDiscount(Number.isFinite(val) && val >= 0 ? val : 0);
              }}
              aria-label="Bill discount"
              className="h-7 w-20 rounded-lg border border-orange-200 bg-white px-2 text-right text-xs font-semibold text-slate-900 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Quick Payment Method Selector */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {QUICK_PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon;
            const active = paymentMethod === pm.id;
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                    : 'border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{pm.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grand Total & Checkout CTA */}
        <div className="flex items-center justify-between gap-3 border-t border-orange-100 pt-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Grand Total
            </p>
            <p className="mt-0.5 truncate text-xl font-bold text-slate-900">
              {formatCurrency(totals.grandTotal)}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={
              cart.length === 0 || hasUnavailableItems || checkoutLoading
            }
            onClick={() => setIsCheckoutOpen(true)}
            icon={CheckCircle2}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`flex min-h-[540px] flex-col gap-3 overflow-x-hidden rounded-2xl bg-[#FFF7ED] p-3 pb-20 lg:p-4 lg:pb-4 ${
        isFullscreen ? 'lg:h-[calc(100dvh-1.5rem)]' : 'lg:h-[calc(100dvh-5.5rem)]'
      }`}
    >
      <SEO
        title="Point of Sale | Vyapix"
        description="Fast supermarket-style POS billing with one-click variant selection and persistent cart autosave."
        path="/billing"
        noIndex={true}
      />

      {/* Page Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white px-4 py-2.5 shadow-xs">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <ShoppingCart className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">
              Point of Sale
            </h1>
            <p className="text-[11px] text-slate-500">
              Operator:{' '}
              <span className="font-semibold text-slate-800">
                {user?.employeeName || user?.name || 'Cashier'}
              </span>
              <span className="hidden sm:inline"> • F2 Search • F4 Payment</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <label className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50/60 px-2.5 py-1 text-xs">
              <Monitor className="h-3.5 w-3.5 shrink-0 text-orange-600" />
              <span className="hidden font-semibold text-slate-600 sm:inline">
                Counter:
              </span>
              <select
                value={selectedCounterId}
                onChange={(e) => handleCounterSelect(e.target.value)}
                aria-label="Select billing counter"
                className="bg-transparent font-bold text-slate-900 outline-none"
              >
                <option value="">Owner Desk</option>
                {counters.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                    {acc.employeeName ? ` (${acc.employeeName})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setClearConfirmOpen(true)}
              icon={RotateCcw}
              className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              Clear Cart
            </Button>
          )}
        </div>
      </div>

      {/* POS Workspace (~68% Left / ~32% Right on Desktop) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,68%)_minmax(0,32%)]">
        {/* Left: Product Hierarchy & Inline One-Click Variants */}
        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white/80 p-3 shadow-xs">
          <ProductSelector
            onAddToCart={handleAddToCart}
            onProductsLoaded={handleProductsLoaded}
            cartItems={cart}
            isOwner={isOwner}
            refreshTrigger={refreshTrigger}
          />
        </section>

        {/* Right: Fixed Billing Cart (Desktop) */}
        <section className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm lg:flex">
          {cartPanelContent}
        </section>
      </div>

      {/* Mobile Sticky Bottom Cart Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-orange-200 bg-white px-4 py-3 shadow-lg lg:hidden">
        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {totals.totalItems} {totals.totalItems === 1 ? 'item' : 'items'}
          </p>
          <p className="text-base font-bold text-slate-900">
            {formatCurrency(totals.grandTotal)}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setMobileCartOpen(true)}
          icon={ShoppingCart}
        >
          View Cart
        </Button>
      </div>

      {/* Mobile Dedicated Cart Drawer */}
      {mobileCartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileCartOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {cartPanelContent}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totals={totals}
        discount={discount}
        setDiscount={setDiscount}
        initialPaymentMethod={paymentMethod}
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
