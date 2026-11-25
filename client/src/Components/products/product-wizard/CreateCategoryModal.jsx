import React, { useEffect, useState } from "react";
import { Plus, X, Pencil } from "lucide-react";

import Input from "../../common/Input";
import Button from "../../common/Button";
import productService from "../../../services/productService";

const CreateCategoryModal = ({
    isOpen,
    onClose,
    onCreated,
    onUpdated,
    category = null,
}) => {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isEditMode = Boolean(category);

    useEffect(() => {
        if (isOpen) {
            setName(category?.name || "");
            setError("");
        }
    }, [isOpen, category]);

    const handleClose = () => {
        if (loading) return;

        setName("");
        setError("");
        onClose();
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();

        const categoryName = name.trim();

        if (!categoryName) {
            setError("Category name is required.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload = { name: categoryName };

            if (isEditMode) {
                const categoryId = category?._id || category?.id;

                if (!categoryId) {
                    throw new Error("Category ID is missing.");
                }

                const response = await productService.updateCategory(
                    categoryId,
                    payload
                );

                const updatedCategory =
                    response?.category ||
                    response?.data?.category ||
                    response?.data?.data?.category ||
                    response?.data ||
                    { ...category, ...payload };

                onUpdated?.({
                    ...category,
                    ...updatedCategory,
                    _id: updatedCategory?._id || categoryId,
                    name: updatedCategory?.name || categoryName,
                });
            } else {
                const response =
                    await productService.createCategory(payload);

                const createdCategory =
                    response?.category ||
                    response?.data?.category ||
                    response?.data?.data?.category ||
                    response?.data;

                if (!createdCategory?._id && !createdCategory?.id) {
                    console.log("Category API Response:", response);
                    throw new Error(
                        "Category was created but its details were not returned."
                    );
                }

                onCreated?.(createdCategory);
            }

            setName("");
            onClose();

        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                `Failed to ${isEditMode ? "update" : "create"} category.`
            );
        } finally {
            setLoading(false);
        }
    };

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5">

                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            {isEditMode ? "Edit Category" : "Create Category"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            {isEditMode
                                ? "Update your category details."
                                : "Add a new category to your catalogue."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>

                </div>

                {/* Content - No nested form */}
                <div
                    className="space-y-5 p-5"
                    onKeyDown={handleKeyDown}
                >

                    <Input
                        label="Category Name"
                        placeholder="e.g. Grocery, Electronics"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError("");
                        }}
                        error={error}
                        required
                    />

                    <div className="flex justify-end gap-3">

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            loading={loading}
                            disabled={loading}
                            onClick={handleSubmit}
                        >
                            {isEditMode ? (
                                <Pencil className="mr-2 h-4 w-4" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}

                            {isEditMode ? "Update Category" : "Create Category"}
                        </Button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default CreateCategoryModal;