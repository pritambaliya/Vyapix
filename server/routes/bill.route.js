import express from "express";
import { createBill, getBills, getBillingBills, getBillingBillById, getBillById, refundBill, downloadBillingBillPDF, downloadBillPDF, downloadBillingThermalBillPDF, downloadThermalBillPDF } from "../controllers/bill.controller.js";
import billingMiddleware from "../middleware/billing.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/",
    billingMiddleware,
    createBill
);

router.get(
    "/",
    authMiddleware,
    getBills
);

router.get(
    "/billing",
    billingMiddleware,
    getBillingBills
);

router.get(
    "/billing/:id",
    billingMiddleware,
    getBillingBillById
);

router.get(
    "/:id",
    authMiddleware,
    getBillById
);

router.patch(
    "/:id/refund",
    authMiddleware,
    refundBill
);

router.get(
    "/billing/:id/pdf",
    billingMiddleware,
    downloadBillingBillPDF
);

router.get(
    "/:id/pdf",
    authMiddleware,
    downloadBillPDF
);

router.get(
    "/billing/:id/thermal",
    billingMiddleware,
    downloadBillingThermalBillPDF
);

router.get(
    "/:id/thermal",
    authMiddleware,
    downloadThermalBillPDF
);

export default router;