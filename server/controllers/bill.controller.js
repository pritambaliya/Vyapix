import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import Product from "../models/product.model.js";
import InventoryActivity from "../models/inventoryActivity.model.js";
import BillingActivity from "../models/billingActivity.model.js";
import BillingAccount from "../models/billingAccount.model.js";
import Shop from "../models/shop.model.js";
import generateInvoiceNumber from "../utils/generateInvoiceNumber.js";
import generateInvoicePDF from "../utils/generateInvoicePDF.js";
import generateThermalInvoice from "../utils/generateThermalInvoice.js";

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

                const invoiceNumber = await generateInvoiceNumber(shopId, session);

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

export const getBills = async (req, res) => {
    try {
        const {search, billingAccountId, paymentMethod, status, page = 1, limit = 20 } = req.query;

        const filter = {
            ownerId: req.owner._id,
        };

        if (search?.trim()) {
            filter.$or = [
                {
                    invoiceNumber: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    customerName: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    customerPhone: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        if (billingAccountId) {
            filter.billingAccountId =
                billingAccountId;
        }

        if (paymentMethod) {
            filter.paymentMethod =
                paymentMethod;
        }

        if (status) {
            filter.status = status;
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const total =
            await Bill.countDocuments(filter);

        const bills = await Bill.find(filter)
            .populate(
                "billingAccountId",
                "accountNumber name"
            )
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(Number(limit));

        return res.status(200).json({
            success: true,

            data: {
                bills,

                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages:
                        Math.ceil(
                            total /
                                Number(limit)
                        ),
                },
            },
        });

    } catch (error) {
        console.error(
            "Get Bills Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching bills",
        });
    }
};

export const getBillingBills = async (
    req,
    res
) => {
    try {
        const {
            search,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {
            billingAccountId:
                req.billingAccount._id,
        };

        if (search?.trim()) {
            filter.invoiceNumber = {
                $regex: search.trim(),
                $options: "i",
            };
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const total =
            await Bill.countDocuments(filter);

        const bills = await Bill.find(filter)
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(Number(limit));

        return res.status(200).json({
            success: true,

            data: {
                bills,

                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages:
                        Math.ceil(
                            total /
                                Number(limit)
                        ),
                },
            },
        });

    } catch (error) {
        console.error(
            "Get Billing Bills Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching bills",
        });
    }
};

export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const bill = await Bill.findOne({
            _id: id,
            ownerId: req.owner._id,
        })
            .populate(
                "billingAccountId",
                "accountNumber name"
            )
            .populate(
                "items.productId",
                "name sku barcode"
            );

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                bill,
            },
        });

    } catch (error) {
        console.error(
            "Get Bill Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching bill",
        });
    }
};

export const getBillingBillById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const bill = await Bill.findOne({
            _id: id,

            billingAccountId:
                req.billingAccount._id,
        }).populate(
            "items.productId",
            "name sku barcode"
        );

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                bill,
            },
        });

    } catch (error) {
        console.error(
            "Get Billing Bill Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching bill",
        });
    }
};

