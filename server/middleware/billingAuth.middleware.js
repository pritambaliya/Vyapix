import jwt from "jsonwebtoken";
import BillingAccount from "../models/billingAccount.model.js";

/**
 * Middleware that authenticates a cashier / billing-account request.
 * Reads the `billingToken` HttpOnly cookie, verifies it with BILLING_JWT_SECRET,
 * and populates:
 *   req.billingAccount  — the full BillingAccount document (passwordHash excluded)
 *   req.user            — { id, role: "cashier" }  (compatible with authorize())
 */
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
        // Populate req.user so authorize() can check roles uniformly
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

