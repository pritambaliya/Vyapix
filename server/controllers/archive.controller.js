import mongoose from "mongoose";

import Category from "../models/ProductModel/category.model.js";
import MainProduct from "../models/ProductModel/mainProduct.model.js";
import BrandProduct from "../models/ProductModel/brandProduct.model.js";
import Product from "../models/ProductModel/product.model.js";


// ======================================================
// HELPERS
// ======================================================

// Change this helper if your authMiddleware attaches
// the owner to a different property.
const getOwnerId = (req) => {
    return (
        req.owner?._id ||
        req.owner?.id ||
        req.user?._id ||
        req.user?.id ||
        null
    );
};


const sendError = (res, error, message = "Something went wrong") => {
    console.error(message, error);

    return res.status(500).json({
        success: false,
        message,
    });
};


const isValidId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};


const getIdParam = (req) => {
    return req.params.id;
};


// ======================================================
// 1. ARCHIVE CATEGORY
// ======================================================

export const archiveCategory = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category = await Category.findOne({
            _id: id,
            ownerId,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (!category.isActive) {
            return res.status(400).json({
                success: false,
                message: "Category is already archived",
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                // Archive category
                category.isActive = false;
                category.deactivatedBy = "SELF";
                category.deactivatedAt = new Date();

                await category.save({ session });


                // Find all main products
                const mainProducts = await MainProduct.find({
                    categoryId: category._id,
                    ownerId,
                    isActive: true,
                }).session(session);

                const mainProductIds = mainProducts.map(
                    (item) => item._id
                );


                // Archive active main products
                await MainProduct.updateMany(
                    {
                        _id: { $in: mainProductIds },
                        ownerId,
                        isActive: true,
                    },
                    {
                        $set: {
                            isActive: false,
                            deactivatedBy: "CATEGORY",
                            deactivatedAt: new Date(),
                        },
                    },
                    { session }
                );


                // Find all brand products under this category
                const brandProducts = await BrandProduct.find({
                    ownerId,
                    isActive: true,
                    mainProductId: { $in: mainProductIds },
                }).session(session);

                const brandProductIds = brandProducts.map(
                    (item) => item._id
                );


                // Archive active brand products
                await BrandProduct.updateMany(
                    {
                        _id: { $in: brandProductIds },
                        ownerId,
                        isActive: true,
                    },
                    {
                        $set: {
                            isActive: false,
                            deactivatedBy: "CATEGORY",
                            deactivatedAt: new Date(),
                        },
                    },
                    { session }
                );


                // Archive active inventory products
                await Product.updateMany(
                    {
                        ownerId,
                        isActive: true,
                        categoryId: category._id,
                    },
                    {
                        $set: {
                            isActive: false,
                            deactivatedBy: "CATEGORY",
                            deactivatedAt: new Date(),
                        },
                    },
                    { session }
                );

            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: "Category and its active related items archived successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to archive category");
    }
};


// ======================================================
// 2. ARCHIVE MAIN PRODUCT
// ======================================================

export const archiveMainProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid main product ID",
            });
        }

        const mainProduct = await MainProduct.findOne({
            _id: id,
            ownerId,
        });

        if (!mainProduct) {
            return res.status(404).json({
                success: false,
                message: "Main product not found",
            });
        }

        if (!mainProduct.isActive) {
            return res.status(400).json({
                success: false,
                message: "Main product is already archived",
            });
        }

        const category = await Category.findOne({
            _id: mainProduct.categoryId,
            isActive: true,
            $or: [{ ownerId: null }, { ownerId }],
        });

        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Cannot archive an item under an inactive category",
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                // Archive main product
                mainProduct.isActive = false;
                mainProduct.deactivatedBy = "SELF";
                mainProduct.deactivatedAt = new Date();

                await mainProduct.save({ session });


                // Find active brand products
                const brandProducts = await BrandProduct.find({
                    mainProductId: mainProduct._id,
                    ownerId,
                    isActive: true,
                }).session(session);

                const brandProductIds = brandProducts.map(
                    (item) => item._id
                );


                // Archive brand products
                await BrandProduct.updateMany(
                    {
                        _id: { $in: brandProductIds },
                        ownerId,
                        isActive: true,
                    },
                    {
                        $set: {
                            isActive: false,
                            deactivatedBy: "MAIN_PRODUCT",
                            deactivatedAt: new Date(),
                        },
                    },
                    { session }
                );


                // Archive inventory products
                await Product.updateMany(
                    {
                        ownerId,
                        mainProductId: mainProduct._id,
                        isActive: true,
                    },
                    {
                        $set: {
                            isActive: false,
                            deactivatedBy: "MAIN_PRODUCT",
                            deactivatedAt: new Date(),
                        },
                    },
                    { session }
                );

            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: "Main product and its active related items archived successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to archive main product");
    }
};


