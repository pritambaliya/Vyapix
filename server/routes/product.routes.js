import express from "express";
import { createProduct, getProducts, getProductByBarcode, addStock, removeStock, getInventoryHistory, updateProduct} from "../controllers/product.controller.js";
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

router.patch(
    "/:id/add-stock",
    authMiddleware,
    addStock
);

router.patch(
    "/:id/remove-stock",
    authMiddleware,
    removeStock
);

router.get(
    "/:id/inventory-history",
    authMiddleware,
    getInventoryHistory
);

router.patch(
    "/:id",
    authMiddleware,
    updateProduct
);

export default router;