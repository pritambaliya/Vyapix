import mongoose from "mongoose";

const inventoryActivitySchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Owner",
            required: true,
            index: true,
        },

        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
            index: true,
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },

        billingAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingAccount",
            default: null,
        },

        type: {
            type: String,
            enum: [
                "stock_added",
                "stock_removed",
                "stock_adjusted",
                "sale",
                "sale_return",
            ],
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
        },

        previousStock: {
            type: Number,
            required: true,
        },

        newStock: {
            type: Number,
            required: true,
        },

        reason: {
            type: String,
            trim: true,
        },

        referenceId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const InventoryActivity = mongoose.model(
    "InventoryActivity",
    inventoryActivitySchema
);

export default InventoryActivity;