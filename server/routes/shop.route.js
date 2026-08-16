import express from "express";
import {getShop, updateShop, updateShopLogo, deleteShopLogo } from "../controllers/shop.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getShop
);

router.put(
    "/",
    authMiddleware,
    updateShop
);

router.put(
    "/logo",
    authMiddleware,
    upload.single("logo"),
    updateShopLogo
);

router.delete(
    "/logo",
    authMiddleware,
    deleteShopLogo
);

export default router;