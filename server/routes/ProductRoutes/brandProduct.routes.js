import express from "express";
import {createBrandProduct, getBrandProducts, getBrandProductById, updateBrandProduct, deleteBrandProduct} from "../../controllers/ProductController/brandProduct.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import upload from "../../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("image"), createBrandProduct);

router.get("/", authMiddleware, getBrandProducts);

router.get("/:id", authMiddleware, getBrandProductById);

router.patch("/:id", authMiddleware, upload.single("image"), updateBrandProduct);

router.delete("/:id", authMiddleware, deleteBrandProduct);

export default router;