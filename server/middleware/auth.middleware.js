import jwt from "jsonwebtoken";
import Owner from "../models/owner.model.js";
import Shop from "../models/shop.model.js";

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

        const owner = await Owner.findById(decoded.ownerId).select("-password");

        if (!owner) {
            return res.status(401).json({
                success: false,
                message: "Owner not found",
            });
        }

        const shop = await Shop.findOne({
            ownerId: owner._id
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found. Please create your shop first."
            });
        }

        req.owner = owner;
        req.shop = shop;

        req.user = {
            id: owner._id,
            role: "owner"
        };

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