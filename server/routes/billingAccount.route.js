import express from "express";
import { createBillingAccount, loginBillingAccount, getBillingProfile, updateBillingAccountStatus } from "../controllers/billingAccount.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import billingMiddleware from "../middleware/billing.middleware.js";

const router = express.Router();

router.post(
    "/register",
    authMiddleware,
    createBillingAccount
);

router.post(
    "/login",
    loginBillingAccount
);

router.get(
    "/me",
    billingMiddleware,
    getBillingProfile
);

router.patch(
    "/:id/status",
    billingMiddleware,
    updateBillingAccountStatus
);

export default router;