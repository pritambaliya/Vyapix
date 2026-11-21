import mongoose from "mongoose";

const brandProductSchema = new mongoose.Schema(
    {
        mainProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MainProduct",
            required: true,
            index: true,
        },

        brandName: {
            type: String,
            trim: true,
            default: "Unbranded",
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
    },
    {
        timestamps: true,
    }
);

brandProductSchema.index(
    { mainProductId: 1, ownerId: 1, name: 1 },
    { unique: true }
);

const BrandProduct = mongoose.model(
    "BrandProduct",
    brandProductSchema
);

export default BrandProduct;