// ======================================================
// 3. ARCHIVE BRAND PRODUCT
// ======================================================

export const archiveBrandProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand product ID",
            });
        }

        const brandProduct = await BrandProduct.findOne({
            _id: id,
            ownerId,
        });

        if (!brandProduct) {
            return res.status(404).json({
                success: false,
                message: "Brand product not found",
            });
        }

        if (!brandProduct.isActive) {
            return res.status(400).json({
                success: false,
                message: "Brand product is already archived",
            });
        }

        const mainProduct = await MainProduct.findOne({
            _id: brandProduct.mainProductId,
            isActive: true,
            $or: [{ ownerId: null }, { ownerId }],
        });

        if (!mainProduct) {
            return res.status(400).json({
                success: false,
                message: "Cannot archive an item under an inactive main product",
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                // Archive brand product
                brandProduct.isActive = false;
                brandProduct.deactivatedBy = "SELF";
                brandProduct.deactivatedAt = new Date();

                await brandProduct.save({ session });


                // Archive related inventory products
                await Product.updateMany(
                    {
                        ownerId,
                        brandProductId: brandProduct._id,
                        isActive: true,
                    },
                    {
                        $set: {
                            isActive: false,
                            deactivatedBy: "BRAND_PRODUCT",
                            deactivatedAt: new Date(),
                        },
                    },
                    { session }
                );

            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: "Brand product and its active inventory items archived successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to archive brand product");
    }
};


// ======================================================
// 4. ARCHIVE PRODUCT
// ======================================================

export const archiveProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product = await Product.findOne({
            _id: id,
            ownerId,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (!product.isActive) {
            return res.status(400).json({
                success: false,
                message: "Product is already archived",
            });
        }

        // Verify that all parents are active
        const [category, mainProduct, brandProduct] = await Promise.all([
            Category.findOne({
                _id: product.categoryId,
                ownerId,
                isActive: true,
            }),

            MainProduct.findOne({
                _id: product.mainProductId,
                ownerId,
                isActive: true,
            }),

            BrandProduct.findOne({
                _id: product.brandProductId,
                ownerId,
                isActive: true,
            }),
        ]);

        if (!category || !mainProduct || !brandProduct) {
            return res.status(400).json({
                success: false,
                message: "Cannot archive a product under an inactive parent item",
            });
        }

        product.isActive = false;
        product.deactivatedBy = "SELF";
        product.deactivatedAt = new Date();

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product archived successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to archive product");
    }
};


// ======================================================
// 5. RESTORE CATEGORY
// ======================================================

