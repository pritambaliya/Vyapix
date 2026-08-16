import mongoose from "mongoose";

const billingAccountSchema = new mongoose.Schema(
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

        accountNumber: {
            type: String,
            required: true,
            unique: true,
        },

        billingCode: {
            type: String,
            required: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        employeeName: {
            type: String,
            trim: true,
        },

        passwordHash: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["active", "disabled"],
            default: "active",
        },

        permissions: {
            billing: {
                type: Boolean,
                default: true,
            },

            viewProducts: {
                type: Boolean,
                default: true,
            },

            viewStock: {
                type: Boolean,
                default: true,
            },

            viewCustomers: {
                type: Boolean,
                default: true,
            },
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        lastSeenAt: {
            type: Date,
            default: null,
        },

        totalBills: {
            type: Number,
            default: 0,
        },

        totalSales: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const BillingAccount = mongoose.model("BillingAccount", billingAccountSchema);

export default BillingAccount;