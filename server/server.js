import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import shopRoutes from "./routes/shop.route.js";
import billingAccountRoutes from "./routes/billingAccount.route.js";
import productRoutes from "./routes/product.routes.js";
import billRoutes from "./routes/bill.route.js";

dotenv.config(); // FIX: load env BEFORE accessing any process.env variables

const app = express();

// FIX M-11: PORT from environment variable; fall back to 5000 for local dev
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Vyapix API"
    });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/billing-accounts", billingAccountRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// FIX M-10: Global error handler — catches any error forwarded by next(err)
// or unhandled async errors (Express 5 propagates them automatically).
// Must have 4 parameters to be recognised as an error handler by Express.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err.message);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// ── Database + server startup ─────────────────────────────────────────────────
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected ✅");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

// FIX H-8: await DB connection BEFORE starting the HTTP server so the server
// never accepts requests while Mongoose is still connecting.
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
