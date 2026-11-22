import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  Plus,
  Boxes,
  Package,
} from 'lucide-react';

import Button from '../../Components/common/Button';
import Pagination from '../../Components/common/Pagination';
import ConfirmModal from '../../Components/common/ConfirmModal';
import { TableSkeleton } from '../../Components/common/Skeleton';

import ProductModal from '../../Components/products/ProductModal';
import StockAdjustModal from '../../Components/products/StockAdjustModal';
import InventoryHistoryDrawer from '../../Components/products/InventoryHistoryDrawer';

import ProductStats from './components/ProductStats';
import ProductFilters from './components/ProductFilters';
import ProductTable from './components/ProductTable';

import productService from '../../services/productService';

import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import {
  normalizeList,
  getProductName,
} from '../../utils/productHelpers';

export const ProductsPage = () => {
  const { isOwner } = useAuth();
  const { success, error } = useToast();

  const [searchParams] = useSearchParams();

  // --------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [lowStockOnly, setLowStockOnly] = useState(
    searchParams.get('filter') === 'lowStock'
  );

  const debouncedSearch = useDebounce(search, 300);

  // --------------------------------------------------
  // PRODUCT MODAL
  // --------------------------------------------------

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // --------------------------------------------------
  // STOCK MODAL
  // --------------------------------------------------

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);

  // --------------------------------------------------
  // INVENTORY HISTORY
  // --------------------------------------------------

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProductId, setHistoryProductId] = useState(null);

  // --------------------------------------------------
  // DELETE MODAL
  // --------------------------------------------------

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --------------------------------------------------
  // FETCH CATEGORIES
  // --------------------------------------------------

  const fetchCategories = useCallback(async () => {
    if (!isOwner) return;

    setCategoriesLoading(true);

    try {
      const response = await productService.getCategories();

      const categoryList = normalizeList(
        response,
        ['categories']
      );

      setCategories(categoryList);
    } catch (err) {
      error(err.message || 'Failed to load categories');

      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [isOwner, error]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --------------------------------------------------
  // FETCH PRODUCTS
  // --------------------------------------------------

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
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
          setPagination((previous) => ({
            ...previous,
            ...response.data.pagination,
          }));
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
    categoryId,
    lowStockOnly,
    pagination.page,
    pagination.limit,
    error,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --------------------------------------------------
  // RESET FILTERS
  // --------------------------------------------------

  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setLowStockOnly(false);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  // --------------------------------------------------
  // FILTER HANDLERS
  // --------------------------------------------------

  const handleSearchChange = (value) => {
    setSearch(value);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const handleLowStockChange = (value) => {
    setLowStockOnly(value);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  // --------------------------------------------------
  // PRODUCT MODAL
  // --------------------------------------------------

  const openAddProductModal = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    if (modalLoading) return;

    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  // --------------------------------------------------
  // SAVE PRODUCT
  // --------------------------------------------------

  const handleSaveProduct = async (payload, id) => {
    setModalLoading(true);

    try {
      if (id) {
        await productService.updateProduct(id, payload);

        success('Product updated successfully');
      } else {
        await productService.createProduct(payload);

        success('Product added successfully');
      }

      // Close modal after successful save.
      setIsProductModalOpen(false);
      setSelectedProduct(null);

      // Refresh categories because the wizard
      // can create a new category.
      await fetchCategories();

      if (id) {
        // Editing an existing product.
        await fetchProducts();
      } else if (pagination.page === 1) {
        // Adding a product while already on page 1.
        await fetchProducts();
      } else {
        // Adding a product from another page.
        // Changing page triggers fetchProducts automatically.
        setPagination((previous) => ({
          ...previous,
          page: 1,
        }));
      }
    } catch (err) {
      error(err.message || 'Failed to save product');
    } finally {
      setModalLoading(false);
    }
  };

  // --------------------------------------------------
  // STOCK ADJUSTMENT
  // --------------------------------------------------

  const openStockModal = (product) => {
    setStockProduct(product);
    setIsStockModalOpen(true);
  };

  const closeStockModal = () => {
    setIsStockModalOpen(false);
    setStockProduct(null);
  };

  const handleStockAdjust = async ({
    productId,
    variantId,
    mode,
    quantity,
    reason,
  }) => {
    setStockLoading(true);

    try {
      const stockData = {
        quantity,
        reason,
        ...(variantId ? { variantId } : {}),
      };

      if (mode === 'add') {
        await productService.addStock(productId, stockData);

        success(`Added ${quantity} units to stock`);
      } else {
        await productService.removeStock(productId, stockData);

        success(`Deducted ${quantity} units from stock`);
      }

      closeStockModal();

      await fetchProducts();
    } catch (err) {
      error(err.message || 'Stock adjustment failed');
    } finally {
      setStockLoading(false);
    }
  };

  // --------------------------------------------------
  // INVENTORY HISTORY
  // --------------------------------------------------

  const openHistory = (product) => {
    setHistoryProductId(product._id || product.id);
    setIsHistoryOpen(true);
  };

  const closeHistory = () => {
    setIsHistoryOpen(false);
    setHistoryProductId(null);
  };

  // --------------------------------------------------
  // DELETE PRODUCT
  // --------------------------------------------------

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteModalOpen(false);
    setProductToDelete(null);
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

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-full space-y-6 bg-[#fffaf5] p-1 sm:p-2">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Boxes className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Products & Inventory
            </h1>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Manage categories, brands, products, variants, pricing, GST, and stock.
            </p>
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

      {/* PRODUCT STATS */}

      <ProductStats products={products} />

      {/* FILTERS */}

      <ProductFilters
        search={search}
        setSearch={handleSearchChange}
        categoryId={categoryId}
        setCategoryId={handleCategoryChange}
        categories={categories}
        lowStockOnly={lowStockOnly}
        setLowStockOnly={handleLowStockChange}
        onReset={resetFilters}
      />

      {/* PRODUCT TABLE */}

      <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">

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

        {loading ? (
          <div className="p-4">
            <TableSkeleton
              rows={8}
              cols={isOwner ? 10 : 9}
            />
          </div>
        ) : (
          <ProductTable
            products={products}
            isOwner={isOwner}
            onAdjustStock={openStockModal}
            onViewHistory={openHistory}
            onEdit={openEditProductModal}
            onDelete={openDeleteModal}
            search={search}
            categoryId={categoryId}
            lowStockOnly={lowStockOnly}
          />
        )}

        {/* PAGINATION */}

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

      {/* ADD / EDIT PRODUCT */}

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        onSave={handleSaveProduct}
        product={selectedProduct}
        loading={modalLoading}
      />

      {/* STOCK ADJUSTMENT */}

      <StockAdjustModal
        isOpen={isStockModalOpen}
        onClose={closeStockModal}
        onAdjust={handleStockAdjust}
        product={stockProduct}
        loading={stockLoading}
      />

      {/* INVENTORY HISTORY */}

      <InventoryHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={closeHistory}
        productId={historyProductId}
      />

      {/* DELETE CONFIRMATION */}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to remove "${getProductName(productToDelete)}" from the active catalog? Historical invoice records will be preserved.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />

    </div>
  );
};

export default ProductsPage;