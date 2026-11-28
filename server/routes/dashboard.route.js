import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getDashboardOverview } from "../controllers/dashboard.controller.js";

const router = express.Router();

// Owner-only dashboard overview (authMiddleware rejects cashiers and scopes to req.owner + req.shop)
router.get("/overview", authMiddleware, getDashboardOverview);

export default router;
