import React, { useEffect, useState } from "react";
import {
    ImagePlus,
    X,
    Plus,
    Pencil,
    Loader2,
} from "lucide-react";

import productService from "../../../services/productService";

const getId = (item) => item?._id || item?.id || "";

const CreateMainProductModal = ({
    isOpen,
    onClose,
    categoryId,
    mainProduct = null,
    onCreated,
    onUpdated,
}) => {
    const isEdit = Boolean(mainProduct);

    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // -----------------------------------------
    // INITIALIZE FORM
    // -----------------------------------------

    useEffect(() => {
        if (!isOpen) return;

        if (mainProduct) {
            setName(mainProduct.name || "");
            setImage(null);
            setPreview(mainProduct.image || "");
        } else {
            setName("");
            setImage(null);
            setPreview("");
        }

        setError("");
    }, [isOpen, mainProduct]);

    // -----------------------------------------
    // CLEANUP PREVIEW URL
    // -----------------------------------------

    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // -----------------------------------------
    // IMAGE CHANGE
    // -----------------------------------------

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image.");
            e.target.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError("Image size must be less than 2MB.");
            e.target.value = "";
            return;
        }

        setImage(file);
        setPreview(URL.createObjectURL(file));
        setError("");
    };

    // -----------------------------------------
    // RESET FORM
    // -----------------------------------------

    const resetForm = () => {
        setName("");
        setImage(null);
        setPreview("");
        setError("");
    };

    // -----------------------------------------
    // CLOSE MODAL
    // -----------------------------------------

    const handleClose = () => {
        if (loading) return;

        resetForm();
        onClose?.();
    };

    // -----------------------------------------
    // SUBMIT
    // -----------------------------------------

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (loading) return;

        const productName = name.trim();

        if (!productName) {
            setError("Main product name is required.");
            return;
        }

        if (!isEdit && !categoryId) {
            setError("Please select a category first.");
            return;
        }

        const productId = getId(mainProduct);

        if (isEdit && !productId) {
            setError("Main product ID is missing.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const formData = new FormData();

            formData.append("name", productName);

            if (!isEdit) {
                formData.append("categoryId", categoryId);
            }

            // Only upload when a new image is selected.
            if (image) {
                formData.append("image", image);
            }

            let response;

            if (isEdit) {
                response = await productService.updateMainProduct(
                    productId,
                    formData
                );
            } else {
                response = await productService.createMainProduct(
                    formData
                );
            }

            const updatedProduct =
                response?.mainProduct ||
                response?.data?.mainProduct ||
                response?.data?.data?.mainProduct ||
                response?.data;

            const result = updatedProduct || {
                ...mainProduct,
                name: productName,
            };

            if (!getId(result)) {
                console.log("Main Product API Response:", response);

                throw new Error(
                    "Main product details were not returned."
                );
            }

            if (isEdit) {
                onUpdated?.(result);
            } else {
                onCreated?.(result);
            }

            resetForm();
            onClose?.();

        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                `Failed to ${isEdit ? "update" : "create"} main product.`
            );
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------
    // ENTER KEY
    // -----------------------------------------

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();

            if (!loading) {
                handleSubmit(e);
            }
        }
    };

    if (!isOpen) return null;

    // -----------------------------------------
    // UI
    // -----------------------------------------

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >

            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
            >

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-slate-100 p-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            {isEdit ? (
                                <Pencil size={19} />
                            ) : (
                                <Plus size={20} />
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                                {isEdit
                                    ? "Edit Main Product"
                                    : "Create Main Product"}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {isEdit
                                    ? "Update main product information."
                                    : "Add a product under the selected category."}
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>

                </div>

                {/* CONTENT */}

                <div
                    className="space-y-5 p-5"
                    onKeyDown={handleKeyDown}
                >

                    {/* PRODUCT NAME */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Product Name
                            <span className="ml-1 text-red-500">*</span>
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError("");
                            }}
                            placeholder="e.g. Tea, Rice, Sugar"
                            disabled={loading}
                            autoComplete="off"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                        />
                    </div>

                    {/* PRODUCT IMAGE */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Product Image
                        </label>

                        <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition ${
                            loading
                                ? "cursor-not-allowed border-slate-200 bg-slate-50"
                                : "border-slate-200 hover:border-orange-400 hover:bg-orange-50/30"
                        }`}>

                            {preview ? (
                                <div className="relative">

                                    <img
                                        src={preview}
                                        alt="Product Preview"
                                        className="h-28 w-28 rounded-xl border border-slate-200 bg-white object-contain p-2"
                                    />

                                    {!loading && (
                                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow">
                                            <Pencil size={12} />
                                        </span>
                                    )}

                                </div>
                            ) : (
                                <>
                                    <ImagePlus
                                        size={30}
                                        className="text-slate-400"
                                    />

                                    <span className="mt-2 text-sm text-slate-500">
                                        Upload product image
                                    </span>
                                </>
                            )}

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleImageChange}
                                disabled={loading}
                                className="hidden"
                            />

                        </label>

                        <p className="mt-2 text-xs text-slate-400">
                            JPG, PNG, WEBP or GIF. Maximum 2MB.
                        </p>

                        {isEdit && (
                            <p className="mt-1 text-xs text-slate-500">
                                Leave the existing image unchanged or select
                                a new image to replace it.
                            </p>
                        )}

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
                            <p className="text-sm text-red-600">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* ACTIONS */}

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    {isEdit ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                <>
                                    {isEdit ? (
                                        <Pencil size={16} />
                                    ) : (
                                        <Plus size={16} />
                                    )}

                                    {isEdit
                                        ? "Update Product"
                                        : "Create Product"}
                                </>
                            )}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default CreateMainProductModal;