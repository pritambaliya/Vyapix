import mongoose from "mongoose";

const billingActivitySchema = new mongoose.Schema(
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

        billingAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingAccount",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: [
                "account_created",
                "account_updated",
                "account_disabled",
                "account_enabled",

                "login",
                "logout",

                "bill_created",
                "bill_cancelled",
                "bill_updated",

                "shift_started",
                "shift_closed",

                "product_viewed",
                "customer_created",
            ],
            required: true,
        },

        description: {
            type: String,
            trim: true,
        },

        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bill",
            default: null,
        },

        amount: {
            type: Number,
            default: null,
        },

        ipAddress: {
            type: String,
            default: null,
        },

        userAgent: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const BillingActivity = mongoose.model("BillingActivity", billingActivitySchema);

export default BillingActivity;