import InvoiceCounter from "../models/invoiceCounter.model.js";

const generateInvoiceNumber = async (shopId, session) => {
    const year = new Date().getFullYear();

    const counter =
        await InvoiceCounter.findOneAndUpdate(
            {
                shopId,
                year,
            },
            {
                $inc: {
                    sequence: 1,
                },
            },
            {
                new: true,
                upsert: true,
                session,
                setDefaultsOnInsert: true,
            }
        );

    const sequence =
        String(counter.sequence)
            .padStart(6, "0");

    return `VXP-${year}-${sequence}`;
};

export default generateInvoiceNumber;