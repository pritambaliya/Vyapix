import express from "express";
import {
    createBill,
    getBills,
    getBillingBills,
    getLedgerSummary,
    exportBillsCsv,
    getBillingBillById,
    getBillById,
    refundBill,
    downloadBillingBillPDF,
    downloadBillPDF,
    downloadBillingThermalBillPDF,
    downloadThermalBillPDF,
} from "../controllers/bill.controller.js";
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

router.get(
    "/ledger-summary",
    authMiddleware,
    getLedgerSummary
);

router.get(
    "/export",
    authMiddleware,
    exportBillsCsv
);

router.patch(
    "/:id/refund",
    authMiddleware,
    refundBill
);

router.get(
    "/billing",
    billingAuthMiddleware,
    getBillingBills
);

router.get(
    "/billing/ledger-summary",
    billingAuthMiddleware,
    getLedgerSummary
);

router.get(
    "/billing/export",
    billingAuthMiddleware,
    exportBillsCsv
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

export default router;
