import express from "express";
import {createBill, getBills, getBillingBills, getBillingBillById, getBillById, refundBill, downloadBillingBillPDF, downloadBillPDF, downloadBillingThermalBillPDF, downloadThermalBillPDF} from "../controllers/bill.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import billingAuthMiddleware from "../middleware/billingAuth.middleware.js";
import flexAuthMiddleware from "../middleware/flexAuth.middleware.js";

const router = express.Router();

router.post(
    "/",
    flexAuthMiddleware,
    createBill
);

router.get(
    "/",
    authMiddleware,
    getBills
);

router.patch(
    "/:id/refund",
    authMiddleware,
    refundBill
);

router.get(
    "/:id/pdf",
    authMiddleware,
    downloadBillPDF
);

router.get(
    "/:id/thermal",
    authMiddleware,
    downloadThermalBillPDF
);

router.get(
    "/:id",
    authMiddleware,
    getBillById
);

router.get(
    "/billing",
    billingAuthMiddleware,
    getBillingBills
);

router.get(
    "/billing/:id/pdf",
    billingAuthMiddleware,
    downloadBillingBillPDF
);

router.get(
    "/billing/:id/thermal",
    billingAuthMiddleware,
    downloadBillingThermalBillPDF
);

router.get(
    "/billing/:id",
    billingAuthMiddleware,
    getBillingBillById
);

export default router;
