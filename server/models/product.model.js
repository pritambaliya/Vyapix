import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
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

        name: {
            type: String,
            required: true,
            trim: true,
        },

        sku: {
            type: String,
            trim: true,
            uppercase: true,
        },

        barcode: {
            type: String,
            trim: true,
        },

        category: {
            type: String,
            trim: true,
        },

        unit: {
            type: String,
            default: "pcs",
            trim: true,
        },

        purchasePrice: {
            type: Number,
            required: true,
            min: 0,
        },

        sellingPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        gstRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        stock: {
            type: Number,
            default: 0,
            min: 0,
        },

        lowStockLimit: {
            type: Number,
            default: 5,
            min: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

productSchema.index(
    { shopId: 1, sku: 1 },
    { unique: true, sparse: true }
);

productSchema.index(
    { shopId: 1, barcode: 1 },
    { unique: true, sparse: true }
);

const Product = mongoose.model(
    "Product",
    productSchema
);

export default Product;