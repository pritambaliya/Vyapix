import mongoose from "mongoose";
import BrandProduct from "../../models/ProductModel/brandProduct.model.js";
import MainProduct from "../../models/ProductModel/mainProduct.model.js";
import cloudinary from "../../config/clodanary.js";
import uploadToCloudinary from "../../utils/uploadToCloudinary.js";
import { generateUniqueSlug, attachDeterministicSlugs } from "../../utils/slugify.js";

const getOwnerId = (req) => req.owner?._id || req.user?._id;

export const createBrandProduct = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { mainProductId, brandName, name } = req.body;

        if (!mainProductId || !name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Main product and brand product name are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(mainProductId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid main product ID"
            });
        }

        const mainProduct = await MainProduct.findOne({
            _id: mainProductId,
            isActive: true,
            $or: [
                { ownerId: null },
                { ownerId }
            ]
        });

        if (!mainProduct) {
            return res.status(404).json({
                success: false,
                message: "Main product not found"
            });
        }

        let imageUrl = "";

        if (req.file) {
            try {
                const result = await uploadToCloudinary(
                    req.file.buffer,
                    "vyapix/brand-products"
                );

                imageUrl = result.secure_url;

                console.log("Brand Product Image Uploaded:", imageUrl);

            } catch (uploadError) {
                console.error("Brand Product Image Upload Error:", uploadError);

                return res.status(502).json({
                    success: false,
                    message: "Image upload failed. Please try again.",
                    error: uploadError.message
                });
            }
        }

        const slug = await generateUniqueSlug(BrandProduct, name.trim(), {
            mainProductId,
            isActive: true,
            $or: [{ ownerId: null }, { ownerId }],
        });

        const brandProduct = await BrandProduct.create({
            mainProductId,
            brandName: brandName?.trim() || "Unbranded",
            name: name.trim(),
            slug,
            image: imageUrl,
            ownerId
        });

        return res.status(201).json({
            success: true,
            message: "Brand product created successfully",
            brandProduct
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This brand product already exists"
            });
        }

        console.error("Create Brand Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create brand product"
        });
    }
};

export const getBrandProducts = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { mainProductId } = req.query;

        const filter = {
            isActive: true,
            $or: [
                { ownerId: null },
                { ownerId }
            ]
        };

        if (mainProductId) {
            if (!mongoose.Types.ObjectId.isValid(mainProductId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid main product ID"
                });
            }

            filter.mainProductId = mainProductId;
        }

        const brandProducts = await BrandProduct.find(filter)
            .populate("mainProductId", "name categoryId")
            .sort({ name: 1 });

        const enrichedBrandProducts = attachDeterministicSlugs(brandProducts);

        return res.status(200).json({
            success: true,
            count: enrichedBrandProducts.length,
            brandProducts: enrichedBrandProducts
        });

    } catch (error) {
        console.error("Get Brand Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch brand products"
        });
    }
};

export const getBrandProductById = async (req, res) => {
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
                message: "Invalid brand product ID"
            });
        }

        const brandProduct = await BrandProduct.findOne({
            _id: id,
            isActive: true,
            $or: [
                { ownerId: null },
                { ownerId }
            ]
        }).populate("mainProductId", "name categoryId");

        if (!brandProduct) {
            return res.status(404).json({
                success: false,
                message: "Brand product not found"
            });
        }

        return res.status(200).json({
            success: true,
            brandProduct
        });

    } catch (error) {
        console.error("Get Brand Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch brand product"
        });
    }
};

export const updateBrandProduct = async (req, res) => {
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
                message: "Invalid brand product ID"
            });
        }

        const brandProduct = await BrandProduct.findOne({
            _id: id,
            ownerId
        });

        if (!brandProduct) {
            return res.status(404).json({
                success: false,
                message: "Custom brand product not found"
            });
        }

        const { mainProductId, brandName, name } = req.body;

        // Validate new main product if supplied
        if (mainProductId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(mainProductId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid main product ID"
                });
            }

            const mainProduct = await MainProduct.findOne({
                _id: mainProductId,
                isActive: true,
                $or: [
                    { ownerId: null },
                    { ownerId }
                ]
            });

            if (!mainProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Main product not found"
                });
            }

            brandProduct.mainProductId = mainProductId;
        }

        // Update product name
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Brand product name cannot be empty"
                });
            }

            brandProduct.name = name.trim();
        }

        // Update brand name
        if (brandName !== undefined) {
            brandProduct.brandName = brandName.trim() || "Unbranded";
        }

        // Upload new image to Cloudinary
        if (req.file) {
            try {
                const result = await uploadToCloudinary(
                    req.file.buffer,
                    "vyapix/brand-products"
                );

                brandProduct.image = result.secure_url;

                console.log(
                    "Brand Product Image Updated:",
                    result.secure_url
                );

            } catch (uploadError) {
                console.error(
                    "Brand Product Image Upload Error:",
                    uploadError
                );

                return res.status(502).json({
                    success: false,
                    message: "Image upload failed. Please try again.",
                    error: uploadError.message
                });
            }
        }

        brandProduct.slug = await generateUniqueSlug(
            BrandProduct,
            brandProduct.name,
            {
                mainProductId: brandProduct.mainProductId,
                isActive: true,
                $or: [{ ownerId: null }, { ownerId }],
            },
            brandProduct._id
        );

        await brandProduct.save();

        return res.status(200).json({
            success: true,
            message: "Brand product updated successfully",
            brandProduct
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This brand product already exists"
            });
        }

        console.error("Update Brand Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update brand product"
        });
    }
};

