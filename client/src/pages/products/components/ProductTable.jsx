import React, { useEffect, useMemo, useState } from "react";

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
} from "lucide-react";

import Badge from "../../../Components/common/Badge";
import EmptyState from "../../../Components/common/EmptyState";

import {
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
    product?.variants ||
    product?.variantDetails ||
    product?.productVariants ||
    [];

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

    search,
    categoryId,
    lowStockOnly,
}) => {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [selectedMainProduct, setSelectedMainProduct] = useState(null);
    const [expandedProducts, setExpandedProducts] = useState({});

    /* ----------------------------------
         BUILD CATEGORY HIERARCHY
      ---------------------------------- */

    const categoryGroups = useMemo(() => {
        const categoryMap = new Map();
        products.forEach((product) => {
            const categoryName = getCategoryName(product) || "Uncategorized";

            const mainProductName = getMainProductName(product) || "Other Products";

            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                    name: categoryName,
                    mainProducts: new Map(),
                });
            }

            const category = categoryMap.get(categoryName);

            if (!category.mainProducts.has(mainProductName)) {
                category.mainProducts.set(mainProductName, {
                    name: mainProductName,
                    products: [],
                });
            }

            category.mainProducts.get(mainProductName).products.push(product);
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
            setSelectedMainProduct(null);
            return;
        }

        const allMainProducts = categoryGroups.flatMap(
            (category) => category.mainProducts,
        );

        const selectedExists = allMainProducts.some(
            (item) => item.name === selectedMainProduct,
        );

        if (!selectedExists) {
            setSelectedMainProduct(allMainProducts[0]?.name || null);
        }

        setExpandedCategories((previous) => {
            const updated = { ...previous };
            categoryGroups.forEach((category, index) => {
                if (updated[category.name] === undefined) {
                    updated[category.name] = index === 0;
                }
            });

            return updated;
        });
    }, [categoryGroups, selectedMainProduct]);

    /* ----------------------------------
         SELECTED PRODUCTS
      ---------------------------------- */

    const selectedProducts = useMemo(() => {
        const category = categoryGroups.find((item) =>
            item.mainProducts.some((main) => main.name === selectedMainProduct),
        );

        if (!category) return [];

        const mainProduct = category.mainProducts.find(
            (item) => item.name === selectedMainProduct,
        );

        return mainProduct?.products || [];
    }, [categoryGroups, selectedMainProduct]);

    /* ----------------------------------
         HANDLERS
      ---------------------------------- */

    const toggleCategory = (categoryName) => {
        setExpandedCategories((previous) => ({
            ...previous,
            [categoryName]: !previous[categoryName],
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
                            expandedCategories[category.name],
                        );

                        const categoryHasSelection = category.mainProducts.some(
                            (item) => item.name === selectedMainProduct,
                        );

                        return (
                            <div key={category.name} className="mb-1">
                                {/* CATEGORY */}

                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category.name)}
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition ${categoryHasSelection
                                        ? "bg-orange-50 text-orange-700"
                                        : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="flex min-w-0 items-center gap-2">
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
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                            {category.mainProductCount}
                                        </span>

                                        {isCategoryExpanded ? (
                                            <ChevronDown size={15} />
                                        ) : (
                                            <ChevronRight size={15} />
                                        )}
                                    </div>
                                </button>

                                {/* MAIN PRODUCTS */}

                                {isCategoryExpanded && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                                        {category.mainProducts.map((mainProduct) => {
                                            const isSelected =
                                                selectedMainProduct === mainProduct.name;

                                            return (
                                                <button
                                                    key={mainProduct.name}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedMainProduct(mainProduct.name)
                                                    }
                                                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition ${isSelected
                                                        ? "bg-orange-500 text-white shadow-sm"
                                                        : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                                                        }`}
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
                                {selectedMainProduct || "Products"}
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
                    <div className="overflow-x-auto">
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
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={15} />
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
                                                                                        <div className="flex justify-end">
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
                )}
            </section>
        </div>
    );
};

export default ProductTable;
