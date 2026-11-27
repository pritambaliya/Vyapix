import express from "express";
import { createCategory, getCategories, updateCategory, getCategoriesbyId} from "../../controllers/ProductController/category.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createCategory);

router.get("/", authMiddleware, getCategories);

router.get("/:id", authMiddleware, getCategoriesbyId);

router.patch("/:id", authMiddleware, updateCategory);

export default router;