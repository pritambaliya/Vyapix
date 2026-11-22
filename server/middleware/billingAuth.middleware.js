import jwt from "jsonwebtoken";
import BillingAccount from "../models/billingAccount.model.js";

const billingAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.billingToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Billing authentication required",
            });
        }

        const decoded = jwt.verify(token, process.env.BILLING_JWT_SECRET);

        const account = await BillingAccount.findById(
            decoded.billingAccountId
        ).select("-passwordHash");

        if (!account) {
            return res.status(401).json({
                success: false,
                message: "Billing account not found",
            });
        }

        if (account.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "This billing account has been disabled",
            });
        }

        req.billingAccount = account;
        req.user = { id: account._id, role: "cashier" };

        next();
    } catch (error) {
        console.error("Billing Auth Middleware Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired billing authentication",
        });
    }
};

export default billingAuthMiddleware;

