import express from "express";

import {
    createProduct,
    getProducts,
    getProductById,
    getProductByBarcode,
    addStock,
    removeStock,
    getInventoryHistory,
    updateProduct,
    getProductByBrandProduct
} from "../../controllers/ProductController/product.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import billingAuthMiddleware from "../../middleware/billingAuth.middleware.js";
import flexAuthMiddleware from "../../middleware/flexAuth.middleware.js";

const router = express.Router();
 
router.post(
    "/",
    authMiddleware,
    createProduct
);
 
router.get(
    "/brand-product/:brandProductId",
    authMiddleware,
    getProductByBrandProduct
);
 
router.get(
    "/owner",
    authMiddleware,
    getProducts
);

router.get(
    "/owner/:id",
    authMiddleware,
    getProductById
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
 
router.get(
    "/billing",
    billingAuthMiddleware,
    getProducts
);

router.get(
    "/billing/barcode/:barcode",
    flexAuthMiddleware,
    getProductByBarcode
);

export default router;