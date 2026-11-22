import express from "express";
import {createMainProduct, getMainProducts, getMainProductById, updateMainProduct, deleteMainProduct } from "../../controllers/ProductController/mainProduct.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import upload from "../../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("image"), createMainProduct);

router.get("/", authMiddleware, getMainProducts);

router.get("/:id", authMiddleware, getMainProductById);

router.patch("/:id", authMiddleware, updateMainProduct);

router.delete("/:id", authMiddleware, deleteMainProduct);

export default router;