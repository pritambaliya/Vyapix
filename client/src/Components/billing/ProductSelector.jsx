import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Package,
  Check,
} from 'lucide-react';

import { TableSkeleton } from '../common/Skeleton';
import productService from '../../services/productService';
import { formatCurrency } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';

export const ProductSelector = ({
  onAddToCart,
  cartItems = [],
  isOwner = false,
}) => {
  const { warning } = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const barcodeInputRef = useRef(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);

      try {
        const params = {
          search: debouncedSearch || undefined,
          category: selectedCategory || undefined,
          limit: 50,
        };

        const res = isOwner
          ? await productService.getOwnerProducts(params)
          : await productService.getBillingProducts(params);

        if (cancelled) return;

        if (res.success && res.data) {
          const prods = res.data.products || [];
          setProducts(prods);

          // Collect categories from the initial product list.
          if (!selectedCategory && !debouncedSearch) {
            const cats = Array.from(
              new Set(prods.map((product) => product.category).filter(Boolean))
            );

            setCategories(cats);
          }
        } else {
          setProducts([]);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedCategory, isOwner]);

  // Barcode Scanner Handler
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();

    const barcodeVal = search.trim();

    if (!barcodeVal) return;

    try {
      const res = await productService.getProductByBarcode(barcodeVal);

      if (res.success && res.data?.product) {
        onAddToCart(res.data.product);
        setSearch('');
      } else {
        warning(`No product found for barcode: ${barcodeVal}`);
      }
    } catch {
      warning(`Barcode lookup failed for: ${barcodeVal}`);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-3">
      {/* Search & Barcode Bar */}
      <form onSubmit={handleBarcodeSubmit} className="flex shrink-0 items-center gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </div>

          <input
            ref={barcodeInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or scan barcode..."
            aria-label="Search products or scan barcode"
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-100 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
          />
        </div>
      </form>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            aria-pressed={selectedCategory === ''}
            className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              selectedCategory === ''
                ? 'border-slate-700 bg-slate-700 text-white'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                setSelectedCategory(cat === selectedCategory ? '' : cat)
              }
              aria-pressed={selectedCategory === cat}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                selectedCategory === cat
                  ? 'border-slate-700 bg-slate-700 text-white'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product List */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <TableSkeleton rows={8} cols={3} />
        ) : products.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-200/50 p-6 text-center">
            <Package className="mb-3 h-9 w-9 text-slate-400" />

            <p className="text-sm font-semibold text-slate-700">
              No matching products
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Try another search term or select a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((prod) => {
              const productId = prod._id || prod.id;

              const inCart = cartItems.find(
                (item) => String(item.productId || item._id) === String(productId)
              );

              const isOutOfStock = Number(prod.stock) <= 0;

              return (
                <button
                  key={productId}
                  type="button"
                  onClick={() => {
                    if (!isOutOfStock) {
                      onAddToCart(prod);
                    }
                  }}
                  disabled={isOutOfStock}
                  aria-label={`Add ${prod.name} to cart`}
                  className={`flex min-h-[130px] flex-col justify-between rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                    isOutOfStock
                      ? 'cursor-not-allowed border-slate-300 bg-slate-200/50 opacity-60'
                      : inCart
                        ? 'border-emerald-400 bg-emerald-100/60 hover:border-emerald-500'
                        : 'border-slate-300 bg-slate-100 hover:border-slate-400 hover:bg-slate-200/70'
                  }`}
                >
                  {/* Product Information */}
                  <div className="w-full space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="line-clamp-2 text-xs font-semibold leading-relaxed text-slate-900 sm:text-sm">
                        {prod.name}
                      </h4>

                      {inCart && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                          <Check className="h-3 w-3" />
                          {inCart.quantity}
                        </span>
                      )}
                    </div>

                    <p className="truncate text-[10px] text-slate-500">
                      {prod.category || 'General'}
                    </p>
                  </div>

                  {/* Price & Stock */}
                  <div className="mt-3 w-full border-t border-slate-300 pt-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 sm:text-sm">
                          {formatCurrency(prod.sellingPrice)}
                        </span>

                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          +{prod.gstRate || 0}% GST
                        </span>
                      </div>

                      <span
                        className={`shrink-0 text-[10px] font-medium ${
                          isOutOfStock ? 'text-rose-600' : 'text-slate-600'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Out of stock'
                          : `${prod.stock} ${prod.unit || 'pcs'}`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSelector;
