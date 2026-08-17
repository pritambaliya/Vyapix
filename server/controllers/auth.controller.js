import bcrypt from "bcryptjs";
import validator from "validator";
import Owner from "../models/owner.model.js";
import Shop from "../models/shop.model.js";
import generateToken from "../utils/generateToken.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

export const registerOwner = async (req, res) => {
    try {
        const {name, email, phone, password, shopName, shopPhone, address, gstNumber} = req.body;

        if (!name || !email || !phone || !password || !shopName || !shopPhone || !address) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const existingOwner = await Owner.findOne({
            email: email.toLowerCase(),
        });

        if (existingOwner) {
            return res.status(409).json({
                success: false,
                message: "Owner with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const owner = await Owner.create({
            name,
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
        });

        let logo = {
            url: null,
            publicId: null,
            source: "generated",
        };

        const logoFile = req.files?.logo?.[0];

        if (logoFile) {
            const result = await uploadToCloudinary(
                logoFile.buffer,
                "vyapix/logo"
            );

            logo = {
                url: result.secure_url,
                publicId: result.public_id,
                source: "upload",
            };
        }

        const shop = await Shop.create({
            ownerId: owner._id,
            shopName,
            phone: shopPhone,
            address,
            gstNumber,
            logo
        });

        return res.status(201).json({
            success: true,
            message: "Owner and shop created successfully",
            data: {
                owner: {
                    id: owner._id,
                    name: owner.name,
                    email: owner.email,
                    phone: owner.phone,
                },
                shop: {
                    id: shop._id,
                    shopName: shop.shopName,
                    phone: shop.phone,
                    address: shop.address,
                    gstNumber: shop.gstNumber,
                    logo: {
                        url: req.files?.idProof?.[0]?.path,
                        public_id: req.files?.idProof?.[0]?.filename
                    },
                },
            },
        });
    } catch (error) {
        console.error("Register Owner Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating account",
        });
    }
};

export const loginOwner = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const owner = await Owner.findOne({
            email: email.toLowerCase(),
        });

        if (!owner) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            owner.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(owner._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Owner login successful",
            data: {
                owner: {
                    id: owner._id,
                    name: owner.name,
                    email: owner.email,
                    phone: owner.phone,
                },
            },
        });

    } catch (error) {
        console.error("Owner Login Error:", error.stack);

        return res.status(500).json({
            success: false,
            message: "Server error while logging in",
        });
    }
};

export const getOwnerProfile = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: {
                owner: req.owner,
            },
        });
    } catch (error) {
        console.error("Get Owner Profile Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
        });

        res.clearCookie("billingToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while logging out",
        });
    }
};