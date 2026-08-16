import bcrypt from "bcryptjs";
import Owner from "../models/owner.model.js";
import Shop from "../models/shop.model.js";
import BillingAccount from "../models/billingAccount.model.js";
import BillingActivity from "../models/billingActivity.model.js";
import { generateBillingCode } from "../utils/billingCode.js";
import { generateAccountNumber } from "../utils/accountNumber.js";
import generateBillingToken from "../utils/generateBillingToken.js";


export const createBillingAccount = async (req, res) => {
    try {
        const {name, employeeName, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, billing password and owner password are required",
            });
        }

        const owner = await Owner.findById(req.owner._id);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Owner not found",
            });
        }


        const shop = await Shop.findOne({
            ownerId: owner._id,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                success: false,
                message:
                    "Billing password must be at least 4 characters",
            });
        }

        const accountNumber = await generateAccountNumber(
            shop._id
        );

        let billingCode = generateBillingCode();

        while (
            await BillingAccount.exists({
                billingCode,
            })
        ) {
            billingCode = generateBillingCode();
        }

        const passwordHash = await bcrypt.hash(
            password,
            10
        );

        const billingAccount =
            await BillingAccount.create({
                ownerId: owner._id,
                shopId: shop._id,

                accountNumber,
                billingCode,

                name: name.trim(),
                employeeName:
                    employeeName?.trim() || null,

                passwordHash,

                status: "active",

                permissions: {
                    billing: true,
                    viewProducts: true,
                    viewStock: true,
                    viewCustomers: true,
                },
            });

        await BillingActivity.create({
            ownerId: owner._id,
            shopId: shop._id,
            billingAccountId:
                billingAccount._id,

            type: "account_created",

            description:
                `Billing account ${billingAccount.accountNumber} created`,
        });

        return res.status(201).json({
            success: true,
            message:
                "Billing account created successfully",

            data: {
                billingAccount: {
                    id: billingAccount._id,

                    accountNumber:
                        billingAccount.accountNumber,

                    billingCode:
                        billingAccount.billingCode,

                    name: billingAccount.name,

                    employeeName:
                        billingAccount.employeeName,

                    status:
                        billingAccount.status,

                    permissions:
                        billingAccount.permissions,
                },
            },
        });
    } catch (error) {
        console.error(
            "Create Billing Account Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while creating billing account",
        });
    }
};

export const loginBillingAccount = async (req, res) => {
    try {
        const { billingCode, password } = req.body;

        if (!billingCode || !password) {
            return res.status(400).json({
                success: false,
                message: "Billing code and password are required",
            });
        }

        const billingAccount = await BillingAccount.findOne({
            billingCode: billingCode.trim().toUpperCase(),
        });

        if (!billingAccount) {
            return res.status(401).json({
                success: false,
                message: "Invalid billing code or password",
            });
        }

        if (billingAccount.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "This billing account is disabled",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            billingAccount.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid billing code or password",
            });
        }

        const token = generateBillingToken(billingAccount);

        const now = new Date();

        billingAccount.lastLoginAt = now;
        billingAccount.lastSeenAt = now;

        await billingAccount.save();

        await BillingActivity.create({
            ownerId: billingAccount.ownerId,
            shopId: billingAccount.shopId,
            billingAccountId: billingAccount._id,

            type: "login",

            description: `${billingAccount.name} logged into billing`,
            
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
        });

        res.cookie("billingToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",

            maxAge: 12 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Billing login successful",

            data: {
                billingAccount: {
                    id: billingAccount._id,
                    accountNumber:
                        billingAccount.accountNumber,
                    billingCode:
                        billingAccount.billingCode,
                    name: billingAccount.name,
                    employeeName:
                        billingAccount.employeeName,
                    status:
                        billingAccount.status,
                    permissions:
                        billingAccount.permissions,
                },
            },
        });
    } catch (error) {
        console.error(
            "Billing Login Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while logging into billing",
        });
    }
};

export const getBillingProfile = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,

            data: {
                billingAccount: req.billingAccount,
            },
        });
    } catch (error) {
        console.error(
            "Get Billing Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const updateBillingAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["active", "disabled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be active or disabled",
            });
        }

        const account = await BillingAccount.findOne({
            _id: id,
            ownerId: req.owner._id,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Billing account not found",
            });
        }

        account.status = status;

        await account.save();

        const activityType =
            status === "active"
                ? "account_enabled"
                : "account_disabled";

        await BillingActivity.create({
            ownerId: req.owner._id,
            shopId: account.shopId,
            billingAccountId: account._id,

            type: activityType,

            description:
                status === "active"
                    ? `${account.name} was enabled`
                    : `${account.name} was disabled`,
        });

        return res.status(200).json({
            success: true,
            message:
                status === "active"
                    ? "Billing account enabled successfully"
                    : "Billing account disabled successfully",

            data: {
                id: account._id,
                status: account.status,
            },
        });
    } catch (error) {
        console.error(
            "Update Billing Account Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating billing account",
        });
    }
};