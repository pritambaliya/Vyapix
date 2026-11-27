import mongoose from "mongoose";
import MainProduct from "../../models/ProductModel/mainProduct.model.js";
import Category from "../../models/ProductModel/category.model.js";
import cloudinary from "../../config/clodanary.js";
import uploadToCloudinary from "../../utils/uploadToCloudinary.js";

const getOwnerId = (req) => req.owner?._id || req.user?._id;

export const createMainProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { categoryId, name } = req.body;

        if (!categoryId || !name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category and main product name are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        // Verify category belongs to global catalogue or current owner
        const category = await Category.findOne({
            _id: categoryId,
            isActive: true,
            $or: [
                { ownerId: null },
                { ownerId }
            ]
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Upload image to Cloudinary
        let imageUrl = "";

        if (req.file) {
            try {
                const result = await uploadToCloudinary(
                    req.file.buffer,
                    "vyapix/main-products"
                );

                imageUrl = result.secure_url;

                console.log("Main Product Image Uploaded:", imageUrl);

            } catch (uploadError) {
                console.error("Main Product Image Upload Error:", uploadError);

                return res.status(502).json({
                    success: false,
                    message: "Image upload failed. Please try again.",
                    error: uploadError.message
                });
            }
        }

        // Create Main Product
        const mainProduct = await MainProduct.create({
            categoryId,
            name: name.trim(),
            image: imageUrl,
            ownerId
        });

        return res.status(201).json({
            success: true,
            message: "Main product created successfully",
            mainProduct
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Main product already exists in this category"
            });
        }

        console.error("Create Main Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create main product"
        });
    }
};

export const getMainProducts = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { search, categoryId } = req.query;

        const filter = {
            isActive: true,
            $or: [
                { ownerId: null },
                { ownerId }
            ]
        };

        // Search by main product name
        if (search?.trim()) {
            filter.name = {
                $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i"
            };
        }

        // Filter by category
        if (categoryId) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID"
                });
            }

            filter.categoryId = categoryId;
        }

        const mainProducts = await MainProduct.find(filter)
            .populate("categoryId", "name")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: mainProducts.length,
            mainProducts
        });

    } catch (error) {
        console.error("Get Main Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch main products"
        });
    }
};

export const getMainProductById = async (req, res) => {
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
                message: "Invalid main product ID"
            });
        }

        const mainProduct = await MainProduct.findOne({
            _id: id,
            isActive: true,
            $or: [
                { ownerId: null },
                { ownerId }
            ]
        }).populate("categoryId", "name");

        if (!mainProduct) {
            return res.status(404).json({
                success: false,
                message: "Main product not found"
            });
        }

        return res.status(200).json({
            success: true,
            mainProduct
        });

    } catch (error) {
        console.error("Get Main Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch main product"
        });
    }
};

export const updateMainProduct = async (req, res) => {
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
                message: "Invalid main product ID"
            });
        }

        // Only owner-created products can be updated
        const mainProduct = await MainProduct.findOne({
            _id: id,
            ownerId
        });

        if (!mainProduct) {
            return res.status(404).json({
                success: false,
                message: "Custom main product not found"
            });
        }

        const { categoryId, name } = req.body;

        // Update category if supplied
        if (categoryId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID"
                });
            }

            const category = await Category.findOne({
                _id: categoryId,
                isActive: true,
                $or: [
                    { ownerId: null },
                    { ownerId }
                ]
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }

            mainProduct.categoryId = categoryId;
        }

        // Update product name
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Main product name cannot be empty"
                });
            }

            mainProduct.name = name.trim();
        }

        // Upload new image to Cloudinary
        if (req.file) {
            try {
                const result = await uploadToCloudinary(
                    req.file.buffer,
                    "vyapix/main-products"
                );

                mainProduct.image = result.secure_url;

                console.log(
                    "Main Product Image Updated:",
                    result.secure_url
                );

            } catch (uploadError) {
                console.error(
                    "Main Product Image Upload Error:",
                    uploadError
                );

                return res.status(502).json({
                    success: false,
                    message: "Image upload failed. Please try again.",
                    error: uploadError.message
                });
            }
        }

        await mainProduct.save();

        return res.status(200).json({
            success: true,
            message: "Main product updated successfully",
            mainProduct
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Main product already exists in this category"
            });
        }

        console.error("Update Main Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update main product"
        });
    }
};