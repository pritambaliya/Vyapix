import jwt from "jsonwebtoken";
import BillingAccount from "../models/billingAccount.model.js";

const billingMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.billingToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Billing authentication required",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.BILLING_JWT_SECRET
        );

        if (decoded.role !== "billing") {
            return res.status(403).json({
                success: false,
                message: "Invalid billing access",
            });
        }

        const billingAccount =
            await BillingAccount.findById(
                decoded.billingAccountId
            ).select("-passwordHash");

        if (!billingAccount) {
            return res.status(401).json({
                success: false,
                message: "Billing account not found",
            });
        }

        if (billingAccount.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Billing account is disabled",
            });
        }

        billingAccount.lastSeenAt = new Date();
        await billingAccount.save();

        req.billingAccount = billingAccount;

        next();
    } catch (error) {
        console.error(
            "Billing Middleware Error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired billing session",
        });
    }
};

export default billingMiddleware;