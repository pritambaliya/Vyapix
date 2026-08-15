import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";

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