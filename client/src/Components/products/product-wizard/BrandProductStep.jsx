import React, {
    useMemo,
    useState,
    useEffect,
    useRef,
} from "react";

import {
    Search,
    Plus,
    Check,
    Package,
    ArrowLeft,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
    Loader2,
} from "lucide-react";

import CreateBrandProductModal from "./CreateBrandProductModal";
import productService from "../../../services/productService";

const getId = (item) => {
    const id = item?._id || item?.id || "";
    return id ? String(id) : "";
};

const BrandProductStep = ({
    brandProducts = [],
    selectedBrandProductId,
    mainProductId,
    onSelect,
    onBrandProductCreated,
    onBrandProductUpdated,
    onBrandProductDeleted,
    onBack,
}) => {
    const [search, setSearch] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBrandProduct, setEditingBrandProduct] = useState(null);

    const [contextMenu, setContextMenu] = useState(null);

    const [deletingBrandProduct, setDeletingBrandProduct] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const menuRef = useRef(null);
    const deleteLockRef = useRef(false);

    // -----------------------------------------
    // SEARCH
    // -----------------------------------------

    const filteredProducts = useMemo(() => {
        const query = search.toLowerCase();

        return brandProducts.filter((item) =>
            `${item.brandName || ""} ${item.name || ""}`
                .toLowerCase()
                .includes(query)
        );
    }, [brandProducts, search]);

    // -----------------------------------------
    // CLOSE CONTEXT MENU
    // -----------------------------------------

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setContextMenu(null);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setContextMenu(null);
            }
        };

        const handleScroll = () => {
            setContextMenu(null);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, []);

    // -----------------------------------------
    // RIGHT CLICK CONTEXT MENU
    // -----------------------------------------

    const handleContextMenu = (event, item) => {
        event.preventDefault();
        event.stopPropagation();

        const menuWidth = 180;
        const menuHeight = 105;

        const x = Math.min(
            event.clientX,
            window.innerWidth - menuWidth - 10
        );

        const y = Math.min(
            event.clientY,
            window.innerHeight - menuHeight - 10
        );

        setContextMenu({
            x: Math.max(10, x),
            y: Math.max(10, y),
            item,
        });
    };

    // -----------------------------------------
    // EDIT BRAND PRODUCT
    // -----------------------------------------

    const handleEdit = () => {
        if (!contextMenu?.item) return;

        setEditingBrandProduct(contextMenu.item);
        setContextMenu(null);
    };

    const handleBrandProductUpdated = (updatedProduct) => {
    if (!updatedProduct || !getId(updatedProduct)) return;

    const productId = getId(updatedProduct);

    // Find existing product from current list
    const existingProduct = brandProducts.find(
        (item) => getId(item) === productId
    );

    // Merge updated data while preserving existing image
    const mergedProduct = {
        ...existingProduct,
        ...updatedProduct,

        _id: productId,

        image:
            updatedProduct.image ||
            existingProduct?.image ||
            "",

        brandName:
            updatedProduct.brandName ??
            existingProduct?.brandName ??
            "Unbranded",

        name:
            updatedProduct.name ??
            existingProduct?.name ??
            "",
    };

    // Send merged product to parent
    onBrandProductUpdated?.(mergedProduct);

    setEditingBrandProduct(null);
};

    // -----------------------------------------
    // OPEN DELETE CONFIRMATION
    // -----------------------------------------

    const handleDeleteClick = () => {
        if (!contextMenu?.item) return;

        setDeletingBrandProduct(contextMenu.item);
        setDeleteError("");
        setContextMenu(null);
    };

    // -----------------------------------------
    // DELETE BRAND PRODUCT
    // -----------------------------------------

    const handleDeleteConfirm = async () => {
        const productId = getId(deletingBrandProduct);

        if (!productId || deleteLockRef.current) return;

        try {
            deleteLockRef.current = true;

            setDeleteLoading(true);
            setDeleteError("");

            await productService.deleteBrandProduct(productId);

            onBrandProductDeleted?.(productId);

            setDeletingBrandProduct(null);
        } catch (error) {
            console.error("Delete Brand Product Error:", error);

            setDeleteError(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Unable to delete brand product. Please try again."
            );
        } finally {
            deleteLockRef.current = false;
            setDeleteLoading(false);
        }
    };

    // -----------------------------------------
    // SELECT PRODUCT
    // -----------------------------------------

    const handleSelect = (item) => {
        setContextMenu(null);
        onSelect?.(item);
    };

    // -----------------------------------------
    // CREATE PRODUCT CALLBACK
    // -----------------------------------------

    const handleCreated = (product) => {
        setShowCreateModal(false);
        onBrandProductCreated?.(product);
    };

    // -----------------------------------------
    // RENDER
    // -----------------------------------------

    return (
        <div className="space-y-5">

            {/* HEADER */}

            <div>
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-3 flex items-center gap-2 text-sm text-slate-500 transition hover:text-orange-600"
                >
                    <ArrowLeft size={16} />
                    Change Main Product
                </button>

                <h3 className="text-lg font-semibold text-slate-800">
                    Select Brand Product
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Select an existing brand product or create a new one.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                    Right-click a product for more actions.
                </p>
            </div>

            {/* SEARCH AND CREATE */}

            <div className="flex flex-col gap-3 sm:flex-row">

                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        placeholder="Search brand or product..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600"
                >
                    <Plus size={17} />
                    Create Brand Product
                </button>

            </div>

            {/* BRAND PRODUCT GRID */}

            {filteredProducts.length > 0 ? (

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

                    {filteredProducts.map((item) => {
                        const selected =
                            String(selectedBrandProductId) === getId(item);

                        return (
                            <button
                                key={getId(item)}
                                type="button"
                                onClick={() => handleSelect(item)}
                                onContextMenu={(event) =>
                                    handleContextMenu(event, item)
                                }
                                className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${selected
                                        ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                                        : "border-slate-200 hover:border-orange-300 hover:shadow-md"
                                    }`}
                            >
                                {/* IMAGE */}
                                <div className="flex h-36 w-full items-center justify-center bg-slate-50">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-contain p-3"
                                        />
                                    ) : (
                                        <Package
                                            size={40}
                                            className="text-slate-300"
                                        />
                                    )}
                                </div>

                                {/* BRAND AND PRODUCT NAME */}
                                <div className="flex min-h-[76px] w-full flex-col justify-center p-3">
                                    <p className="truncate text-xs font-medium text-orange-600">
                                        {item.brandName || "Unbranded"}
                                    </p>

                                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
                                        {item.name}
                                    </p>
                                </div>

                                {/* SELECTED ICON */}
                                {selected && (
                                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                                        <Check size={14} />
                                    </span>
                                )}

                                {/* CONTEXT MENU HINT */}
                                <span className="absolute bottom-2 right-2 hidden text-[10px] text-slate-400 group-hover:block">
                                    Right-click
                                </span>
                            </button>
                        );
                    })}

                </div>

            ) : (

                /* EMPTY STATE */

                <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">

                    <Package
                        size={35}
                        className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                        No brand products found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Create a new brand product to continue.
                    </p>

                </div>

            )}

            {/* CONTEXT MENU */}

            {contextMenu && (
                <div
                    ref={menuRef}
                    style={{
                        position: "fixed",
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 9999,
                    }}
                    className="w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                >

                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="truncate text-xs font-semibold text-slate-500">
                            {contextMenu.item.brandName || "Unbranded"} ·{" "}
                            {contextMenu.item.name}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleEdit}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"
                    >
                        <Pencil size={15} />
                        Edit Product
                    </button>

                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                        <Trash2 size={15} />
                        Delete Product
                    </button>

                </div>
            )}

            {/* CREATE / EDIT MODAL */}

            <CreateBrandProductModal
                isOpen={showCreateModal || Boolean(editingBrandProduct)}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingBrandProduct(null);
                }}
                mainProductId={mainProductId}
                brandProduct={editingBrandProduct}
                onCreated={handleCreated}
                onUpdated={handleBrandProductUpdated}
            />

            {/* DELETE CONFIRMATION MODAL */}

            {deletingBrandProduct && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">

                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >

                        {/* HEADER */}

                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                    <AlertTriangle size={20} />
                                </div>

                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">
                                        Delete Brand Product
                                    </h3>

                                    <p className="text-xs text-slate-500">
                                        Confirm your action
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={() => {
                                    setDeletingBrandProduct(null);
                                    setDeleteError("");
                                }}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={19} />
                            </button>

                        </div>

                        {/* BODY */}

                        <div className="space-y-3 p-5">

                            <p className="text-sm leading-relaxed text-slate-600">
                                Are you sure you want to delete{" "}
                                <span className="font-semibold text-slate-900">
                                    {deletingBrandProduct.brandName || "Unbranded"}{" "}
                                    {deletingBrandProduct.name}
                                </span>
                                ?
                            </p>

                            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                                <p className="text-xs leading-relaxed text-red-700">
                                    This action cannot be undone. Make sure
                                    this brand product is not being used in
                                    existing inventory or bills before deleting it.
                                </p>
                            </div>

                            {deleteError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                    {deleteError}
                                </div>
                            )}

                        </div>

                        {/* FOOTER */}

                        <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">

                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={() => {
                                    setDeletingBrandProduct(null);
                                    setDeleteError("");
                                }}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={handleDeleteConfirm}
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleteLoading ? (
                                    <>
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={15} />
                                        Delete
                                    </>
                                )}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default BrandProductStep;