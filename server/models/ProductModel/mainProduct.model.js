import mongoose from "mongoose";

const mainProductSchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Owner",
            default: null,
        },

        image: {
            type: String,
            default: "",
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

mainProductSchema.index(
    { categoryId: 1, ownerId: 1, name: 1 },
    { unique: true }
);

const MainProduct = mongoose.model(
    "MainProduct",
    mainProductSchema
);

export default MainProduct;