import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Vyapix API"
    });
});

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

app.listen(5000, () => {
    console.log("Server is running...")
})