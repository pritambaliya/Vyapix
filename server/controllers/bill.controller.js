import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import Product from "../models/product.model.js";
import InventoryActivity from "../models/inventoryActivity.model.js";
import BillingActivity from "../models/billingActivity.model.js";
import Shop from "../models/shop.model.js";

export const createBill = async (req, res) => {
    const session =
        await mongoose.startSession();

    try {
        const {items, discount = 0, paymentMethod, customerName, customerPhone, notes } = req.body;

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Bill must contain products",
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment method is required",
            });
        }

        if (
            Number(discount) < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Discount cannot be negative",
            });
        }

        const billingAccount =
            req.billingAccount;

        const ownerId =
            billingAccount.ownerId;

        const shopId =
            billingAccount.shopId;

        let createdBill;

        await session.withTransaction(
            async () => {

                let subtotal = 0;
                let gstTotal = 0;
                const billItems = [];

                for (const item of items) {

                    if (
                        !item.productId ||
                        !item.quantity ||
                        Number(item.quantity) <= 0
                    ) {
                        throw new Error(
                            "Invalid bill item"
                        );
                    }

                    const quantity =
                        Number(item.quantity);
                
                    const product =
                        await Product.findOneAndUpdate(
                            {
                                _id: item.productId,
                                shopId,
                                isActive: true,

                                stock: {
                                    $gte: quantity,
                                },
                            },
                            {
                                $inc: {
                                    stock: -quantity,
                                },
                            },
                            {
                                new: true,
                                session,
                            }
                        );

                    if (!product) {
                        throw new Error(
                            `Insufficient stock or product not found: ${item.productId}`
                        );
                    }

                    const unitPrice =
                        Number(
                            product.sellingPrice
                        );

                    const baseAmount =
                        unitPrice * quantity;

                    const gstAmount =
                        baseAmount *
                        (Number(
                            product.gstRate
                        ) / 100);

                    const itemTotal =
                        baseAmount +
                        gstAmount;

                    subtotal += baseAmount;
                    gstTotal += gstAmount;

                    billItems.push({
                        productId:
                            product._id,

                        name:
                            product.name,

                        sku:
                            product.sku,

                        barcode:
                            product.barcode,

                        quantity,

                        unitPrice,

                        gstRate:
                            product.gstRate,

                        gstAmount:

                            Number(
                                gstAmount.toFixed(
                                    2
                                )
                            ),

                        total:

                            Number(
                                itemTotal.toFixed(
                                    2
                                )
                            ),
                    });

                    await InventoryActivity.create(
                        [
                            {
                                ownerId,

                                shopId,

                                productId:
                                    product._id,

                                billingAccountId:
                                    billingAccount._id,

                                type: "sale",

                                quantity,

                                previousStock:
                                    product.stock +
                                    quantity,

                                newStock:
                                    product.stock,

                                reason:
                                    "Product sold",

                            },
                        ],
                        { session }
                    );
                }

                subtotal =
                    Number(
                        subtotal.toFixed(2)
                    );

                gstTotal =
                    Number(
                        gstTotal.toFixed(2)
                    );

                const finalDiscount =
                    Number(discount);

                const grandTotal =
                    Number(
                        (
                            subtotal +
                            gstTotal -
                            finalDiscount
                        ).toFixed(2)
                    );

                if (grandTotal < 0) {
                    throw new Error(
                        "Discount cannot exceed bill amount"
                    );
                }

                const shop =
                    await Shop.findById(
                        shopId
                    ).session(session);

                if (!shop) {
                    throw new Error(
                        "Shop not found"
                    );
                }

                const invoiceNumber =
                    `VXP-${Date.now()}`;

                const bills =
                    await Bill.create(
                        [
                            {
                                ownerId,

                                shopId,

                                billingAccountId:
                                    billingAccount._id,

                                invoiceNumber,

                                items:
                                    billItems,

                                subtotal,

                                discount:
                                    finalDiscount,

                                gstTotal,

                                grandTotal,

                                paymentMethod,

                                paymentStatus:
                                    "paid",

                                customerName:
                                    customerName?.trim(),

                                customerPhone:
                                    customerPhone?.trim(),

                                notes:
                                    notes?.trim(),

                                status:
                                    "completed",
                            },
                        ],
                        { session }
                    );

                createdBill =
                    bills[0];

                await BillingActivity.create(
                    [
                        {
                            ownerId,

                            shopId,

                            billingAccountId:
                                billingAccount._id,

                            type:
                                "bill_created",

                            description:
                                `Invoice ${invoiceNumber} created for ₹${grandTotal}`,
                        },
                    ],
                    { session }
                );
            }
        );

        return res.status(201).json({
            success: true,

            message:
                "Bill created successfully",

            data: {
                bill: createdBill,
            },
        });

    } catch (error) {

        console.error(
            "Create Bill Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to create bill",
        });

    } finally {
        await session.endSession();
    }
};

