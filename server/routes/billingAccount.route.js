import express from "express";
import { createBillingAccount, loginBillingAccount, getBillingProfile, updateBillingAccountStatus, getBillingAccountActivity, resetBillingPassword } from "../controllers/billingAccount.controller.js";
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
    authMiddleware,
    updateBillingAccountStatus
);

router.get(
    "/:id/activity",
    authMiddleware,
    getBillingAccountActivity
);

router.patch(
    "/:id/reset-password",
    authMiddleware,
    resetBillingPassword
);

export default router;