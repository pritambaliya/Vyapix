import React, { useEffect, useState } from "react";
import { ImagePlus, X, Plus, Save } from "lucide-react";

import productService from "../../../services/productService";

const getId = (item) => item?._id || item?.id || "";

const CreateBrandProductModal = ({
    isOpen,
    onClose,
    mainProductId,
    brandProduct = null,
    onCreated,
    onUpdated,
}) => {
    const isEdit = Boolean(brandProduct);

    const [brandName, setBrandName] = useState("");
    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Load existing data when editing
    useEffect(() => {
        if (!isOpen) return;

        if (brandProduct) {
            setBrandName(brandProduct.brandName || "");
            setName(brandProduct.name || "");
            setPreview(brandProduct.image || "");
            setImage(null);
        } else {
            setBrandName("");
            setName("");
            setPreview("");
            setImage(null);
        }

        setError("");
    }, [isOpen, brandProduct]);

    // Revoke temporary image URLs
    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Handle image selection
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

    // Reset form
    const resetForm = () => {
        setBrandName("");
        setName("");
        setImage(null);
        setPreview("");
        setError("");
    };

    // Close modal
    const handleClose = () => {
        if (loading) return;

        resetForm();
        onClose?.();
    };

    // Submit form
    const handleSubmit = async (e) => {
        e?.preventDefault();

        const productName = name.trim();
        const trimmedBrandName = brandName.trim();

        if (!productName) {
            setError("Product name is required.");
            return;
        }

        if (!isEdit && !mainProductId) {
            setError("Please select a main product first.");
            return;
        }

        const productId = getId(brandProduct);

        if (isEdit && !productId) {
            setError("Brand product ID is missing.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const formData = new FormData();

            if (!isEdit) {
                formData.append("mainProductId", mainProductId);
            }

            formData.append("brandName", trimmedBrandName);
            formData.append("name", productName);

            // Append image only when a new image is selected
            if (image instanceof File) {
                formData.append("image", image);
            }

            const response = isEdit
                ? await productService.updateBrandProduct(
                    productId,
                    formData
                )
                : await productService.createBrandProduct(formData);

            // Extract product from API response
            const result =
                response?.data?.brandProduct ||
                response?.data?.data?.brandProduct ||
                response?.data?.data ||
                response?.brandProduct ||
                response?.data ||
                response;

            if (isEdit) {
                const updatedProduct = {
                    ...brandProduct,
                    ...(result && typeof result === "object" ? result : {}),

                    _id: productId,

                    brandName: trimmedBrandName || "Unbranded",
                    name: productName,

                    // Preserve existing image when no new image is selected
                    image: image
                        ? (result?.image || brandProduct.image || "")
                        : (brandProduct.image || ""),
                };

                onUpdated?.(updatedProduct);
            } else {
                if (!result?._id && !result?.id) {
                    throw new Error(
                        "Brand product details were not returned."
                    );
                }

                onCreated?.(result);
            }

            resetForm();
            onClose?.();

        } catch (err) {
            console.error(
                `${isEdit ? "Update" : "Create"} Brand Product Error:`,
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                `Failed to ${isEdit ? "update" : "create"} brand product.`
            );
        } finally {
            setLoading(false);
        }
    };

    // Enter key handling
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();

            if (!loading) {
                handleSubmit(e);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b p-5">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            {isEdit
                                ? "Edit Brand Product"
                                : "Create Brand Product"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            {isEdit
                                ? "Update your brand-specific product details."
                                : "Add a brand-specific product."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* Content */}
                <div
                    className="space-y-5 p-5"
                    onKeyDown={handleKeyDown}
                >

                    {/* Brand Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Brand Name
                        </label>

                        <input
                            type="text"
                            value={brandName}
                            onChange={(e) => {
                                setBrandName(e.target.value);
                                setError("");
                            }}
                            placeholder="e.g. Tata, Amul, Nestle"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                        />
                    </div>

                    {/* Product Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Product Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError("");
                            }}
                            placeholder="e.g. Tata Tea Gold"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                        />
                    </div>

                    {/* Product Image */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Product Image
                        </label>

                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-5 transition hover:border-orange-400">

                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Product Preview"
                                    className="h-28 w-28 rounded-xl object-cover"
                                />
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
                                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>

                        <p className="mt-2 text-xs text-slate-400">
                            JPG, PNG, WEBP or GIF. Maximum 2MB.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
                        >
                            {isEdit ? (
                                <Save size={16} />
                            ) : (
                                <Plus size={16} />
                            )}

                            {loading
                                ? isEdit
                                    ? "Updating..."
                                    : "Creating..."
                                : isEdit
                                    ? "Update Product"
                                    : "Create Product"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBrandProductModal;