import jwt from "jsonwebtoken";
import Owner from "../models/owner.model.js";
import BillingAccount from "../models/billingAccount.model.js";

/**
 * Middleware that accepts EITHER an owner JWT (`token` cookie)
 * OR a cashier / billing-account JWT (`billingToken` cookie).
 *
 * On success it populates req.user (with role "owner" or "cashier")
 * and either req.owner or req.billingAccount — whichever matched.
 *
 * Use this on routes that must be accessible by both roles
 * (e.g. POST /api/bills).
 *
 * Owner token is tried first; billing token is the fallback.
 */
const flexAuthMiddleware = async (req, res, next) => {
    try {
        const ownerToken = req.cookies.token;
        const billingToken = req.cookies.billingToken;

        // ── Try owner auth ──────────────────────────────────────────────────
        if (ownerToken) {
            try {
                const decoded = jwt.verify(ownerToken, process.env.JWT_SECRET);

                const owner = await Owner.findById(decoded.ownerId).select(
                    "-password"
                );

                if (owner) {
                    req.owner = owner;
                    req.user = { id: owner._id, role: "owner" };
                    return next();
                }
            } catch (_) {
                // Owner token invalid — fall through to billing token
            }
        }

        // ── Try billing (cashier) auth ──────────────────────────────────────
        if (billingToken) {
            try {
                const decoded = jwt.verify(
                    billingToken,
                    process.env.BILLING_JWT_SECRET
                );

                const account = await BillingAccount.findById(
                    decoded.billingAccountId
                ).select("-passwordHash");

                if (account && account.status === "active") {
                    req.billingAccount = account;
                    req.user = { id: account._id, role: "cashier" };
                    return next();
                }
            } catch (_) {
                // Billing token invalid — fall through
            }
        }

        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    } catch (error) {
        console.error("Flex Auth Middleware Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Authentication error",
        });
    }
};

export default flexAuthMiddleware;