export const refundBill = async (req, res) => {
    const session =
        await mongoose.startSession();

    try {
        const { id } = req.params;

        let refundedBill;

        await session.withTransaction(
            async () => {

                const bill =
                    await Bill.findOne({
                        _id: id,
                        ownerId: req.owner._id,
                        status: "completed",
                    }).session(session);

                if (!bill) {
                    throw new Error(
                        "Bill not found or already refunded"
                    );
                }

                for (const item of bill.items) {

                    const product =
                        await Product.findOneAndUpdate(
                            {
                                _id: item.productId,
                                shopId: bill.shopId,
                            },
                            {
                                $inc: {
                                    stock:
                                        item.quantity,
                                },
                            },
                            {
                                new: true,
                                session,
                            }
                        );

                    if (!product) {
                        throw new Error(
                            `Product not found: ${item.productId}`
                        );
                    }

                    await InventoryActivity.create(
                        [
                            {
                                ownerId:
                                    bill.ownerId,

                                shopId:
                                    bill.shopId,

                                productId:
                                    item.productId,

                                billingAccountId:
                                    bill.billingAccountId,

                                type:
                                    "sale_return",

                                quantity:
                                    item.quantity,

                                previousStock:
                                    product.stock -
                                    item.quantity,

                                newStock:
                                    product.stock,

                                reason:
                                    `Refund for invoice ${bill.invoiceNumber}`,

                                referenceId:
                                    bill.invoiceNumber,
                            },
                        ],
                        { session }
                    );
                }

                bill.status = "refunded";

                await bill.save({
                    session,
                });

                refundedBill = bill;

                await BillingActivity.create(
                    [
                        {
                            ownerId:
                                bill.ownerId,

                            shopId:
                                bill.shopId,

                            billingAccountId:
                                bill.billingAccountId,

                            type:
                                "bill_refunded",

                            description:
                                `Invoice ${bill.invoiceNumber} refunded for ₹${bill.grandTotal}`,
                        },
                    ],
                    { session }
                );
            }
        );

        return res.status(200).json({
            success: true,

            message:
                "Bill refunded successfully",

            data: {
                bill: refundedBill,
            },
        });

    } catch (error) {
        console.error(
            "Refund Bill Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to refund bill",
        });

    } finally {
        await session.endSession();
    }
};

export const downloadBillPDF = async (req, res) => {
    try {

        const { id } = req.params;

        const bill = await Bill.findOne({
            _id: id,
            ownerId: req.owner._id,
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        const shop = await Shop.findOne({
            _id: bill.shopId,
            ownerId: req.owner._id,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const billingAccount =
            await BillingAccount.findById(
                bill.billingAccountId
            );

        generateInvoicePDF(
            bill,
            shop,
            billingAccount,
            res
        );

    } catch (error) {

        console.error(
            "Download Bill PDF Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate invoice PDF",
        });
    }
};

export const downloadBillingBillPDF = async (req, res) => {
    try {

        const { id } = req.params;

        const bill = await Bill.findOne({
            _id: id,

            billingAccountId:
                req.billingAccount._id,
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        const shop = await Shop.findById(
            bill.shopId
        );

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const billingAccount =
            await BillingAccount.findById(
                bill.billingAccountId
            );

        generateInvoicePDF(
            bill,
            shop,
            billingAccount,
            res
        );

    } catch (error) {

        console.error(
            "Billing PDF Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate invoice PDF",
        });
    }
};

export const downloadThermalBillPDF = async (req, res) => {
    try {

        const { id } = req.params;

        const bill = await Bill.findOne({
            _id: id,
            ownerId: req.owner._id,
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        const shop = await Shop.findOne({
            _id: bill.shopId,
            ownerId: req.owner._id,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const billingAccount =
            await BillingAccount.findById(
                bill.billingAccountId
            );

        generateThermalInvoice(
            bill,
            shop,
            billingAccount,
            res
        );

    } catch (error) {

        console.error(
            "Thermal Invoice Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate thermal invoice",
        });
    }
};

export const downloadBillingThermalBillPDF = async (req, res) => {

        try {

            const { id } = req.params;

            const bill = await Bill.findOne({
                _id: id,

                billingAccountId:
                    req.billingAccount._id,
            });

            if (!bill) {
                return res.status(404).json({
                    success: false,
                    message: "Bill not found",
                });
            }

            const shop =
                await Shop.findById(
                    bill.shopId
                );

            if (!shop) {
                return res.status(404).json({
                    success: false,
                    message: "Shop not found",
                });
            }

            const billingAccount =
                await BillingAccount.findById(
                    bill.billingAccountId
                );

            generateThermalInvoice(
                bill,
                shop,
                billingAccount,
                res
            );

        } catch (error) {

            console.error(
                "Billing Thermal Invoice Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to generate thermal invoice",
            });
        }
    };