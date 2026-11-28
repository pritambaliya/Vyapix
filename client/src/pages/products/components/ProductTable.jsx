import React, { useEffect, useMemo, useRef, useState } from "react";

import {
    Package,
    Sliders,
    History,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronRight,
    Tag,
    Folder,
    FolderOpen,
    EyeOff,
} from "lucide-react";

import Badge from "../../../Components/common/Badge";
import EmptyState from "../../../Components/common/EmptyState";

import {
    getId,
    getProductName,
    getCategoryName,
    getMainProductName,
    getBrandName,
    getStockSummary,
    getProductPrice,
    getProductCostPrice,
    formatPriceRange,
    isProductLowStock,
    isProductOutOfStock,
} from "../../../utils/productHelpers";

import { formatCurrency } from "../../../utils/formatters";

/* ----------------------------------
   HELPERS
---------------------------------- */

const getVariantId = (variant) => String(variant?._id || variant?.id || "");

const getVariantName = (variant) => {
    if (variant?.name) return variant.name;
    if (variant?.variantName) return variant.variantName;
    if (variant?.label) return variant.label;

    if (variant?.attributes && typeof variant.attributes === "object") {
        return Object.entries(variant.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(" / ");
    }

    return (
        [variant?.size, variant?.color, variant?.weight, variant?.volume]
            .filter(Boolean)
            .join(" / ") || "Standard Variant"
    );
};

const getVariantStock = (variant) =>
    Number(
        variant?.stock ??
        variant?.stockQuantity ??
        variant?.currentStock ??
        variant?.availableStock ??
        0,
    ) || 0;

const getVariants = (product) =>
    (
        product?.variants ||
        product?.variantDetails ||
        product?.productVariants ||
        []
    ).filter((variant) => variant?.isActive !== false);

/* ----------------------------------
   VARIANT STOCK HELPERS
---------------------------------- */

const getTotalVariantStock = (variants = []) => {
    return variants.reduce(
        (total, variant) => total + getVariantStock(variant),
        0,
    );
};

const getVariantParentStockStatus = (product, totalStock) => {
    if (totalStock <= 0) {
        return {
            label: "Out of stock",
            variant: "danger",
        };
    }

    const threshold = Number(
        product?.lowStockThreshold ??
        product?.minimumStock ??
        product?.minStock ??
        0,
    );

    if (threshold > 0 && totalStock <= threshold) {
        return {
            label: "Low stock",
            variant: "warning",
        };
    }

    return {
        label: "In stock",
        variant: "success",
    };
};

const getVariantStatus = (variant) => {
    const stock = getVariantStock(variant);

    if (stock <= 0) {
        return {
            label: "Out of stock",
            variant: "danger",
        };
    }

    const threshold = Number(
        variant?.lowStockLimit ??
        variant?.lowStockThreshold ??
        variant?.minimumStock ??
        variant?.minStock ??
        0,
    );

    if (threshold > 0 && stock <= threshold) {
        return {
            label: "Low stock",
            variant: "warning",
        };
    }

    return {
        label: "In stock",
        variant: "success",
    };
};

/* ----------------------------------
   COMPONENT
---------------------------------- */

const ProductTable = ({
    products = [],
    isOwner,

    onAdjustStock,
    onViewHistory,
    onEdit,
    onDelete,

    onAdjustVariantStock,
    onEditCategory,
    onDeleteCategory,
    onHideCategory,
    onEditMainProduct,
    onDeleteMainProduct,
    onHideMainProduct,
    onHideVariant,

    search,
    categoryId,
    lowStockOnly,
}) => {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [selectedMainProductKey, setSelectedMainProductKey] = useState(null);
    const [expandedProducts, setExpandedProducts] = useState({});
    const [contextMenu, setContextMenu] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!contextMenu) return;

        const handleOutsideClick = (event) => {
            if (!menuRef.current?.contains(event.target)) {
                setContextMenu(null);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setContextMenu(null);
            }
        };

        const handleScroll = () => setContextMenu(null);

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [contextMenu]);

    const handleOpenContextMenu = (event, payload) => {
        if (!isOwner || !payload?.id) return;

        event.preventDefault();
        event.stopPropagation();

        const menuWidth = 190;
        const menuHeight = 165;

        const x = Math.min(
            event.clientX,
            window.innerWidth - menuWidth - 10
        );
        const y = Math.min(
            event.clientY,
            window.innerHeight - menuHeight - 10
        );

        setContextMenu({
            ...payload,
            x: Math.max(10, x),
            y: Math.max(10, y),
        });
    };

    /* ----------------------------------
         BUILD CATEGORY HIERARCHY
      ---------------------------------- */

    const categoryGroups = useMemo(() => {
        const categoryMap = new Map();
        products.forEach((product) => {
            const catId = String(getId(product?.categoryId) || "");
            const categoryName = getCategoryName(product) || "Uncategorized";
            const catKey = catId || categoryName;

            const mainId = String(getId(product?.mainProductId) || "");
            const mainProductName = getMainProductName(product);
            const resolvedMainName =
                mainProductName && mainProductName !== "—"
                    ? mainProductName
                    : "Other Products";
            const mainKey = `${catKey}::${mainId || resolvedMainName}`;

            if (!categoryMap.has(catKey)) {
                categoryMap.set(catKey, {
                    id: catId,
                    key: catKey,
                    name: categoryName,
                    mainProducts: new Map(),
                });
            }

            const category = categoryMap.get(catKey);

            if (!category.mainProducts.has(mainKey)) {
                category.mainProducts.set(mainKey, {
                    id: mainId,
                    key: mainKey,
                    name: resolvedMainName,
                    categoryName,
                    products: [],
                });
            }

            category.mainProducts.get(mainKey).products.push(product);
        });

        return Array.from(categoryMap.values())
            .map((category) => {
                const mainProducts = Array.from(category.mainProducts.values()).sort(
                    (a, b) => b.products.length - a.products.length,
                );

                return {
                    ...category,
                    mainProducts,
                    mainProductCount: mainProducts.length,
                    productCount: mainProducts.reduce(
                        (total, item) => total + item.products.length,
                        0,
                    ),
                };
            })
            .sort((a, b) => {
                return (
                    b.mainProductCount - a.mainProductCount ||
                    b.productCount - a.productCount
                );
            });
    }, [products]);

    /* ----------------------------------
         DEFAULT SELECTION
      ---------------------------------- */

    useEffect(() => {
        if (!categoryGroups.length) {
            setSelectedMainProductKey(null);
            return;
        }

        const allMainProducts = categoryGroups.flatMap(
            (category) => category.mainProducts,
        );

        const selectedExists = allMainProducts.some(
            (item) => item.key === selectedMainProductKey,
        );

        if (!selectedExists) {
            setSelectedMainProductKey(allMainProducts[0]?.key || null);
        }

        setExpandedCategories((previous) => {
            const updated = { ...previous };
            categoryGroups.forEach((category, index) => {
                if (updated[category.key] === undefined) {
                    updated[category.key] = index === 0;
                }
            });

            return updated;
        });
    }, [categoryGroups, selectedMainProductKey]);

    /* ----------------------------------
         SELECTED PRODUCTS
      ---------------------------------- */

    const selectedGroup = useMemo(() => {
        for (const category of categoryGroups) {
            const mainProduct = category.mainProducts.find(
                (item) => item.key === selectedMainProductKey,
            );
            if (mainProduct) {
                return {
                    categoryName: category.name,
                    mainProductName: mainProduct.name,
                    products: mainProduct.products || [],
                };
            }
        }
        return { categoryName: "", mainProductName: "", products: [] };
    }, [categoryGroups, selectedMainProductKey]);

    const selectedProducts = selectedGroup.products;

    /* ----------------------------------
         HANDLERS
      ---------------------------------- */

    const toggleCategory = (categoryKey) => {
        setExpandedCategories((previous) => ({
            ...previous,
            [categoryKey]: !previous[categoryKey],
        }));
    };

    const toggleVariants = (productId) => {
        setExpandedProducts((previous) => ({
            ...previous,
            [productId]: !previous[productId],
        }));
    };

    /* ----------------------------------
         EMPTY STATE
      ---------------------------------- */

    if (!products.length) {
        return (
            <div className="px-4 py-12">
                <EmptyState
                    icon={Package}
                    title="No products found"
                    message={
                        search || categoryId || lowStockOnly
                            ? "Try changing your search or filters."
                            : "Your product catalog is empty. Add your first product to get started."
                    }
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* ==================================
                LEFT: CATEGORY NAVIGATION
            ================================== */}

            <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-orange-50/70 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Categories
                        </h3>

                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                            {categoryGroups.length}
                        </span>
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-2">
                    {categoryGroups.map((category) => {
                        const isCategoryExpanded = Boolean(
                            expandedCategories[category.key],
                        );

                        const categoryHasSelection = category.mainProducts.some(
                            (item) => item.key === selectedMainProductKey,
                        );

                        return (
                            <div key={category.key} className="mb-1">
                                {/* CATEGORY */}

                                <div
                                    className={`flex w-full items-center justify-between gap-1 rounded-lg px-2 py-2 transition ${categoryHasSelection
                                        ? "bg-orange-50 text-orange-700"
                                        : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category.key)}
                                        onContextMenu={(e) =>
                                            handleOpenContextMenu(e, {
                                                type: "category",
                                                id: category.id,
                                                name: category.name,
                                            })
                                        }
                                        className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left"
                                    >
                                        {isCategoryExpanded ? (
                                            <FolderOpen
                                                size={17}
                                                className="shrink-0 text-orange-500"
                                            />
                                        ) : (
                                            <Folder size={17} className="shrink-0 text-slate-400" />
                                        )}

                                        <span className="truncate text-sm font-semibold">
                                            {category.name}
                                        </span>
                                    </button>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                            {category.mainProductCount}
                                        </span>


                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category.key)}
                                            aria-label="Toggle category"
                                            className="p-0.5"
                                        >
                                            {isCategoryExpanded ? (
                                                <ChevronDown size={15} />
                                            ) : (
                                                <ChevronRight size={15} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* MAIN PRODUCTS */}

                                {isCategoryExpanded && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                                        {category.mainProducts.map((mainProduct) => {
                                            const isSelected =
                                                selectedMainProductKey === mainProduct.key;

                                            return (
                                                <div
                                                    key={mainProduct.key}
                                                    className={`flex w-full items-center justify-between gap-1 rounded-lg px-2 py-1.5 transition ${isSelected
                                                        ? "bg-orange-500 text-white shadow-sm"
                                                        : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                                                        }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedMainProductKey(mainProduct.key)
                                                        }
                                                        onContextMenu={(e) =>
                                                            handleOpenContextMenu(e, {
                                                                type: "mainProduct",
                                                                id: mainProduct.id,
                                                                name: mainProduct.name,
                                                                categoryName: category.name,
                                                            })
                                                        }
                                                        className="flex min-w-0 flex-1 items-center justify-between gap-2 px-1 py-1 text-left"
                                                    >
                                                        <span className="min-w-0 truncate text-xs font-medium">
                                                            {mainProduct.name}
                                                        </span>

                                                        <span
                                                            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected
                                                                ? "bg-white/20 text-white"
                                                                : "bg-slate-100 text-slate-500"
                                                                }`}
                                                        >
                                                            {mainProduct.products.length}
                                                        </span>
                                                    </button>

                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* ==================================
                RIGHT: PRODUCT TABLE
            ================================== */}

            <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50/50 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Package size={18} className="shrink-0 text-orange-500" />
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-slate-800">
                                {selectedGroup.categoryName
                                    ? `${selectedGroup.categoryName} → ${selectedGroup.mainProductName}`
                                    : selectedGroup.mainProductName || "Products"}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                {selectedProducts.length} products
                            </p>
                        </div>
                    </div>

                    {selectedProducts.length > 0 && (
                        <span className="rounded-lg border border-orange-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-orange-600">
                            Product List
                        </span>
                    )}
                </div>

                {/* EMPTY SELECTED MAIN PRODUCT */}

                {!selectedProducts.length ? (
                    <div className="px-4 py-12 text-center">
                        <Package size={30} className="mx-auto mb-2 text-slate-300" />

                        <p className="text-sm font-semibold text-slate-600">
                            No products available
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Select another main product.
                        </p>
                    </div>
                ) : (
                    <>
                    {/* MOBILE CARD LIST */}
                    <div className="divide-y divide-slate-100 md:hidden">
                        {selectedProducts.map((product) => {
                            const productId = String(product._id || product.id);
                            const productName = getProductName(product);
                            const isVariant = product.sellingType === "VARIANT";
                            const variants = isVariant ? getVariants(product) : [];
                            const totalVariantStock = isVariant ? getTotalVariantStock(variants) : 0;
                            const stockSummary = getStockSummary(product);
                            const displayedStock = isVariant ? totalVariantStock : stockSummary.totalStock;
                            const parentStockStatus = isVariant
                                ? getVariantParentStockStatus(product, totalVariantStock)
                                : null;
                            const price = getProductPrice(product);
                            const costPrice = getProductCostPrice(product);
                            const isExpanded = Boolean(expandedProducts[productId]);
                            const brandName = getBrandName(product);

                            return (
                                <div key={`mobile-${productId}`} className="space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            {isVariant ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleVariants(productId)}
                                                    aria-label="Toggle variants"
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600"
                                                >
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            ) : (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                                    <Package size={16} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-800">{productName}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    {brandName} • {isVariant ? `${variants.length} variants` : (product.sku || product.barcode || "Loose")}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={isVariant ? "info" : "default"} size="xs">
                                            {isVariant ? "Variant" : "Loose"}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-400">Selling</span>
                                            <p className="font-bold text-slate-800">{formatPriceRange(price, formatCurrency)}</p>
                                        </div>
                                        {isOwner && (
                                            <div>
                                                <span className="text-[10px] text-slate-400">Cost</span>
                                                <p className="font-medium text-slate-600">{formatPriceRange(costPrice, formatCurrency)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-[10px] text-slate-400">Stock</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-800">{displayedStock} {product.unit || "pcs"}</span>
                                                {isVariant && parentStockStatus && (
                                                    <Badge variant={parentStockStatus.variant} size="xs">{parentStockStatus.label}</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400">GST</span>
                                            <p className="font-semibold text-slate-600">{product.gstRate ?? 0}%</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                                        {isOwner && !isVariant && onAdjustStock && (
                                            <button
                                                type="button"
                                                onClick={() => onAdjustStock(product)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700"
                                            >
                                                <Sliders size={13} /> Stock
                                            </button>
                                        )}
                                        {onViewHistory && (
                                            <button
                                                type="button"
                                                onClick={() => onViewHistory(product)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"
                                            >
                                                <History size={13} /> History
                                            </button>
                                        )}
                                        {isOwner && onEdit && (
                                            <button
                                                type="button"
                                                onClick={() => onEdit(product)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                            >
                                                <Edit2 size={13} /> Edit
                                            </button>
                                        )}
                                        {isOwner && onDelete && (
                                            <button
                                                type="button"
                                                onClick={() => onDelete(product)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                                            >
                                                <EyeOff size={13} /> Hide Product
                                            </button>
                                        )}
                                    </div>

                                    {isVariant && isExpanded && variants.length > 0 && (
                                        <div className="space-y-2 border-t border-orange-100 pt-2">
                                            {variants.map((variant) => {
                                                const vId = getVariantId(variant);
                                                const vStock = getVariantStock(variant);
                                                const vStatus = getVariantStatus(variant);
                                                return (
                                                    <div key={vId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-slate-800">{getVariantName(variant)}</p>
                                                            <p className="text-[11px] text-slate-500">
                                                                {formatCurrency(variant.sellingPrice)} • {vStock} {variant.unit || "pcs"}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            <Badge variant={vStatus.variant} size="xs">{vStatus.label}</Badge>
                                                            {isOwner && onAdjustVariantStock && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onAdjustVariantStock(product, variant)}
                                                                    className="rounded border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700"
                                                                >
                                                                    Adjust
                                                                </button>
                                                            )}
                                                            {isOwner && onHideVariant && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onHideVariant(product, variant)}
                                                                    className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700"
                                                                >
                                                                    Hide
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">Brand</th>
                                    <th className="px-4 py-3">Type</th>

                                    {isOwner && <th className="px-4 py-3">Cost</th>}

                                    <th className="px-4 py-3">Selling</th>
                                    <th className="px-4 py-3">GST</th>
                                    <th className="px-4 py-3">Stock</th>

                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {selectedProducts.map((product) => {
                                    const productId = String(product._id || product.id);

                                    const productName = getProductName(product);

                                    const isVariant = product.sellingType === "VARIANT";

                                    const variants = isVariant ? getVariants(product) : [];

                                    // Calculate combined stock for all variants.
                                    const totalVariantStock = isVariant
                                        ? getTotalVariantStock(variants)
                                        : 0;

                                    const stockSummary = getStockSummary(product);

                                    const displayedStock = isVariant
                                        ? totalVariantStock
                                        : stockSummary.totalStock;

                                    const parentStockStatus = isVariant
                                        ? getVariantParentStockStatus(product, totalVariantStock)
                                        : null;

                                    const price = getProductPrice(product);

                                    const costPrice = getProductCostPrice(product);

                                    const isExpanded = Boolean(expandedProducts[productId]);

                                    const brandName = getBrandName(product);

                                    return (
                                        <React.Fragment key={productId}>
                                            {/* PRODUCT ROW */}

                                            <tr className="transition hover:bg-orange-50/30">
                                                {/* PRODUCT */}

                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        {isVariant ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleVariants(productId)}
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronDown size={16} />
                                                                ) : (
                                                                    <ChevronRight size={16} />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                                                <Package size={16} />
                                                            </div>
                                                        )}

                                                        <div className="min-w-0">
                                                            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">
                                                                {productName}
                                                            </p>

                                                            {isVariant ? (
                                                                <span className="text-[10px] text-orange-600">
                                                                    {variants.length} variants
                                                                </span>
                                                            ) : (
                                                                <div className="mt-1 text-[10px] text-slate-400">
                                                                    {product.sku && (
                                                                        <span>SKU: {product.sku}</span>
                                                                    )}

                                                                    {!product.sku && product.barcode && (
                                                                        <span>{product.barcode}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* BRAND */}

                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`text-xs font-medium ${brandName === "Unbranded"
                                                            ? "text-slate-400 italic"
                                                            : "text-slate-600"
                                                            }`}
                                                    >
                                                        {brandName}
                                                    </span>
                                                </td>

                                                {/* TYPE */}

                                                <td className="px-4 py-3.5">
                                                    <Badge
                                                        variant={isVariant ? "info" : "default"}
                                                        size="xs"
                                                    >
                                                        {isVariant ? "Variant" : "Loose"}
                                                    </Badge>
                                                </td>

                                                {/* COST */}

                                                {isOwner && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-600">
                                                        {formatPriceRange(costPrice, formatCurrency)}
                                                    </td>
                                                )}

                                                {/* SELLING */}

                                                <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-slate-800">
                                                    {formatPriceRange(price, formatCurrency)}
                                                </td>

                                                {/* GST */}

                                                <td className="px-4 py-3.5">
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                                        {product.gstRate ?? 0}%
                                                    </span>
                                                </td>

                                                {/* STOCK */}

                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-xs font-bold text-slate-800">
                                                            {displayedStock} {product.unit || "pcs"}
                                                        </span>

                                                        {isVariant ? (
                                                            <Badge
                                                                variant={parentStockStatus.variant}
                                                                size="xs"
                                                            >
                                                                {parentStockStatus.label}
                                                            </Badge>
                                                        ) : isProductOutOfStock(product) ? (
                                                            <Badge variant="danger" size="xs">
                                                                Out of stock
                                                            </Badge>
                                                        ) : isProductLowStock(product) ? (
                                                            <Badge variant="warning" size="xs">
                                                                Low stock
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="success" size="xs">
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
                                                                {!isVariant && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onAdjustStock?.(product)}
                                                                        className="rounded-lg p-2 text-slate-500 hover:bg-orange-100 hover:text-orange-600"
                                                                        title="Adjust stock"
                                                                    >
                                                                        <Sliders size={15} />
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => onViewHistory?.(product)}
                                                                    className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                                                                    title="History"
                                                                >
                                                                    <History size={15} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => onEdit?.(product)}
                                                                    className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={15} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => onDelete?.(product)}
                                                                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                                    title="Hide product"
                                                                    aria-label={`Hide product ${productName}`}
                                                                >
                                                                    <EyeOff size={15} />
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

                                            {/* ==================================
                                                VARIANT ROWS
                                            ================================== */}

                                            {isVariant && isExpanded && (
                                                <tr className="bg-slate-50/70">
                                                    <td colSpan={isOwner ? 8 : 7} className="px-4 py-3">
                                                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                                            <table className="w-full min-w-[750px] text-left text-xs">
                                                                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                                                                    <tr>
                                                                        <th className="px-3 py-3">Variant</th>

                                                                        <th className="px-3 py-3">SKU / Barcode</th>

                                                                        {isOwner && (
                                                                            <th className="px-3 py-3">Cost</th>
                                                                        )}

                                                                        <th className="px-3 py-3">Selling</th>

                                                                        <th className="px-3 py-3">GST</th>

                                                                        <th className="px-3 py-3">Stock</th>

                                                                        <th className="px-3 py-3">Status</th>

                                                                        {isOwner && (
                                                                            <th className="px-3 py-3 text-right">
                                                                                Actions
                                                                            </th>
                                                                        )}
                                                                    </tr>
                                                                </thead>

                                                                <tbody className="divide-y divide-slate-100">
                                                                    {variants.map((variant, index) => {
                                                                        const variantName = getVariantName(variant);

                                                                        const status = getVariantStatus(variant);

                                                                        const variantStock =
                                                                            getVariantStock(variant);

                                                                        return (
                                                                            <tr key={getVariantId(variant) || index}>
                                                                                <td className="px-3 py-3 font-semibold text-slate-700">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Tag
                                                                                            size={13}
                                                                                            className="text-orange-500"
                                                                                        />

                                                                                        {variantName}
                                                                                    </div>
                                                                                </td>

                                                                                <td className="px-3 py-3 text-slate-500">
                                                                                    {variant.sku ||
                                                                                        variant.SKU ||
                                                                                        variant.barcode ||
                                                                                        variant.barCode ||
                                                                                        "—"}
                                                                                </td>

                                                                                {isOwner && (
                                                                                    <td className="whitespace-nowrap px-3 py-3">
                                                                                        {formatPriceRange(
                                                                                            getProductCostPrice(variant),
                                                                                            formatCurrency,
                                                                                        )}
                                                                                    </td>
                                                                                )}

                                                                                <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-700">
                                                                                    {formatPriceRange(
                                                                                        getProductPrice(variant),
                                                                                        formatCurrency,
                                                                                    )}
                                                                                </td>

                                                                                <td className="px-3 py-3">
                                                                                    {variant.gstRate ??
                                                                                        product.gstRate ??
                                                                                        0}
                                                                                    %
                                                                                </td>

                                                                                <td className="px-3 py-3 font-bold text-slate-700">
                                                                                    {variantStock} {variant.unit || product.unit || "pcs"}
                                                                                </td>

                                                                                <td className="px-3 py-3">
                                                                                    <Badge
                                                                                        variant={status.variant}
                                                                                        size="xs"
                                                                                    >
                                                                                        {status.label}
                                                                                    </Badge>
                                                                                </td>

                                                                                {/* VARIANT ACTION: STOCK ADJUSTMENT ONLY */}

                                                                                {isOwner && (
                                                                                    <td className="px-3 py-3">
                                                                                        <div className="flex justify-end gap-1">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    onAdjustVariantStock?.(
                                                                                                        product,
                                                                                                        variant,
                                                                                                    )
                                                                                                }
                                                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100 hover:text-orange-600"
                                                                                                title="Adjust variant stock"
                                                                                                aria-label={`Adjust stock for ${variantName}`}
                                                                                            >
                                                                                                <Sliders size={14} />
                                                                                            </button>
                                                                                            {onHideVariant && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        onHideVariant(
                                                                                                            product,
                                                                                                            variant,
                                                                                                        )
                                                                                                    }
                                                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                                                                    title="Hide variant"
                                                                                                    aria-label={`Hide variant ${variantName}`}
                                                                                                >
                                                                                                    <EyeOff size={14} />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                )}
                                                                            </tr>
                                                                        );
                                                                    })}

                                                                    {/* VARIANT TOTAL */}

                                                                    <tr className="border-t-2 border-orange-100 bg-orange-50/50">
                                                                        <td
                                                                            colSpan={isOwner ? 5 : 4}
                                                                            className="px-3 py-3 text-right font-bold text-slate-700"
                                                                        >
                                                                            Total Variant Stock
                                                                        </td>

                                                                        <td className="px-3 py-3 font-bold text-orange-700">
                                                                            {totalVariantStock}{" "}
                                                                            {product.unit || "pcs"}
                                                                        </td>

                                                                        <td
                                                                            colSpan={isOwner ? 2 : 1}
                                                                            className="px-3 py-3"
                                                                        />
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}
            </section>

            {/* RIGHT-CLICK CONTEXT MENU (CATEGORY & MAIN PRODUCT) */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    role="menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="fixed z-[200] w-48 overflow-hidden rounded-xl border border-orange-100 bg-white p-1.5 shadow-xl"
                >
                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
                            {contextMenu.type === "category" ? "Category" : "Main Product"}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-800">
                            {contextMenu.name}
                        </p>
                    </div>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            const target = contextMenu;
                            setContextMenu(null);
                            if (target.type === "category") {
                                onEditCategory?.(target);
                            } else {
                                onEditMainProduct?.(target);
                            }
                        }}
                        className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-orange-50 hover:text-orange-700"
                    >
                        <Edit2 size={14} className="text-slate-400" />
                        Edit Name
                    </button>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            const target = contextMenu;
                            setContextMenu(null);
                            if (target.type === "category") {
                                onDeleteCategory?.(target);
                            } else {
                                onDeleteMainProduct?.(target);
                            }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            const target = contextMenu;
                            setContextMenu(null);
                            if (target.type === "category") {
                                onHideCategory?.(target);
                            } else {
                                onHideMainProduct?.(target);
                            }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                    >
                        <EyeOff size={14} />
                        Hide
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductTable;
