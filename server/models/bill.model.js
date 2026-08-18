import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        sku: {
            type: String,
            default: null,
        },

        barcode: {
            type: String,
            default: null,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        gstRate: {
            type: Number,
            required: true,
            min: 0,
        },

        gstAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        total: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const billSchema = new mongoose.Schema(
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

        invoiceNumber: {
            type: String,
            required: true,
        },

        items: {
            type: [billItemSchema],
            required: true,
            validate: {
                validator: (items) =>
                    items.length > 0,
                message: "Bill must contain at least one item",
            },
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
        },

        gstTotal: {
            type: Number,
            default: 0,
            min: 0,
        },

        grandTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentMethod: {
            type: String,
            enum: [
                "cash",
                "upi",
                "card",
                "mixed",
            ],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: [
                "paid",
                "pending",
                "partial",
            ],
            default: "paid",
        },

        customerName: {
            type: String,
            trim: true,
            default: null,
        },

        customerPhone: {
            type: String,
            trim: true,
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "completed",
                "cancelled",
                "refunded",
            ],
            default: "completed",
        },
    },
    {
        timestamps: true,
    }
);

billSchema.index(
    { shopId: 1, invoiceNumber: 1 },
    { unique: true }
);

const Bill = mongoose.model(
    "Bill",
    billSchema
);

export default Bill;