export const restoreCategory = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category = await Category.findOne({
            _id: id,
            ownerId,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (category.isActive) {
            return res.status(400).json({
                success: false,
                message: "Category is already active",
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                // Restore category
                category.isActive = true;
                category.deactivatedBy = null;
                category.deactivatedAt = null;

                await category.save({ session });


                // Find main products under this category (to scope brand product restore)
                const categoryMainProducts = await MainProduct.find({
                    categoryId: category._id,
                    $or: [{ ownerId: null }, { ownerId }],
                })
                    .select("_id")
                    .session(session);
                const categoryMainProductIds = categoryMainProducts.map(
                    (item) => item._id
                );

                // Restore only main products archived by this category
                await MainProduct.updateMany(
                    {
                        categoryId: category._id,
                        ownerId,
                        isActive: false,
                        deactivatedBy: "CATEGORY",
                    },
                    {
                        $set: {
                            isActive: true,
                            deactivatedBy: null,
                            deactivatedAt: null,
                        },
                    },
                    { session }
                );


                // Restore only brand products archived by this category
                await BrandProduct.updateMany(
                    {
                        ownerId,
                        mainProductId: { $in: categoryMainProductIds },
                        isActive: false,
                        deactivatedBy: "CATEGORY",
                    },
                    {
                        $set: {
                            isActive: true,
                            deactivatedBy: null,
                            deactivatedAt: null,
                        },
                    },
                    { session }
                );


                // Restore only inventory products archived by this category
                await Product.updateMany(
                    {
                        ownerId,
                        categoryId: category._id,
                        isActive: false,
                        deactivatedBy: "CATEGORY",
                    },
                    {
                        $set: {
                            isActive: true,
                            deactivatedBy: null,
                            deactivatedAt: null,
                        },
                    },
                    { session }
                );

            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: "Category and its archived descendants restored successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to restore category");
    }
};


// ======================================================
// 6. RESTORE MAIN PRODUCT
// ======================================================

export const restoreMainProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid main product ID",
            });
        }

        const mainProduct = await MainProduct.findOne({
            _id: id,
            ownerId,
        });

        if (!mainProduct) {
            return res.status(404).json({
                success: false,
                message: "Main product not found",
            });
        }

        if (mainProduct.isActive) {
            return res.status(400).json({
                success: false,
                message: "Main product is already active",
            });
        }

        if (mainProduct.deactivatedBy !== "SELF") {
            return res.status(400).json({
                success: false,
                message: "Restore the parent category to restore this main product",
            });
        }

        const category = await Category.findOne({
            _id: mainProduct.categoryId,
            isActive: true,
            $or: [{ ownerId: null }, { ownerId }],
        });

        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Restore the parent category first",
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                // Restore main product
                mainProduct.isActive = true;
                mainProduct.deactivatedBy = null;
                mainProduct.deactivatedAt = null;

                await mainProduct.save({ session });


                // Find child brand products archived by this main product
                const brandProducts = await BrandProduct.find({
                    mainProductId: mainProduct._id,
                    ownerId,
                    isActive: false,
                    deactivatedBy: "MAIN_PRODUCT",
                }).session(session);

                const brandProductIds = brandProducts.map(
                    (item) => item._id
                );


                // Restore those brand products
                await BrandProduct.updateMany(
                    {
                        _id: { $in: brandProductIds },
                        ownerId,
                        isActive: false,
                        deactivatedBy: "MAIN_PRODUCT",
                    },
                    {
                        $set: {
                            isActive: true,
                            deactivatedBy: null,
                            deactivatedAt: null,
                        },
                    },
                    { session }
                );


                // Restore products archived by this main product
                await Product.updateMany(
                    {
                        ownerId,
                        mainProductId: mainProduct._id,
                        isActive: false,
                        deactivatedBy: "MAIN_PRODUCT",
                    },
                    {
                        $set: {
                            isActive: true,
                            deactivatedBy: null,
                            deactivatedAt: null,
                        },
                    },
                    { session }
                );

            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: "Main product and its archived descendants restored successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to restore main product");
    }
};


// ======================================================
// 7. RESTORE BRAND PRODUCT
// ======================================================

export const restoreBrandProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand product ID",
            });
        }

        const brandProduct = await BrandProduct.findOne({
            _id: id,
            ownerId,
        });

        if (!brandProduct) {
            return res.status(404).json({
                success: false,
                message: "Brand product not found",
            });
        }

        if (brandProduct.isActive) {
            return res.status(400).json({
                success: false,
                message: "Brand product is already active",
            });
        }

        if (brandProduct.deactivatedBy !== "SELF") {
            return res.status(400).json({
                success: false,
                message: "Restore the parent main product to restore this brand product",
            });
        }

        const mainProduct = await MainProduct.findOne({
            _id: brandProduct.mainProductId,
            isActive: true,
            $or: [{ ownerId: null }, { ownerId }],
        });

        if (!mainProduct) {
            return res.status(400).json({
                success: false,
                message: "Restore the parent main product first",
            });
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                // Restore brand product
                brandProduct.isActive = true;
                brandProduct.deactivatedBy = null;
                brandProduct.deactivatedAt = null;

                await brandProduct.save({ session });


                // Restore only products archived by this brand product
                await Product.updateMany(
                    {
                        ownerId,
                        brandProductId: brandProduct._id,
                        isActive: false,
                        deactivatedBy: "BRAND_PRODUCT",
                    },
                    {
                        $set: {
                            isActive: true,
                            deactivatedBy: null,
                            deactivatedAt: null,
                        },
                    },
                    { session }
                );

            });

        } finally {
            await session.endSession();
        }

        return res.status(200).json({
            success: true,
            message: "Brand product and its archived inventory items restored successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to restore brand product");
    }
};


// ======================================================
// 8. RESTORE PRODUCT
// ======================================================

export const restoreProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product = await Product.findOne({
            _id: id,
            ownerId,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (product.isActive) {
            return res.status(400).json({
                success: false,
                message: "Product is already active",
            });
        }

        if (product.deactivatedBy !== "SELF") {
            return res.status(400).json({
                success: false,
                message: "Restore the parent item to restore this product",
            });
        }

        // Verify all parent records are active
        const [category, mainProduct, brandProduct] = await Promise.all([
            Category.findOne({
                _id: product.categoryId,
                isActive: true,
                $or: [{ ownerId: null }, { ownerId }],
            }),

            MainProduct.findOne({
                _id: product.mainProductId,
                isActive: true,
                $or: [{ ownerId: null }, { ownerId }],
            }),

            BrandProduct.findOne({
                _id: product.brandProductId,
                isActive: true,
                $or: [{ ownerId: null }, { ownerId }],
            }),
        ]);

        if (!category || !mainProduct || !brandProduct) {
            return res.status(400).json({
                success: false,
                message: "Restore all parent items first",
            });
        }

        product.isActive = true;
        product.deactivatedBy = null;
        product.deactivatedAt = null;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product restored successfully",
        });

    } catch (error) {
        return sendError(res, error, "Failed to restore product");
    }
};


