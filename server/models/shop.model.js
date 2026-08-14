import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Owner",
            required: true,
        },

        shopName: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        gstNumber: {
            type: String,
            trim: true,
        },

        logo: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;