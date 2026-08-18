import mongoose from "mongoose";

const invoiceCounterSchema = new mongoose.Schema(
    {
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
        },

        year: {
            type: Number,
            required: true,
        },

        sequence: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

invoiceCounterSchema.index(
    {
        shopId: 1,
        year: 1,
    },
    {
        unique: true,
    }
);

const InvoiceCounter = mongoose.model(
    "InvoiceCounter",
    invoiceCounterSchema
);

export default InvoiceCounter;