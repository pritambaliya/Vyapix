import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Plus,
  Boxes,
  Package,
  Archive,
  X,
} from 'lucide-react';

import Button from '../../Components/common/Button';
import Input from '../../Components/common/Input';
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

import SEO from '../../Components/common/SEO';

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.message ||
  fallback;

const getProductResponse = (response) => {
  const root = response?.data || response;

  const products =
    root?.products ||
    root?.data?.products ||
    (Array.isArray(root) ? root : []);

  const pagination =
    root?.pagination ||
    root?.data?.pagination ||
    null;

  return {
    products: Array.isArray(products) ? products : [],
    pagination,
  };
};

// --------------------------------------------------
// PRODUCTS PAGE
// --------------------------------------------------

export const ProductsPage = () => {
  const navigate = useNavigate();

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

  // --------------------------------------------------
  // FILTERS
  // --------------------------------------------------

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [lowStockOnly, setLowStockOnly] = useState(
    searchParams.get('filter') === 'lowStock'
  );

  const debouncedSearch = useDebounce(search, 300);

  // --------------------------------------------------
  // EDIT PRODUCT MODAL
  // --------------------------------------------------

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // --------------------------------------------------
  // STOCK MODAL
  // --------------------------------------------------

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const [stockProduct, setStockProduct] = useState(null);

  // null = main product stock
  // object = selected variant stock
  const [stockVariant, setStockVariant] = useState(null);

  const [stockLoading, setStockLoading] = useState(false);

  // --------------------------------------------------
  // INVENTORY HISTORY
  // --------------------------------------------------

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProductId, setHistoryProductId] = useState(null);

  // --------------------------------------------------
  // FETCH CATEGORIES
  // --------------------------------------------------

  const fetchCategories = useCallback(async () => {
    if (!isOwner) {
      setCategories([]);
      return;
    }

    setCategoriesLoading(true);

    try {
      const response = await productService.getCategories();

      const categoryList = normalizeList(
        response,
        ['categories']
      );

      setCategories(categoryList);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load categories'));
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
        search: debouncedSearch.trim() || undefined,
        categoryId: categoryId || undefined,
        lowStock: lowStockOnly ? 'true' : undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = isOwner
        ? await productService.getOwnerProducts(params)
        : await productService.getBillingProducts(params);

      const result = getProductResponse(response);

      setProducts(result.products);

      if (result.pagination) {
        setPagination((previous) => ({
          ...previous,
          ...result.pagination,
        }));
      } else {
        setPagination((previous) => ({
          ...previous,
          total: result.products.length,
          totalPages: 1,
        }));
      }
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load products'));
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
  // ADD PRODUCT
  // --------------------------------------------------

  const openAddProductModal = () => {
    if (!isOwner) return;

    navigate('/product/create');
  };

  // --------------------------------------------------
  // EDIT PRODUCT
  // --------------------------------------------------

  const openEditProductModal = (product) => {
    if (!product) return;

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

      setIsProductModalOpen(false);
      setSelectedProduct(null);

      await fetchCategories();

      if (!id && pagination.page !== 1) {
        setPagination((previous) => ({
          ...previous,
          page: 1,
        }));
      } else {
        await fetchProducts();
      }

      if (!id) {
        navigate('/products', { replace: true });
      }
    } catch (err) {
      error(
        getErrorMessage(err, 'Failed to save product')
      );
    } finally {
      setModalLoading(false);
    }
  };

  // --------------------------------------------------
  // STOCK ADJUSTMENT
  // --------------------------------------------------

  // Main product stock adjustment
  const openStockModal = (product) => {
    if (!product) return;

    setStockProduct(product);
    setStockVariant(null);

    setIsStockModalOpen(true);
  };

  // Individual variant stock adjustment
  const openVariantStockModal = (product, variant) => {
    if (!product || !variant) return;

    setStockProduct(product);
    setStockVariant(variant);

    setIsStockModalOpen(true);
  };

  const closeStockModal = () => {
    if (stockLoading) return;

    setIsStockModalOpen(false);
    setStockProduct(null);
    setStockVariant(null);
  };

  // Save stock adjustment
  const handleStockAdjust = async (payload) => {
    if (!stockProduct) {
      error('Please select a product');
      return;
    }

    const productId =
      stockProduct._id || stockProduct.id;

    const variantId =
      stockVariant?._id ||
      payload?.variantId ||
      null;

    const {
      mode,
      quantity,
      reason,
    } = payload || {};

    if (!productId) {
      error('Invalid product selected');
      return;
    }

    if (!mode || !quantity || Number(quantity) <= 0) {
      error('Please enter a valid stock quantity');
      return;
    }

    setStockLoading(true);

    try {
      const stockData = {
        quantity: Number(quantity),
        reason,
        ...(variantId ? { variantId } : {}),
      };

      if (mode === 'add') {
        await productService.addStock(productId, stockData);

        success(
          variantId
            ? 'Variant stock added successfully'
            : 'Product stock added successfully'
        );
      } else if (mode === 'remove') {
        await productService.removeStock(productId, stockData);

        success(
          variantId
            ? 'Variant stock deducted successfully'
            : 'Product stock deducted successfully'
        );
      } else {
        error('Invalid stock adjustment mode');
        return;
      }

      setIsStockModalOpen(false);
      setStockProduct(null);
      setStockVariant(null);

      await fetchProducts();
    } catch (err) {
      error(
        getErrorMessage(err, 'Stock adjustment failed')
      );
    } finally {
      setStockLoading(false);
    }
  };

  // --------------------------------------------------
  // INVENTORY HISTORY
  // --------------------------------------------------

  const openHistory = (product) => {
    const productId = product?._id || product?.id;

    if (!productId) return;

    setHistoryProductId(productId);
    setIsHistoryOpen(true);
  };

  const closeHistory = () => {
    setIsHistoryOpen(false);
    setHistoryProductId(null);
  };

  // --------------------------------------------------
  // HIDE / ARCHIVE MODAL (ALL 5 LEVELS)
  // --------------------------------------------------

  const [hideTarget, setHideTarget] = useState(null);
  const [hideLoading, setHideLoading] = useState(false);

  const [editNameTarget, setEditNameTarget] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [editNameLoading, setEditNameLoading] = useState(false);

  const openEditNameModal = ({ type, id, name }) => {
    setEditNameTarget({ type, id, name });
    setEditNameValue(name || '');
    setEditNameError('');
  };

  const closeEditNameModal = () => {
    if (editNameLoading) return;
    setEditNameTarget(null);
    setEditNameValue('');
    setEditNameError('');
  };

  const handleSaveEditName = async (event) => {
    event?.preventDefault();
    if (!editNameTarget?.id || editNameLoading) return;

    const trimmed = editNameValue.trim();
    if (!trimmed) {
      setEditNameError(
        `${editNameTarget.type === 'category' ? 'Category' : 'Main Product'} name is required.`
      );
      return;
    }

    setEditNameLoading(true);
    setEditNameError('');

    try {
      if (editNameTarget.type === 'category') {
        await productService.updateCategory(editNameTarget.id, { name: trimmed });
        success('Category name updated successfully.');
      } else {
        await productService.updateMainProduct(editNameTarget.id, { name: trimmed });
        success('Main Product name updated successfully.');
      }

      setEditNameTarget(null);
      setEditNameValue('');
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update name');
      setEditNameError(msg);
      error(msg);
    } finally {
      setEditNameLoading(false);
    }
  };

  const openHideModal = (target) => {
    setHideTarget(target);
  };

  const closeHideModal = () => {
    if (hideLoading) return;
    setHideTarget(null);
  };

  const openDeleteModal = (product) => {
    if (!product) return;
    openHideModal({
      type: 'product',
      id: product._id || product.id,
      name: getProductName(product),
      title: 'Hide Product',
      description: `Are you sure you want to hide "${getProductName(product)}" from the active catalog? All variants of this product will be hidden from POS billing, while historical invoices and stock records remain safe.`,
    });
  };

  const openHideCategoryModal = ({ id, name }) => {
    openHideModal({
      type: 'category',
      id,
      name,
      variant: 'warning',
      confirmText: 'Confirm Hide',
      title: 'Hide Category',
      description: `Are you sure you want to hide category "${name}"? All active Main Products, Brand Products, and Products under this category will also be archived. Historical invoices remain safe.`,
    });
  };

  const openDeleteCategoryModal = ({ id, name }) => {
    openHideModal({
      type: 'deleteCategory',
      id,
      name,
      variant: 'danger',
      confirmText: 'Delete Category',
      title: 'Delete Category',
      description: `Are you sure you want to permanently delete category "${name}"? This will permanently delete the category along with all its Main Products, Brand Products, and inventory Products. This action cannot be undone.`,
    });
  };

  const openHideMainProductModal = ({ id, name }) => {
    openHideModal({
      type: 'mainProduct',
      id,
      name,
      variant: 'warning',
      confirmText: 'Confirm Hide',
      title: 'Hide Main Product',
      description: `Are you sure you want to hide main product "${name}"? All active Brand Products and Products under it will also be archived. Historical invoices remain safe.`,
    });
  };

  const openDeleteMainProductModal = ({ id, name }) => {
    openHideModal({
      type: 'deleteMainProduct',
      id,
      name,
      variant: 'danger',
      confirmText: 'Delete Main Product',
      title: 'Delete Main Product',
      description: `Are you sure you want to permanently delete main product "${name}"? This will permanently delete the main product along with all its Brand Products and inventory Products. This action cannot be undone.`,
    });
  };

  const openHideVariantModal = (product, variant) => {
    const productId = product?._id || product?.id;
    const variantId = variant?._id || variant?.id;
    const variantLabel = variant?.variantName || 'Variant';
    openHideModal({
      type: 'variant',
      id: variantId,
      productId,
      name: `${getProductName(product)} – ${variantLabel}`,
      title: 'Hide Variant',
      description: `Are you sure you want to hide variant "${variantLabel}" of "${getProductName(product)}"? It will no longer appear in active POS billing or stock tables until restored.`,
    });
  };

  const handleConfirmHide = async () => {
    if (!hideTarget?.id) return;

    setHideLoading(true);

    try {
      switch (hideTarget.type) {
        case 'category':
          await productService.deleteCategory(hideTarget.id);
          success('Category hidden successfully.');
          break;
        case 'deleteCategory':
          await productService.permanentDeleteCategory(hideTarget.id);
          success('Category deleted successfully.');
          break;
        case 'mainProduct':
          await productService.deleteMainProduct(hideTarget.id);
          success('Main Product hidden successfully.');
          break;
        case 'deleteMainProduct':
          await productService.permanentDeleteMainProduct(hideTarget.id);
          success('Main Product deleted successfully.');
          break;
        case 'brandProduct':
          await productService.deleteBrandProduct(hideTarget.id);
          success(`Brand product "${hideTarget.name}" and related items archived`);
          break;
        case 'variant':
          await productService.archiveVariant(hideTarget.productId, hideTarget.id);
          success(`Variant "${hideTarget.name}" archived`);
          break;
        case 'product':
        default:
          await productService.deleteProduct(hideTarget.id);
          success(`Product "${hideTarget.name}" archived`);
          break;
      }

      setHideTarget(null);
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to archive item'));
    } finally {
      setHideLoading(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-full space-y-6 bg-[#fffaf5] p-1 sm:p-2">

      <SEO
        title="Products & Inventory | Vyapix"
        description="Manage your product catalog, variants, pricing, GST, and stock levels."
        path="/products"
        noIndex={true}
      />

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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/products/archived')}
              icon={Archive}
            >
              Archived Items
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={openAddProductModal}
              icon={Plus}
            >
              Add New Product
            </Button>
          </div>
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

        {/* TABLE CONTENT */}

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

            // Main product stock
            onAdjustStock={openStockModal}

            // Individual variant stock
            onAdjustVariantStock={openVariantStockModal}

            onViewHistory={openHistory}
            onEdit={openEditProductModal}
            onDelete={openDeleteModal}
            onEditCategory={openEditNameModal}
            onDeleteCategory={openDeleteCategoryModal}
            onHideCategory={openHideCategoryModal}
            onEditMainProduct={openEditNameModal}
            onDeleteMainProduct={openDeleteMainProductModal}
            onHideMainProduct={openHideMainProductModal}
            onHideVariant={openHideVariantModal}
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

      {/* EDIT PRODUCT MODAL */}

      {isProductModalOpen && selectedProduct && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
          onSave={handleSaveProduct}
          product={selectedProduct}
          loading={modalLoading}
        />
      )}

      {/* STOCK ADJUSTMENT MODAL */}

      <StockAdjustModal
        isOpen={isStockModalOpen}
        onClose={closeStockModal}
        onAdjust={handleStockAdjust}
        product={stockProduct}
        variant={stockVariant}
        loading={stockLoading}
      />

      {/* INVENTORY HISTORY */}

      <InventoryHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={closeHistory}
        productId={historyProductId}
      />

      {/* HIDE / DELETE CONFIRMATION */}

      <ConfirmModal
        isOpen={Boolean(hideTarget)}
        onClose={closeHideModal}
        onConfirm={handleConfirmHide}
        title={hideTarget?.title || 'Hide Item'}
        message={hideTarget?.description || ''}
        confirmText={hideTarget?.confirmText || 'Confirm Hide'}
        variant={hideTarget?.variant || 'warning'}
        loading={hideLoading}
      />

      {/* EDIT CATEGORY / MAIN PRODUCT NAME MODAL */}

      {editNameTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditNameModal();
          }}
        >
          <form
            onSubmit={handleSaveEditName}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editNameTarget.type === 'category'
                    ? 'Edit Category Name'
                    : 'Edit Main Product Name'}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Update the display name in your product catalog
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditNameModal}
                disabled={editNameLoading}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="Close edit modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <Input
                label={
                  editNameTarget.type === 'category'
                    ? 'Category Name'
                    : 'Main Product Name'
                }
                value={editNameValue}
                onChange={(e) => {
                  setEditNameValue(e.target.value);
                  if (editNameError) setEditNameError('');
                }}
                error={editNameError}
                placeholder="Enter name"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeEditNameModal}
                disabled={editNameLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={editNameLoading}
                disabled={editNameLoading}
              >
                Save Name
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default ProductsPage;