// ======================================================
// 9. PERMANENT DELETE CATEGORY
// ======================================================

export const permanentDeleteCategory = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category = await Category.findOne({
            _id: id,
            ownerId,
        }).session(session);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        await session.withTransaction(async () => {

            const mainProducts = await MainProduct.find({
                categoryId: category._id,
                ownerId,
            }).select("_id").session(session);

            const mainProductIds = mainProducts.map(
                (item) => item._id
            );

            const brandProducts = await BrandProduct.find({
                mainProductId: { $in: mainProductIds },
                ownerId,
            }).select("_id").session(session);

            const brandProductIds = brandProducts.map(
                (item) => item._id
            );


            // Delete inventory products
            await Product.deleteMany(
                {
                    ownerId,
                    categoryId: category._id,
                },
                { session }
            );


            // Delete brand products
            await BrandProduct.deleteMany(
                {
                    _id: { $in: brandProductIds },
                    ownerId,
                },
                { session }
            );


            // Delete main products
            await MainProduct.deleteMany(
                {
                    _id: { $in: mainProductIds },
                    ownerId,
                },
                { session }
            );


            // Delete category
            await Category.deleteOne(
                {
                    _id: category._id,
                    ownerId,
                },
                { session }
            );

        });

        return res.status(200).json({
            success: true,
            message: "Category and all its catalogue and inventory products permanently deleted",
        });

    } catch (error) {
        return sendError(res, error, "Failed to permanently delete category");
    } finally {
        await session.endSession();
    }
};


// ======================================================
// 10. PERMANENT DELETE MAIN PRODUCT
// ======================================================

export const permanentDeleteMainProduct = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid main product ID",
            });
        }

        const mainProduct = await MainProduct.findOne({
            _id: id,
            ownerId,
        }).session(session);

        if (!mainProduct) {
            return res.status(404).json({
                success: false,
                message: "Main product not found",
            });
        }

        await session.withTransaction(async () => {

            const brandProducts = await BrandProduct.find({
                mainProductId: mainProduct._id,
                ownerId,
            }).select("_id").session(session);

            const brandProductIds = brandProducts.map(
                (item) => item._id
            );


            // Delete inventory products
            await Product.deleteMany(
                {
                    ownerId,
                    mainProductId: mainProduct._id,
                },
                { session }
            );


            // Delete brand products
            await BrandProduct.deleteMany(
                {
                    _id: { $in: brandProductIds },
                    ownerId,
                },
                { session }
            );


            // Delete main product
            await MainProduct.deleteOne(
                {
                    _id: mainProduct._id,
                    ownerId,
                },
                { session }
            );

        });

        return res.status(200).json({
            success: true,
            message: "Main product and all its related items permanently deleted",
        });

    } catch (error) {
        return sendError(res, error, "Failed to permanently delete main product");
    } finally {
        await session.endSession();
    }
};


// ======================================================
// 11. PERMANENT DELETE BRAND PRODUCT
// ======================================================

export const permanentDeleteBrandProduct = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand product ID",
            });
        }

        const brandProduct = await BrandProduct.findOne({
            _id: id,
            ownerId,
        }).session(session);

        if (!brandProduct) {
            return res.status(404).json({
                success: false,
                message: "Brand product not found",
            });
        }

        await session.withTransaction(async () => {

            // Delete related inventory products
            await Product.deleteMany(
                {
                    ownerId,
                    brandProductId: brandProduct._id,
                },
                { session }
            );


            // Delete brand product
            await BrandProduct.deleteOne(
                {
                    _id: brandProduct._id,
                    ownerId,
                },
                { session }
            );

        });

        return res.status(200).json({
            success: true,
            message: "Brand product and its inventory items permanently deleted",
        });

    } catch (error) {
        return sendError(res, error, "Failed to permanently delete brand product");
    } finally {
        await session.endSession();
    }
};


// ======================================================
// 12. PERMANENT DELETE PRODUCT
// ======================================================

