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
            url: {
                type: String,
                default: null
            },
            publicId: {
                type: String,
                default: null
            },
            source: {
                type: String,
                enum: ["upload", "generated"],
                default: "generated",
            },
        }
    },
    {
        timestamps: true,
    }
);

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;