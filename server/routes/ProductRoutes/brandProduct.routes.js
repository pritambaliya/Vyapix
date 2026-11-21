import express from "express";

import {
    createBrandProduct,
    getBrandProducts,
    getBrandProductById,
    updateBrandProduct,
    deleteBrandProduct
} from "../controllers/brandProduct.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createBrandProduct);

router.get("/", authMiddleware, getBrandProducts);

router.get("/:id", authMiddleware, getBrandProductById);

router.patch("/:id", authMiddleware, updateBrandProduct);

router.delete("/:id", authMiddleware, deleteBrandProduct);

export default router;