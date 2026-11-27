import mongoose from "mongoose";
import Category from "../../models/ProductModel/category.model.js";
import MainProduct from "../../models/ProductModel/mainProduct.model.js";
import BrandProduct from "../../models/ProductModel/brandProduct.model.js";
import Product from "../../models/ProductModel/product.model.js";

const getOwnerId = (req) => req.owner?._id || req.user?._id;

export const createCategory = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const categoryName = name.trim();

        // Check duplicate category for this owner
        const existingCategory = await Category.findOne({
            name: { $regex: `^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            ownerId
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name: categoryName,
            ownerId
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        console.error("Create Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create category"
        });
    }
};

export const getCategories = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const categories = await Category.find({
            isActive: true,
            $or: [
                { ownerId: null },
                { ownerId }
            ]
        }).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });

    } catch (error) {
        console.error("Get Categories Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
};

export const getCategoriesbyId = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const category = await Category.findOne({
            _id: id,
            ownerId
        });

         return res.status(200).json({
            success: true,
            category
        });


    } catch (error) {
        console.error("Get Categories Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch category"
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;
        const { name } = req.body;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        // Only owner-created categories can be updated
        const category = await Category.findOne({
            _id: id,
            ownerId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Custom category not found"
            });
        }

        const categoryName = name.trim();

        const duplicate = await Category.findOne({
            _id: { $ne: id },
            ownerId,
            name: { $regex: `^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Category name already exists"
            });
        }

        category.name = categoryName;

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Category name already exists"
            });
        }

        console.error("Update Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update category"
        });
    }
};
