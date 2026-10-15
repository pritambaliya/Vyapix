import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Package,
  Sliders,
  History,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  Search,
  Filter,
  Boxes,
  RefreshCw,
} from 'lucide-react';

import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import SearchInput from '../../Components/common/SearchInput';
import Pagination from '../../Components/common/Pagination';
import EmptyState from '../../Components/common/EmptyState';
import ConfirmModal from '../../Components/common/ConfirmModal';
import { TableSkeleton } from '../../Components/common/Skeleton';

import ProductModal from '../../Components/products/ProductModal';
import StockAdjustModal from '../../Components/products/StockAdjustModal';
import InventoryHistoryDrawer from '../../Components/products/InventoryHistoryDrawer';

import productService from '../../services/productService';
import { formatCurrency } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ProductsPage = () => {
  const { isOwner } = useAuth();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const [lowStockOnly, setLowStockOnly] = useState(
    searchParams.get('filter') === 'lowStock'
  );

  const [categories, setCategories] = useState([]);

  const debouncedSearch = useDebounce(search, 300);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProductId, setHistoryProductId] = useState(null);


  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        search: debouncedSearch || undefined,
        category: category || undefined,
        lowStock: lowStockOnly ? 'true' : undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = isOwner
        ? await productService.getOwnerProducts(params)
        : await productService.getBillingProducts(params);

      if (response?.success && response?.data) {
        const fetchedProducts = response.data.products || [];

        setProducts(fetchedProducts);

        if (response.data.pagination) {
          const serverPagination = response.data.pagination;

          setPagination((previous) => ({
            ...previous,
            ...serverPagination,
          }));
        }

        if (!category && !debouncedSearch && !lowStockOnly) {
          const availableCategories = [
            ...new Set(
              fetchedProducts
                .map((product) => product.category)
                .filter(Boolean)
            ),
          ];

          setCategories(availableCategories);
        }
      } else {
        setProducts([]);
      }
    } catch (err) {
      error(err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    isOwner,
    debouncedSearch,
    category,
    lowStockOnly,
    pagination.page,
    pagination.limit,
    error,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setLowStockOnly(false);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  const handleSaveProduct = async (payload, id) => {
    setModalLoading(true);

    try {
      if (id) {
        await productService.updateProduct(id, payload);
        success('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        success('Product added to catalog');
      }

      setIsProductModalOpen(false);
      setSelectedProduct(null);

      // Return to page 1 when adding a new product.
      if (!id && pagination.page !== 1) {
        setPagination((previous) => ({
          ...previous,
          page: 1,
        }));
      } else {
        await fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to save product');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStockAdjust = async ({
    productId,
    mode,
    quantity,
    reason,
  }) => {
    setStockLoading(true);

    try {
      if (mode === 'add') {
        await productService.addStock(productId, {
          quantity,
          reason,
        });

        success(`Added ${quantity} units to stock`);
      } else {
        await productService.removeStock(productId, {
          quantity,
          reason,
        });

        success(`Deducted ${quantity} units from stock`);
      }

      setIsStockModalOpen(false);
      setStockProduct(null);

      await fetchProducts();
    } catch (err) {
      error(err.message || 'Stock adjustment failed');
    } finally {
      setStockLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeleteLoading(true);

    try {
      const productId =
        productToDelete._id || productToDelete.id;

      await productService.deleteProduct(productId);

      success('Product removed from active catalog');

      setDeleteModalOpen(false);
      setProductToDelete(null);

      await fetchProducts();
    } catch (err) {
      error(err.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddProductModal = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  return (
    <div className="space-y-6 bg-[#fffaf5] min-h-full p-1 sm:p-2">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Boxes className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Products & Inventory
              </h1>

              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Manage products, pricing, GST, and stock levels.
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="sm"
            onClick={openAddProductModal}
            icon={Plus}
          >
            Add New Product
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Products on this page
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {products.length}
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Low stock items
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-600">
                {
                  products.filter(
                    (product) =>
                      Number(product.stock) > 0 &&
                      Number(product.stock) <=
                        Number(product.lowStockLimit || 5)
                  ).length
                }
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Out of stock
              </p>

              <p className="mt-1 text-2xl font-bold text-rose-600">
                {
                  products.filter(
                    (product) => Number(product.stock) <= 0
                  ).length
                }
              </p>
            </div>

            <div className="rounded-lg bg-rose-50 p-2.5 text-rose-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

      </div>

      <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-orange-500" />

            <h2 className="text-sm font-semibold text-slate-800">
              Search & Filters
            </h2>
          </div>

          {(search || category || lowStockOnly) && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 transition hover:text-orange-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset filters
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);

                setPagination((previous) => ({
                  ...previous,
                  page: 1,
                }));
              }}
              onClear={() => {
                setSearch('');

                setPagination((previous) => ({
                  ...previous,
                  page: 1,
                }));
              }}
              placeholder="Search by name, SKU, or barcode..."
            />
          </div>

          <div className="w-full lg:w-56">
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);

                setPagination((previous) => ({
                  ...previous,
                  page: 1,
                }));
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-orange-100 bg-orange-50/60 px-3 text-sm font-medium text-slate-700 transition hover:bg-orange-50">

            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => {
                setLowStockOnly(event.target.checked);

                setPagination((previous) => ({
                  ...previous,
                  page: 1,
                }));
              }}
              className="h-4 w-4 rounded border-slate-300 accent-orange-500 focus:ring-orange-400"
            />

            <AlertTriangle className="h-4 w-4 text-amber-500" />

            <span className="whitespace-nowrap">
              Low stock only
            </span>
          </label>

        </div>
      </div>


      <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-col gap-2 border-b border-orange-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Product Catalog
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {pagination.total} products in your catalog
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 sm:self-auto">
            <Package className="h-4 w-4" />
            Inventory Management
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="p-4">
            <TableSkeleton
              rows={8}
              cols={isOwner ? 7 : 5}
            />
          </div>
        ) : products.length === 0 ? (

          /* EMPTY STATE */

          <div className="px-4 py-12">
            <EmptyState
              icon={Package}
              title="No products found"
              message={
                search || category || lowStockOnly
                  ? 'Try changing your search or filters to find products.'
                  : 'Your product catalog is empty. Add your first product to get started.'
              }
              actionText={isOwner ? 'Add Product' : undefined}
              onAction={openAddProductModal}
            />
          </div>

        ) : (

          /* TABLE CONTENT */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">

                  <th className="px-4 py-3.5">
                    Product
                  </th>

                  <th className="px-4 py-3.5">
                    Category
                  </th>

                  {isOwner && (
                    <th className="px-4 py-3.5">
                      Cost Price
                    </th>
                  )}

                  <th className="px-4 py-3.5">
                    Selling Price
                  </th>

                  <th className="px-4 py-3.5">
                    GST
                  </th>

                  <th className="px-4 py-3.5">
                    Stock Status
                  </th>

                  <th className="px-4 py-3.5 text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {products.map((product) => {
                  const stock = Number(product.stock ?? 0);

                  const isOutOfStock = stock <= 0;

                  const isLowStock =
                    stock > 0 &&
                    stock <= Number(product.lowStockLimit || 5);

                  return (
                    <tr
                      key={product._id || product.id}
                      className="group transition-colors hover:bg-orange-50/40"
                    >

                      {/* PRODUCT DETAILS */}

                      <td className="px-4 py-3.5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600 transition group-hover:bg-orange-100">
                            <Package className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">

                            <p className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                              {product.name}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">

                              {product.sku && (
                                <span>
                                  SKU: {product.sku}
                                </span>
                              )}

                              {product.barcode && (
                                <span className="flex items-center gap-1">
                                  <Barcode className="h-3 w-3" />
                                  {product.barcode}
                                </span>
                              )}

                              {!product.sku &&
                                !product.barcode && (
                                  <span>No identifiers</span>
                                )}

                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-4 py-3.5">
                        <span className="inline-flex whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* COST PRICE */}

                      {isOwner && (
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-600">
                          {product.purchasePrice !== undefined &&
                          product.purchasePrice !== null
                            ? formatCurrency(product.purchasePrice)
                            : '-'}
                        </td>
                      )}

                      {/* SELLING PRICE */}

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(
                            product.sellingPrice ?? 0
                          )}
                        </span>
                      </td>

                      {/* GST */}

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          {product.gstRate ?? 0}%
                        </span>
                      </td>

                      {/* STOCK */}

                      <td className="whitespace-nowrap px-4 py-3.5">

                        <div className="flex flex-col items-start gap-1.5">

                          <span className="text-sm font-bold text-slate-800">
                            {stock} {product.unit || 'pcs'}
                          </span>

                          {isOutOfStock ? (
                            <Badge
                              variant="danger"
                              size="xs"
                            >
                              Out of stock
                            </Badge>
                          ) : isLowStock ? (
                            <Badge
                              variant="warning"
                              size="xs"
                            >
                              Low stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="success"
                              size="xs"
                            >
                              In stock
                            </Badge>
                          )}

                        </div>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-3.5">

                        <div className="flex items-center justify-end gap-1">

                          {isOwner ? (
                            <>
                              {/* ADJUST STOCK */}

                              <button
                                type="button"
                                onClick={() => {
                                  setStockProduct(product);
                                  setIsStockModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100 hover:text-orange-600"
                                title="Adjust stock"
                                aria-label={`Adjust stock for ${product.name}`}
                              >
                                <Sliders className="h-4 w-4" />
                              </button>

                              {/* INVENTORY HISTORY */}

                              <button
                                type="button"
                                onClick={() => {
                                  setHistoryProductId(
                                    product._id || product.id
                                  );

                                  setIsHistoryOpen(true);
                                }}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                                title="Inventory history"
                                aria-label={`View inventory history for ${product.name}`}
                              >
                                <History className="h-4 w-4" />
                              </button>

                              {/* EDIT PRODUCT */}

                              <button
                                type="button"
                                onClick={() =>
                                  openEditProductModal(product)
                                }
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                title="Edit product"
                                aria-label={`Edit ${product.name}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* DELETE PRODUCT */}

                              <button
                                type="button"
                                onClick={() => {
                                  setProductToDelete(product);
                                  setDeleteModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                title="Delete product"
                                aria-label={`Delete ${product.name}`}
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
        )}


        <div className="border-t border-orange-100 bg-white px-4 py-2">

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => {
              setPagination((previous) => ({
                ...previous,
                page,
              }));
            }}
          />

        </div>
      </div>


      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProduct}
        product={selectedProduct}
        loading={modalLoading}
      />


      <StockAdjustModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockProduct(null);
        }}
        onAdjust={handleStockAdjust}
        product={stockProduct}
        loading={stockLoading}
      />


      <InventoryHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryProductId(null);
        }}
        productId={historyProductId}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to remove "${productToDelete?.name}" from the active catalog? Historical invoice records will be preserved.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />

    </div>
  );
};

export default ProductsPage;