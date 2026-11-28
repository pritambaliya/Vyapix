import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    Plus,
    Check,
    FolderOpen,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
    Loader2,
} from "lucide-react";

import CreateCategoryModal from "./CreateCategoryModal";
import productService from "../../../services/productService";
import { useToast } from "../../../context/ToastContext";

const getId = (item) => {
    const id = item?._id || item?.id || "";
    return id ? String(id) : "";
};

const CategoryStep = ({
    categories = [],
    selectedCategoryId,
    loading = false,
    onSelect,
    onDoubleClick,
    onCategoryCreated,
    onCategoryUpdated,
    onCategoryDeleted,
}) => {
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [contextMenu, setContextMenu] = useState(null);

    const [deletingCategory, setDeletingCategory] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const menuRef = useRef(null);

    const filteredCategories = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();

        if (!searchTerm) return categories;

        return categories.filter((category) =>
            category.name?.toLowerCase().includes(searchTerm)
        );
    }, [categories, search]);

    // Close context menu on outside click, Escape or scroll.
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

    const handleContextMenu = (event, category) => {
        event.preventDefault();
        event.stopPropagation();

        const menuWidth = 180;
        const menuHeight = 110;

        const x = Math.min(
            event.clientX,
            window.innerWidth - menuWidth - 8
        );

        const y = Math.min(
            event.clientY,
            window.innerHeight - menuHeight - 8
        );

        setContextMenu({
            x: Math.max(8, x),
            y: Math.max(8, y),
            category,
        });
    };

    const handleEdit = () => {
        if (!contextMenu?.category) return;

        setEditingCategory(contextMenu.category);
        setContextMenu(null);
    };

    const handleDeleteRequest = () => {
        if (!contextMenu?.category) return;

        setDeletingCategory(contextMenu.category);
        setDeleteError("");
        setContextMenu(null);
    };

    const handleDeleteConfirm = async () => {
        const categoryId = getId(deletingCategory);

        if (!categoryId) {
            setDeleteError("Category ID is missing.");
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteError("");

            await productService.deleteCategory(categoryId);

            onCategoryDeleted?.(categoryId);

            setDeletingCategory(null);
            success("Category deleted successfully.");

        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to delete category.";
            setDeleteError(msg);
            showError(msg);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCategoryCreated = (category) => {
        if (!category || !getId(category)) return;

        setSearch("");
        onCategoryCreated?.(category);
        setShowCreateModal(false);
    };

    const handleCategoryUpdated = (category) => {
        if (!category || !getId(category)) return;

        onCategoryUpdated?.(category);
        setEditingCategory(null);
    };

    return (
        <div className="space-y-5">

            {/* HEADER */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800">
                    Select Category
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Choose a category for your product or create a new one.
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
                        placeholder="Search categories..."
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
                    Create Category
                </button>

            </div>

            {/* CATEGORY LIST */}
            {loading ? (
                <div className="flex min-h-[200px] w-full items-center justify-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
                        <p className="text-sm text-slate-500">
                            Loading categories...
                        </p>
                    </div>
                </div>
            ) : filteredCategories.length > 0 ? (

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                    {filteredCategories.map((category) => {
                        const categoryId = getId(category);

                        const selected =
                            String(selectedCategoryId || "") === categoryId;

                        return (
                            <button
                                key={categoryId}
                                type="button"
                                onClick={() => onSelect?.(category)}
                                onDoubleClick={() => onDoubleClick?.(category)}
                                onContextMenu={(e) =>
                                    handleContextMenu(e, category)
                                }
                                className={`relative flex min-h-24 flex-col items-start justify-center rounded-xl border p-4 text-left transition ${
                                    selected
                                        ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                                        : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
                                }`}
                            >
                                <FolderOpen
                                    size={22}
                                    className={
                                        selected
                                            ? "text-orange-500"
                                            : "text-slate-400"
                                    }
                                />

                                <span className="mt-3 text-sm font-semibold text-slate-800">
                                    {category.name}
                                </span>

                                {selected && (
                                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                                        <Check size={13} />
                                    </span>
                                )}
                            </button>
                        );
                    })}

                </div>

            ) : (

                <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">

                    <FolderOpen
                        size={35}
                        className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                        No categories found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Try another search or create a new category.
                    </p>

                </div>

            )}

            {/* RIGHT-CLICK MENU */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    className="fixed z-[200] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y,
                    }}
                    role="menu"
                >
                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="truncate text-xs font-semibold text-slate-500">
                            {contextMenu.category.name}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleEdit}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                        role="menuitem"
                    >
                        <Pencil size={15} />
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={handleDeleteRequest}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                        role="menuitem"
                    >
                        <Trash2 size={15} />
                        Delete
                    </button>
                </div>
            )}

            {/* CREATE CATEGORY */}
            <CreateCategoryModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleCategoryCreated}
            />

            {/* EDIT CATEGORY */}
            <CreateCategoryModal
                isOpen={Boolean(editingCategory)}
                onClose={() => setEditingCategory(null)}
                category={editingCategory}
                onUpdated={handleCategoryUpdated}
            />

            {/* DELETE CONFIRMATION */}
            {deletingCategory && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-slate-900">
                            Delete Category?
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-800">
                                "{deletingCategory.name}"
                            </span>
                            ? This action cannot be undone.
                        </p>

                        {deleteError && (
                            <p className="mt-3 text-sm text-red-600">
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={() => {
                                    if (!deleteLoading) {
                                        setDeletingCategory(null);
                                        setDeleteError("");
                                    }
                                }}
                                disabled={deleteLoading}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleteLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}

                                {deleteLoading ? "Deleting..." : "Delete Category"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default CategoryStep;