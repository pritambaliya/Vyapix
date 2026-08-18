import express from "express";
import { createBill } from "../controllers/bill.controller.js";
import billingMiddleware from "../middleware/billing.middleware.js";

const router = express.Router();

router.post(
    "/",
    billingMiddleware,
    createBill
);

export default router;