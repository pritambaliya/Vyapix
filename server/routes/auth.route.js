import express from "express";
import { registerOwner, loginOwner, getOwnerProfile, logout } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/register",
    upload.fields([
        {
            name: "logo",
            maxCount: 1,
        },
    ]), registerOwner);
router.post("/login", loginOwner);
router.get("/me", authMiddleware, getOwnerProfile);
router.post("/logout", logout);

export default router;