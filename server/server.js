import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import shopRoutes from "./routes/shop.route.js";
import billingAccountRoutes from "./routes/billingAccount.route.js";
import productRoutes from "./routes/product.routes.js";
import billRoutes from "./routes/bill.routes.js";

const app = express();
const PORT = 5000;
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Vyapix API"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/billing-accounts", billingAccountRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected ✅");
    } catch (error) {
        console.log("MongoDB Connection Failed", error);
        process.exit(1);
    }
}
connectDB();

app.listen(PORT, () => {
    console.log("Server is running...")
})