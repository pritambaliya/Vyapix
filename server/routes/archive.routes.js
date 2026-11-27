import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import {
    // Archive
    archiveCategory,
    archiveMainProduct,
    archiveBrandProduct,
    archiveProduct,

    // Restore
    restoreCategory,
    restoreMainProduct,
    restoreBrandProduct,
    restoreProduct,

    // Permanent Delete
    permanentDeleteCategory,
    permanentDeleteMainProduct,
    permanentDeleteBrandProduct,
    permanentDeleteProduct,
} from "../controllers/archive.controller.js";

const router = express.Router();


// ======================================================
// ARCHIVE
// ======================================================

router.patch(
    "/category/:id/archive",
    authMiddleware,
    archiveCategory
);

router.patch(
    "/main-product/:id/archive",
    authMiddleware,
    archiveMainProduct
);

router.patch(
    "/brand-product/:id/archive",
    authMiddleware,
    archiveBrandProduct
);

router.patch(
    "/product/:id/archive",
    authMiddleware,
    archiveProduct
);


// ======================================================
// RESTORE
// ======================================================

router.patch(
    "/category/:id/restore",
    authMiddleware,
    restoreCategory
);

router.patch(
    "/main-product/:id/restore",
    authMiddleware,
    restoreMainProduct
);

router.patch(
    "/brand-product/:id/restore",
    authMiddleware,
    restoreBrandProduct
);

router.patch(
    "/product/:id/restore",
    authMiddleware,
    restoreProduct
);

router.delete(
    "/category/:id/permanent",
    authMiddleware,
    permanentDeleteCategory
);

router.delete(
    "/main-product/:id/permanent",
    authMiddleware,
    permanentDeleteMainProduct
);

router.delete(
    "/brand-product/:id/permanent",
    authMiddleware,
    permanentDeleteBrandProduct
);

router.delete(
    "/product/:id/permanent",
    authMiddleware,
    permanentDeleteProduct
);


export default router;