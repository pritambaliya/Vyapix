import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
    {
        variantName: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0.001,
        },

        unit: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
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

        sku: {
            type: String,
            trim: true,
            uppercase: true,
        },

        barcode: {
            type: String,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        deactivatedBy: {
            type: String,
            enum: [
                "SELF",
                "CATEGORY",
                "MAIN_PRODUCT",
                "BRAND_PRODUCT"
            ],
            default: null,
        },

        deactivatedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);


// ==========================================
// MAIN PRODUCT INVENTORY SCHEMA
// ==========================================

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

        // Master catalogue references

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        mainProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MainProduct",
            required: true,
        },

        brandProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BrandProduct",
            required: true,
        },

        sellingType: {
            type: String,
            enum: ["LOOSE", "VARIANT"],
            required: true,
        },

        unit: {
            type: String,
            trim: true,
            lowercase: true,
        },

        purchasePrice: {
            type: Number,
            min: 0,
        },

        sellingPrice: {
            type: Number,
            min: 0,
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

        sku: {
            type: String,
            trim: true,
            uppercase: true,
        },

        barcode: {
            type: String,
            trim: true,
        },


        gstRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // VARIANT PRODUCT FIELDS

        variants: {
            type: [variantSchema],
            default: [],
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        deactivatedBy: {
            type: String,
            enum: [
                "SELF",
                "CATEGORY",
                "MAIN_PRODUCT",
                "BRAND_PRODUCT"
            ],
            default: null,
        },

        deactivatedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

productSchema.index(
    { shopId: 1, sku: 1 },
    {
        unique: true,
        partialFilterExpression: {
            sku: { $type: "string", $gt: "" }
        }
    }
);

productSchema.index(
    { shopId: 1, barcode: 1 },
    {
        unique: true,
        partialFilterExpression: {
            barcode: { $type: "string", $gt: "" }
        }
    }
);

productSchema.index(
    { shopId: 1, brandProductId: 1 }
);

const Product = mongoose.model(
    "Product",
    productSchema
);

export default Product;