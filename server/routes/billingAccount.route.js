import express from "express";

import {
    createBillingAccount,
    loginBillingAccount,
    getBillingProfile,
    updateBillingAccountStatus,
    getBillingAccountActivity,
    resetBillingPassword,
    getBillingAccounts,
    getAllBillingActivities
} from "../controllers/billingAccount.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import billingAuthMiddleware from "../middleware/billingAuth.middleware.js";
import authorize from "../middleware/authorize.middleware.js";

const router = express.Router();

router.post("/login", loginBillingAccount);

router.get(
    "/me",
    billingAuthMiddleware,
    getBillingProfile
);

router.get(
    "/",
    authMiddleware,
    authorize("owner"),
    getBillingAccounts
);

router.get(
    "/activities",
    authMiddleware,
    authorize("owner"),
    getAllBillingActivities
);

router.post(
    "/register",
    authMiddleware,
    authorize("owner"),
    createBillingAccount
);

router.patch(
    "/:id/status",
    authMiddleware,
    authorize("owner"),
    updateBillingAccountStatus
);

router.get(
    "/:id/activity",
    authMiddleware,
    authorize("owner"),
    getBillingAccountActivity
);

router.patch(
    "/:id/reset-password",
    authMiddleware,
    authorize("owner"),
    resetBillingPassword
);

export default router;
