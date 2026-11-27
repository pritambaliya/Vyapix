import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
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

categorySchema.index(
    { ownerId: 1, name: 1 },
    { unique: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;