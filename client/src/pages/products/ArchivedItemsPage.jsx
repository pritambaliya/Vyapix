import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  RotateCcw,
  Trash2,
  Folder,
  Layers,
  Tag,
  Package,
  Boxes,
} from 'lucide-react';

import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import SearchInput from '../../Components/common/SearchInput';
import EmptyState from '../../Components/common/EmptyState';
import ConfirmModal from '../../Components/common/ConfirmModal';
import { TableSkeleton } from '../../Components/common/Skeleton';
import SEO from '../../Components/common/SEO';

import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const LEVEL_TABS = [
  { id: 'all', label: 'All' },
  { id: 'categories', label: 'Categories' },
  { id: 'mainProducts', label: 'Main Products' },
  { id: 'brandProducts', label: 'Brand Products' },
  { id: 'products', label: 'Products' },
  { id: 'variants', label: 'Variants' },
];

const getDeactivatedLabel = (deactivatedBy) => {
  switch (deactivatedBy) {
    case 'SELF':
      return 'Archived directly';
    case 'CATEGORY':
      return 'Archived via Category';
    case 'MAIN_PRODUCT':
      return 'Archived via Main Product';
    case 'BRAND_PRODUCT':
      return 'Archived via Brand Product';
    default:
      return 'Archived';
  }
};

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

