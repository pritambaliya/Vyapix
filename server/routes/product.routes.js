import express from "express";
import { createProduct, getProducts, getProductByBarcode} from "../controllers/product.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import billingMiddleware from "../middleware/billing.middleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createProduct
);

router.get(
    "/owner",
    authMiddleware,
    getProducts
);

router.get(
    "/billing",
    billingMiddleware,
    getProducts
);

router.get(
    "/billing/barcode/:barcode",
    billingMiddleware,
    getProductByBarcode
);

export default router;