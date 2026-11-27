import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import shopRoutes from "./routes/shop.route.js";
import billingAccountRoutes from "./routes/billingAccount.route.js";
import productRoutes from "./routes/ProductRoutes/product.routes.js";
import billRoutes from "./routes/bill.route.js";
import categoryRoutes from "./routes/ProductRoutes/category.routes.js";
import mainProductRoutes from "./routes/ProductRoutes/mainProduct.routes.js";
import brandProductRoutes from "./routes/ProductRoutes/brandProduct.routes.js";
import archiveRoutes from "./routes/archive.routes.js";

dotenv.config();
const app = express();
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

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Vyapix API",
        status: "Running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/billing-accounts", billingAccountRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/main-products", mainProductRoutes);
app.use("/api/brand-products", brandProductRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/archive", archiveRoutes);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err.message);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected ✅");

    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Vyapix Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server Startup Failed:", error);
        process.exit(1);
    }
};

startServer();