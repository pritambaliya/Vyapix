import jwt from "jsonwebtoken";
import Owner from "../models/owner.model.js";

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const owner = await Owner.findById(decoded.ownerId).select(
            "-password"
        );

        if (!owner) {
            return res.status(401).json({
                success: false,
                message: "Owner not found",
            });
        }

        req.owner = owner;

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication",
        });
    }
};

export default authMiddleware;