export const ArchivedItemsPage = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [archived, setArchived] = useState({
    categories: [],
    mainProducts: [],
    brandProducts: [],
    products: [],
    variants: [],
  });

  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('all');
  const [actionId, setActionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchArchived = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productService.getArchivedItems();
      const data = response?.data || response || {};
      setArchived({
        categories: Array.isArray(data.categories) ? data.categories : [],
        mainProducts: Array.isArray(data.mainProducts) ? data.mainProducts : [],
        brandProducts: Array.isArray(data.brandProducts) ? data.brandProducts : [],
        products: Array.isArray(data.products) ? data.products : [],
        variants: Array.isArray(data.variants) ? data.variants : [],
      });
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load archived items'));
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const matchText = (...parts) =>
      !query ||
      parts.some((p) => String(p || '').toLowerCase().includes(query));

    return {
      categories: archived.categories.filter((c) => matchText(c.name)),
      mainProducts: archived.mainProducts.filter((m) =>
        matchText(m.name, m.categoryId?.name)
      ),
      brandProducts: archived.brandProducts.filter((b) =>
        matchText(
          b.name,
          b.brandName,
          b.mainProductId?.name,
          b.mainProductId?.categoryId?.name
        )
      ),
      products: archived.products.filter((p) =>
        matchText(
          p.brandProductId?.name,
          p.brandProductId?.brandName,
          p.mainProductId?.name,
          p.categoryId?.name,
          p.sku,
          p.barcode
        )
      ),
      variants: archived.variants.filter((v) =>
        matchText(
          v.variant?.variantName,
          v.variant?.sku,
          v.variant?.barcode,
          v.productName,
          v.brandName,
          v.mainProductId?.name,
          v.categoryId?.name
        )
      ),
    };
  }, [archived, query]);

  const counts = {
    all:
      filtered.categories.length +
      filtered.mainProducts.length +
      filtered.brandProducts.length +
      filtered.products.length +
      filtered.variants.length,
    categories: filtered.categories.length,
    mainProducts: filtered.mainProducts.length,
    brandProducts: filtered.brandProducts.length,
    products: filtered.products.length,
    variants: filtered.variants.length,
  };

  const handleRestore = async (level, item) => {
    const key =
      level === 'variant'
        ? `${item.productId}::${item._id}`
        : item._id;

    setActionId(key);
    try {
      if (level === 'category') {
        await productService.restoreCategory(item._id);
        success(`Category "${item.name}" restored`);
      } else if (level === 'mainProduct') {
        await productService.restoreMainProduct(item._id);
        success(`Main product "${item.name}" restored`);
      } else if (level === 'brandProduct') {
        await productService.restoreBrandProduct(item._id);
        success(`Brand product "${item.name}" restored`);
      } else if (level === 'product') {
        await productService.restoreProduct(item._id);
        success(
          `Product "${item.brandProductId?.name || 'Product'}" restored`
        );
      } else if (level === 'variant') {
        await productService.restoreVariant(item.productId, item._id);
        success(`Variant "${item.variant?.variantName}" restored`);
      }
      await fetchArchived();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to restore item'));
    } finally {
      setActionId(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { level, item } = deleteTarget;
      if (level === 'category') {
        await productService.permanentDeleteCategory(item._id);
        success(`Category "${item.name}" permanently deleted`);
      } else if (level === 'mainProduct') {
        await productService.permanentDeleteMainProduct(item._id);
        success(`Main product "${item.name}" permanently deleted`);
      } else if (level === 'brandProduct') {
        await productService.permanentDeleteBrandProduct(item._id);
        success(`Brand product "${item.name}" permanently deleted`);
      } else if (level === 'product') {
        await productService.permanentDeleteProduct(item._id);
        success('Product permanently deleted');
      } else if (level === 'variant') {
        await productService.permanentDeleteVariant(item.productId, item._id);
        success(`Variant "${item.variant?.variantName}" permanently deleted`);
      }
      setDeleteTarget(null);
      await fetchArchived();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to permanently delete item'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showSection = (level) =>
    (activeLevel === 'all' || activeLevel === level) &&
    filtered[level].length > 0;

  return (
    <div className="min-h-full space-y-6 bg-[#fffaf5] p-1 sm:p-2">
      <SEO
        title="Archived Items | Vyapix"
        description="View, restore, or permanently delete archived categories, products, and variants."
        path="/products/archived"
        noIndex={true}
      />

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/products')}
            icon={ArrowLeft}
          >
            Back
          </Button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Archive className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Archived Items
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Restore hidden items back to your active catalog or permanently delete them. Historical invoices remain safe.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH & LEVEL TABS */}
      <div className="space-y-3 rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search archived categories, main products, brands, products, variants, SKU..."
        />

        <div className="flex flex-wrap gap-2">
          {LEVEL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLevel(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                activeLevel === tab.id
                  ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeLevel === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-slate-500'
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <TableSkeleton rows={6} cols={4} />
        </div>
      ) : counts[activeLevel] === 0 ? (
        <div className="rounded-xl border border-orange-100 bg-white p-8">
          <EmptyState
            icon={Archive}
            title="No archived items found"
            message={
              query
                ? 'Try clearing your search or switching level filters.'
                : 'Any hidden categories, main products, brand products, products, or variants will appear here.'
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* CATEGORIES */}
          {showSection('categories') && (
            <ArchiveSection
              title="Categories"
              icon={Folder}
              count={filtered.categories.length}
            >
              {filtered.categories.map((cat) => (
                <ArchiveRow
                  key={cat._id}
                  title={cat.name}
                  subtitle={`Category${cat.deactivatedAt ? ` • Archived ${formatDateTime(cat.deactivatedAt)}` : ''}`}
                  badgeText={getDeactivatedLabel(cat.deactivatedBy)}
                  canRestore={cat.deactivatedBy === 'SELF'}
                  loading={actionId === cat._id}
                  onRestore={() => handleRestore('category', cat)}
                  onDelete={() =>
                    setDeleteTarget({
                      level: 'category',
                      item: cat,
                      name: cat.name,
                    })
                  }
                />
              ))}
            </ArchiveSection>
          )}

          {/* MAIN PRODUCTS */}
          {showSection('mainProducts') && (
            <ArchiveSection
              title="Main Products"
              icon={Boxes}
              count={filtered.mainProducts.length}
            >
              {filtered.mainProducts.map((mp) => (
                <ArchiveRow
                  key={mp._id}
                  title={mp.name}
                  subtitle={`Category: ${mp.categoryId?.name || 'Uncategorized'}`}
                  badgeText={getDeactivatedLabel(mp.deactivatedBy)}
                  canRestore={mp.deactivatedBy === 'SELF'}
                  loading={actionId === mp._id}
                  onRestore={() => handleRestore('mainProduct', mp)}
                  onDelete={() =>
                    setDeleteTarget({
                      level: 'mainProduct',
                      item: mp,
                      name: mp.name,
                    })
                  }
                />
              ))}
            </ArchiveSection>
          )}

          {/* BRAND PRODUCTS */}
          {showSection('brandProducts') && (
            <ArchiveSection
              title="Brand Products"
              icon={Tag}
              count={filtered.brandProducts.length}
            >
              {filtered.brandProducts.map((bp) => (
                <ArchiveRow
                  key={bp._id}
                  title={`${bp.name}${bp.brandName ? ` (${bp.brandName})` : ''}`}
                  subtitle={`${bp.mainProductId?.categoryId?.name || 'Category'} → ${bp.mainProductId?.name || 'Main Product'}`}
                  badgeText={getDeactivatedLabel(bp.deactivatedBy)}
                  canRestore={bp.deactivatedBy === 'SELF'}
                  loading={actionId === bp._id}
                  onRestore={() => handleRestore('brandProduct', bp)}
                  onDelete={() =>
                    setDeleteTarget({
                      level: 'brandProduct',
                      item: bp,
                      name: bp.name,
                    })
                  }
                />
              ))}
            </ArchiveSection>
          )}

          {/* PRODUCTS */}
          {showSection('products') && (
            <ArchiveSection
              title="Products"
              icon={Package}
              count={filtered.products.length}
            >
              {filtered.products.map((prod) => {
                const name = prod.brandProductId?.name || 'Unnamed Product';
                return (
                  <ArchiveRow
                    key={prod._id}
                    title={name}
                    subtitle={`${prod.categoryId?.name || 'Category'} → ${prod.mainProductId?.name || 'Main Product'} • ${prod.sellingType === 'VARIANT' ? `${prod.variants?.length || 0} variants` : `${prod.stock ?? 0} ${prod.unit || 'pcs'} • ${formatCurrency(prod.sellingPrice || 0)}`}`}
                    badgeText={getDeactivatedLabel(prod.deactivatedBy)}
                    canRestore={prod.deactivatedBy === 'SELF'}
                    loading={actionId === prod._id}
                    onRestore={() => handleRestore('product', prod)}
                    onDelete={() =>
                      setDeleteTarget({
                        level: 'product',
                        item: prod,
                        name,
                      })
                    }
                  />
                );
              })}
            </ArchiveSection>
          )}

          {/* VARIANTS */}
          {showSection('variants') && (
            <ArchiveSection
              title="Variants"
              icon={Layers}
              count={filtered.variants.length}
            >
              {filtered.variants.map((entry) => {
                const v = entry.variant;
                const key = `${entry.productId}::${entry._id}`;
                return (
                  <ArchiveRow
                    key={key}
                    title={`${entry.productName} – ${v?.variantName || 'Variant'}`}
                    subtitle={`${entry.categoryId?.name || 'Category'} → ${entry.mainProductId?.name || 'Main Product'} • ${formatCurrency(v?.sellingPrice || 0)} • ${v?.stock ?? 0} ${v?.unit || 'pcs'}`}
                    badgeText={
                      entry.productIsActive
                        ? 'Variant hidden'
                        : 'Parent product archived'
                    }
                    canRestore={entry.productIsActive}
                    loading={actionId === key}
                    onRestore={() => handleRestore('variant', entry)}
                    onDelete={() =>
                      setDeleteTarget({
                        level: 'variant',
                        item: entry,
                        name: `${entry.productName} – ${v?.variantName}`,
                      })
                    }
                  />
                );
              })}
            </ArchiveSection>
          )}
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={handleConfirmPermanentDelete}
        title="Permanent Delete"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name || ''}"? This cannot be undone. Historical invoices and stock records will remain intact.`}
        confirmText="Delete Permanently"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

const ArchiveSection = ({ title, icon: Icon, count, children }) => (
  <section className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-orange-600" />
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-orange-700">
        {count}
      </span>
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
  </section>
);

const ArchiveRow = ({
  title,
  subtitle,
  badgeText,
  canRestore,
  loading,
  onRestore,
  onDelete,
}) => (
  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        <Badge variant={canRestore ? 'warning' : 'default'} size="xs">
          {badgeText}
        </Badge>
      </div>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>

    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="xs"
        icon={RotateCcw}
        loading={loading}
        disabled={!canRestore || loading}
        onClick={onRestore}
        title={
          canRestore
            ? 'Restore to active catalog'
            : 'Restore the parent item first'
        }
      >
        Restore
      </Button>

      <Button
        variant="danger"
        size="xs"
        icon={Trash2}
        disabled={loading}
        onClick={onDelete}
      >
        Permanent Delete
      </Button>
    </div>
  </div>
);

export default ArchivedItemsPage;