export const permanentDeleteProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product = await Product.findOne({
            _id: id,
            ownerId,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        await Product.deleteOne({
            _id: product._id,
            ownerId,
        });

        return res.status(200).json({
            success: true,
            message: "Product permanently deleted",
        });

    } catch (error) {
        return sendError(res, error, "Failed to permanently delete product");
    }
};


// ======================================================
// 13. GET ARCHIVED ITEMS (ALL LEVELS)
// ======================================================

export const getArchivedItems = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const [
            categories,
            mainProducts,
            brandProducts,
            products,
            productsWithArchivedVariants,
        ] = await Promise.all([
            Category.find({ ownerId, isActive: false }).sort({
                deactivatedAt: -1,
                updatedAt: -1,
            }),
            MainProduct.find({ ownerId, isActive: false })
                .populate("categoryId", "name isActive")
                .sort({ deactivatedAt: -1, updatedAt: -1 }),
            BrandProduct.find({ ownerId, isActive: false })
                .populate({
                    path: "mainProductId",
                    select: "name categoryId isActive",
                    populate: {
                        path: "categoryId",
                        select: "name isActive",
                    },
                })
                .sort({ deactivatedAt: -1, updatedAt: -1 }),
            Product.find({ ownerId, isActive: false })
                .populate("categoryId", "name isActive")
                .populate("mainProductId", "name isActive")
                .populate("brandProductId", "name brandName isActive")
                .sort({ deactivatedAt: -1, updatedAt: -1 }),
            Product.find({
                ownerId,
                sellingType: "VARIANT",
                "variants.isActive": false,
            })
                .populate("categoryId", "name isActive")
                .populate("mainProductId", "name isActive")
                .populate("brandProductId", "name brandName isActive"),
        ]);

        const variants = [];
        for (const prod of productsWithArchivedVariants) {
            for (const v of prod.variants || []) {
                if (v.isActive === false) {
                    variants.push({
                        _id: v._id,
                        productId: prod._id,
                        productIsActive: prod.isActive,
                        productName: prod.brandProductId?.name || "Unnamed Product",
                        brandName: prod.brandProductId?.brandName || "Unbranded",
                        categoryId: prod.categoryId,
                        mainProductId: prod.mainProductId,
                        brandProductId: prod.brandProductId,
                        variant: v,
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                categories,
                mainProducts,
                brandProducts,
                products,
                variants,
            },
        });
    } catch (error) {
        return sendError(res, error, "Failed to fetch archived items");
    }
};


// ======================================================
// 14. ARCHIVE / RESTORE / PERMANENT DELETE VARIANT
// ======================================================

export const archiveVariant = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { productId, variantId } = req.params;

        if (!ownerId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!isValidId(productId) || !isValidId(variantId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or variant ID",
            });
        }

        const product = await Product.findOne({
            _id: productId,
            ownerId,
            sellingType: "VARIANT",
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (!product.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot archive a variant under an inactive product",
            });
        }

        const variant = product.variants.id(variantId);

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Variant not found",
            });
        }

        if (variant.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "Variant is already archived",
            });
        }

        variant.isActive = false;
        variant.deactivatedBy = "SELF";
        variant.deactivatedAt = new Date();

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Variant archived successfully",
        });
    } catch (error) {
        return sendError(res, error, "Failed to archive variant");
    }
};


export const restoreVariant = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { productId, variantId } = req.params;

        if (!ownerId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!isValidId(productId) || !isValidId(variantId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or variant ID",
            });
        }

        const product = await Product.findOne({
            _id: productId,
            ownerId,
            sellingType: "VARIANT",
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (!product.isActive) {
            return res.status(400).json({
                success: false,
                message: "Restore the parent product first",
            });
        }

        const variant = product.variants.id(variantId);

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Variant not found",
            });
        }

        if (variant.isActive !== false) {
            return res.status(400).json({
                success: false,
                message: "Variant is already active",
            });
        }

        variant.isActive = true;
        variant.deactivatedBy = null;
        variant.deactivatedAt = null;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Variant restored successfully",
        });
    } catch (error) {
        return sendError(res, error, "Failed to restore variant");
    }
};


export const permanentDeleteVariant = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const { productId, variantId } = req.params;

        if (!ownerId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!isValidId(productId) || !isValidId(variantId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or variant ID",
            });
        }

        const product = await Product.findOne({
            _id: productId,
            ownerId,
            sellingType: "VARIANT",
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const variant = product.variants.id(variantId);

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Variant not found",
            });
        }

        product.variants.pull(variantId);
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Variant permanently deleted",
        });
    } catch (error) {
        return sendError(res, error, "Failed to permanently delete variant");
    }
};