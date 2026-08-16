import Shop from "../models/shop.model.js";
import cloudinary from "../config/clodanary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

export const getShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({
            ownerId: req.owner._id,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                shop,
            },
        });
    } catch (error) {
        console.error("Get Shop Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching shop",
        });
    }
};


export const updateShop = async (req, res) => {
    try {
        const {
            shopName,
            phone,
            address,
            gstNumber,
        } = req.body;

        const shop = await Shop.findOne({
            ownerId: req.owner._id,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        if (shopName !== undefined) {
            shop.shopName = shopName.trim();
        }

        if (phone !== undefined) {
            shop.phone = phone.trim();
        }

        if (address !== undefined) {
            shop.address = address.trim();
        }

        if (gstNumber !== undefined) {
            shop.gstNumber = gstNumber.trim();
        }

        await shop.save();

        return res.status(200).json({
            success: true,
            message: "Shop updated successfully",
            data: {
                shop,
            },
        });
    } catch (error) {
        console.error("Update Shop Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating shop",
        });
    }
};


export const updateShopLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a logo",
            });
        }

        const shop = await Shop.findOne({
            ownerId: req.owner._id,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        if (shop.logo?.publicId) {
            await cloudinary.uploader.destroy(
                shop.logo.publicId
            );
        }

        const result = await uploadToCloudinary(
            req.file.buffer,
            "vyapix/shop-logos"
        );

        shop.logo = {
            url: result.secure_url,
            publicId: result.public_id,
            source: "upload",
        };

        await shop.save();

        return res.status(200).json({
            success: true,
            message: "Shop logo updated successfully",
            data: {
                logo: shop.logo,
            },
        });
    } catch (error) {
        console.error("Update Shop Logo Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating logo",
        });
    }
};


export const deleteShopLogo = async (req, res) => {
    try {
        const shop = await Shop.findOne({
            ownerId: req.owner._id,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        if (shop.logo?.publicId) {
            await cloudinary.uploader.destroy(
                shop.logo.publicId
            );
        }

        shop.logo = {
            url: null,
            publicId: null,
            source: null,
        };

        await shop.save();

        return res.status(200).json({
            success: true,
            message: "Shop logo deleted successfully",
        });
    } catch (error) {
        console.error("Delete Shop Logo Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting logo",
        });
    }
};