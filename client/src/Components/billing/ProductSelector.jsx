import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Package,
  Check,
  ScanBarcode,
  X,
  Plus,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';

import { TableSkeleton } from '../common/Skeleton';
import BarcodeScanner from '../products/BarcodeScanner';
import productService from '../../services/productService';
import billingService from '../../services/billingService';
import { formatCurrency } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import {
  getId,
  getProductName,
  getCategoryName,
  getMainProductName,
} from '../../utils/productHelpers';

export const ProductSelector = ({
  onAddToCart,
  onProductsLoaded,
  cartItems = [],
  isOwner = false,
  refreshTrigger = 0,
}) => {
  const { warning } = useToast();

  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'frequent' | 'recent'
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedMainProductId, setSelectedMainProductId] = useState('');

  const [products, setProducts] = useState([]);
  const [frequentIds, setFrequentIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);

  const searchInputRef = useRef(null);
  const debouncedSearch = useDebounce(search, 250);

  // F2 focuses product search
  useKeyboardShortcut('F2', () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  });

  // Fetch active products (re-fetches on search or after bill completion)
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          search: debouncedSearch.trim() || undefined,
        };

        const res = isOwner
          ? await productService.getOwnerProducts(params)
          : await productService.getBillingProducts(params);

        if (cancelled) return;
        const prods = res.products || res.data?.products || [];
        setProducts(prods);

        // Notify PosBillingPage with full active catalog for restored cart validation
        if (!debouncedSearch.trim()) {
          onProductsLoaded?.(prods);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, isOwner, refreshTrigger, onProductsLoaded]);

  // Fetch recent completed bills to derive real Frequently Sold products
  useEffect(() => {
    let cancelled = false;

    const fetchFrequent = async () => {
      try {
        const res = isOwner
          ? await billingService.getOwnerBills({ limit: 40 })
          : await billingService.getBillingBills({ limit: 40 });
        if (cancelled) return;

        const bills = res.data?.bills || res.bills || [];
        const counts = new Map();
        for (const bill of bills) {
          if (bill.status === 'refunded') continue;
          for (const item of bill.items || []) {
            const pId = String(item.productId || '');
            if (!pId) continue;
            counts.set(pId, (counts.get(pId) || 0) + Number(item.quantity || 1));
          }
        }

        const ranked = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id);
        setFrequentIds(ranked);
      } catch {
        // Non-blocking
      }
    };

    fetchFrequent();
    return () => {
      cancelled = true;
    };
  }, [isOwner, refreshTrigger]);

  // Build unique Categories from loaded active products (using real DB IDs)
  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const catId = String(getId(p?.categoryId) || '');
      const catName = getCategoryName(p);
      if (!catId || !catName || catName === '—') continue;
      if (!map.has(catId)) {
        map.set(catId, { id: catId, name: catName });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Build unique Main Products for the selected Category
  const mainProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    const map = new Map();
    for (const p of products) {
      if (String(getId(p?.categoryId)) !== selectedCategoryId) continue;
      const mainId = String(getId(p?.mainProductId) || '');
      const mainName = getMainProductName(p);
      if (!mainId || !mainName || mainName === '—') continue;
      if (!map.has(mainId)) {
        map.set(mainId, { id: mainId, name: mainName });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategoryId]);

  // Filter & sort products for display
  const displayedProducts = useMemo(() => {
    let list = products;

    if (selectedCategoryId) {
      list = list.filter(
        (p) => String(getId(p?.categoryId)) === selectedCategoryId
      );
    }

    if (selectedMainProductId) {
      list = list.filter(
        (p) => String(getId(p?.mainProductId)) === selectedMainProductId
      );
    }

    if (quickFilter === 'frequent') {
      const rankMap = new Map(frequentIds.map((id, idx) => [id, idx]));
      list = list
        .filter((p) => rankMap.has(String(p._id || p.id)))
        .sort(
          (a, b) =>
            rankMap.get(String(a._id || a.id)) -
            rankMap.get(String(b._id || b.id))
        );
    } else if (quickFilter === 'recent') {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    return list;
  }, [products, selectedCategoryId, selectedMainProductId, quickFilter, frequentIds]);

  // Barcode lookup (used both by Enter key and Camera Scanner modal)
  const handleBarcodeLookup = async (rawCode) => {
    const barcodeVal = String(rawCode || '').trim();
    if (!barcodeVal) return;

    try {
      const res = await productService.getProductByBarcode(barcodeVal);

      if (res.success && (res.product || res.data?.product)) {
        const prod = res.product || res.data.product;
        const matchedVariant = res.matchedVariant || res.data?.matchedVariant;

        if (matchedVariant && prod.sellingType === 'VARIANT') {
          if (matchedVariant.isActive === false) {
            warning(`Variant "${matchedVariant.variantName}" is inactive.`);
            return;
          }
          const productName = `${getProductName(prod)} – ${matchedVariant.variantName}`;
          onAddToCart({
            ...matchedVariant,
            _id: prod._id,
            productId: prod._id,
            variantId: matchedVariant._id,
            variantName: matchedVariant.variantName,
            name: productName,
            category: getCategoryName(prod),
            unit: matchedVariant.unit || 'pcs',
            sellingPrice: Number(matchedVariant.sellingPrice),
            gstRate: Number(matchedVariant.gstRate ?? prod.gstRate ?? 0),
            stock: Number(matchedVariant.stock ?? 0),
          });
        } else {
          onAddToCart({
            ...prod,
            productId: prod._id,
            name: getProductName(prod),
            category: getCategoryName(prod),
          });
        }
        setSearch('');
      } else {
        warning(`No product found for barcode: ${barcodeVal}`);
      }
    } catch {
      warning(`No product found for barcode: ${barcodeVal}`);
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    handleBarcodeLookup(search);
  };

  const handleSelectCategory = (catId) => {
    const next = catId === selectedCategoryId ? '' : catId;
    setSelectedCategoryId(next);
    setSelectedMainProductId('');
  };

  const handleAddVariantDirect = (prod, variant) => {
    const vStock = Number(variant.stock) || 0;
    if (variant.isActive === false || vStock <= 0) return;

    const prodId = prod._id || prod.id;
    const baseName = getProductName(prod);

    onAddToCart({
      ...variant,
      _id: prodId,
      productId: prodId,
      variantId: variant._id,
      variantName: variant.variantName,
      name: `${baseName} – ${variant.variantName}`,
      category: getCategoryName(prod),
      unit: variant.unit || 'pcs',
      sellingPrice: Number(variant.sellingPrice),
      gstRate: Number(variant.gstRate ?? prod.gstRate ?? 0),
      stock: vStock,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-3">
      {/* Top Search & Barcode Scanner Bar */}
      <form
        onSubmit={handleBarcodeSubmit}
        className="flex shrink-0 flex-wrap items-center gap-2"
      >
        <div className="relative min-w-[200px] flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-orange-500">
            <Search className="h-4 w-4" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, brand, SKU or scan barcode (F2)..."
            aria-label="Search products or scan barcode"
            className="h-11 w-full rounded-xl border border-orange-200 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-orange-200 bg-white px-3.5 text-xs font-semibold text-orange-700 shadow-xs transition hover:border-orange-400 hover:bg-orange-50 sm:text-sm"
        >
          <ScanBarcode className="h-4 w-4 text-orange-600" />
          <span className="hidden sm:inline">Scan Barcode</span>
        </button>
      </form>

      {/* Quick Mode + Category Navigation */}
      <div className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Items', icon: Layers },
            { id: 'frequent', label: 'Frequently Sold', icon: Flame },
            { id: 'recent', label: 'Recently Added', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = quickFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'border border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Level 1: Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('');
                setSelectedMainProductId('');
              }}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategoryId === ''
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-orange-100 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              All Categories
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategoryId === cat.id
                    ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                    : 'border-orange-100 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Level 2: Main Product Pills */}
        {selectedCategoryId && mainProducts.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-orange-100 bg-orange-50/70 p-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedMainProductId('');
              }}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedMainProductId === ''
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-orange-700'
              }`}
            >
              All in Category
            </button>

            {mainProducts.map((mp) => (
              <button
                key={mp.id}
                type="button"
                onClick={() => {
                  setSelectedMainProductId(
                    mp.id === selectedMainProductId ? '' : mp.id
                  );
                }}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  selectedMainProductId === mp.id
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-orange-700'
                }`}
              >
                {mp.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Level 3: Compact Supermarket Brand Product Cards (with Inline Sub-Variants) */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : displayedProducts.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white/70 p-6 text-center">
            <Package className="mb-3 h-10 w-10 text-orange-300" />
            <p className="text-sm font-semibold text-slate-700">
              No matching products found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {quickFilter === 'frequent'
                ? 'No sales recorded yet to rank frequently sold items.'
                : 'Try another search term, category, or clear filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {displayedProducts.map((prod) => {
              const productId = prod._id || prod.id;
              const productName = getProductName(prod);
              const mainName = getMainProductName(prod);
              const imageUrl =
                prod.brandProductId?.image || prod.mainProductId?.image || '';

              const activeVariants = (prod.variants || []).filter(
                (v) => v.isActive !== false
              );
              const isVariantProduct =
                prod.sellingType === 'VARIANT' && activeVariants.length > 0;

              const totalStock = isVariantProduct
                ? activeVariants.reduce(
                    (sum, v) => sum + (Number(v.stock) || 0),
                    0
                  )
                : Number(prod.stock) || 0;

              const totalInCart = cartItems.reduce(
                (sum, item) =>
                  String(item.productId || item._id) === String(productId)
                    ? sum + (Number(item.quantity) || 0)
                    : sum,
                0
              );

              const isOutOfStock = totalStock <= 0;

              if (isVariantProduct) {
                return (
                  <div
                    key={productId}
                    className={`flex h-full flex-col justify-between rounded-xl border bg-white p-3 shadow-xs transition ${
                      isOutOfStock
                        ? 'border-slate-200 opacity-70'
                        : totalInCart > 0
                          ? 'border-orange-400 ring-1 ring-orange-300'
                          : 'border-orange-100 hover:border-orange-300'
                    }`}
                  >
                    {/* Parent Brand Product Header */}
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-100 bg-orange-50/40">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={productName}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-orange-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 sm:text-sm">
                            {productName}
                          </h4>
                          {totalInCart > 0 && (
                            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                              <Check className="h-3 w-3" />
                              {totalInCart}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {mainName !== '—' ? mainName : getCategoryName(prod)}
                        </p>
                      </div>
                    </div>

                    {/* Inline Sub-Variants Directly Inside Parent Card */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-orange-50 pt-2.5">
                      {activeVariants.map((variant) => {
                        const vStock = Number(variant.stock) || 0;
                        const vOut = vStock <= 0;
                        const vInCart = cartItems.find(
                          (item) =>
                            String(item.productId || item._id) ===
                              String(productId) &&
                            String(item.variantId || '') === String(variant._id)
                        );

                        return (
                          <button
                            key={variant._id}
                            type="button"
                            disabled={vOut}
                            onClick={() => handleAddVariantDirect(prod, variant)}
                            title={
                              vOut
                                ? `${variant.variantName} — Out of stock`
                                : `Add ${variant.variantName} (${vStock} ${variant.unit || 'pcs'} left)`
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition ${
                              vOut
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                                : vInCart
                                  ? 'border-orange-500 bg-orange-500 text-white shadow-xs hover:bg-orange-600'
                                  : 'border-orange-200 bg-orange-50/60 text-slate-800 hover:border-orange-400 hover:bg-orange-100'
                            }`}
                          >
                            <span className="font-semibold">
                              {variant.variantName}
                            </span>
                            <span
                              className={`font-bold ${
                                vInCart
                                  ? 'text-white'
                                  : vOut
                                    ? 'text-slate-400'
                                    : 'text-orange-700'
                              }`}
                            >
                              {formatCurrency(variant.sellingPrice)}
                            </span>
                            <span
                              className={`text-[10px] ${
                                vInCart
                                  ? 'text-orange-100'
                                  : vOut
                                    ? 'text-rose-500 no-underline'
                                    : 'text-slate-500'
                              }`}
                            >
                              {vOut ? 'Out' : `(${vStock})`}
                            </span>
                            {vInCart && (
                              <span className="ml-0.5 rounded-full bg-white px-1 text-[10px] font-bold text-orange-600">
                                {vInCart.quantity}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // LOOSE product card (direct Add to Cart)
              const handleLooseAdd = () => {
                if (isOutOfStock) return;
                onAddToCart({
                  ...prod,
                  productId,
                  name: productName,
                  category: getCategoryName(prod),
                });
              };

              return (
                <div
                  key={productId}
                  onClick={handleLooseAdd}
                  role="button"
                  tabIndex={isOutOfStock ? -1 : 0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isOutOfStock) {
                      e.preventDefault();
                      handleLooseAdd();
                    }
                  }}
                  className={`flex h-full cursor-pointer flex-col justify-between rounded-xl border bg-white p-3 shadow-xs transition ${
                    isOutOfStock
                      ? 'cursor-not-allowed border-slate-200 opacity-60'
                      : totalInCart > 0
                        ? 'border-orange-400 ring-1 ring-orange-300'
                        : 'border-orange-100 hover:border-orange-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-100 bg-orange-50/40">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={productName}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-orange-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 sm:text-sm">
                          {productName}
                        </h4>
                        {totalInCart > 0 && (
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                            <Check className="h-3 w-3" />
                            {totalInCart}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {mainName !== '—' ? mainName : getCategoryName(prod)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-orange-50 pt-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {formatCurrency(prod.sellingPrice)}
                      </p>
                      <p
                        className={`text-[11px] font-medium ${
                          isOutOfStock ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Out of stock'
                          : `${totalStock} ${prod.unit || 'pcs'} left`}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Camera / USB Barcode Scanner Modal */}
      {scannerOpen && (
        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(code) => {
            setScannerOpen(false);
            handleBarcodeLookup(code);
          }}
        />
      )}
    </div>
  );
};

export default ProductSelector;
