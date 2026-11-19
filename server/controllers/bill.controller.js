import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import Product from "../models/product.model.js";
import Shop from "../models/shop.model.js";
import InventoryActivity from "../models/inventoryActivity.model.js";
import BillingActivity from "../models/billingActivity.model.js";
import BillingAccount from "../models/billingAccount.model.js";
import generateInvoiceNumber from "../utils/generateInvoiceNumber.js";
import generateInvoicePDF from "../utils/generateInvoicePDF.js";
import generateThermalInvoice from "../utils/generateThermalInvoice.js";

export const createBill = async (req, res) => {
    try {
        const { items, discount = 0, paymentMethod, customerName, customerPhone, notes } = req.body;

        // ── Input validation ────────────────────────────────────────────────
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
                message: "Payment method is required",
            });
        }

        const validPaymentMethods = ["cash", "upi", "card", "mixed"];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method",
            });
        }

        if (Number(discount) < 0) {
            return res.status(400).json({
                success: false,
                message: "Discount cannot be negative",
            });
        }

        // ── Resolve identity: cashier or owner ──────────────────────────────
        // FIX C-2 & C-3: billingAccount is null when owner creates the bill.
        // shopId must be fetched from Shop for the owner path instead of reading
        // the non-existent req.owner.shopId.
        const billingAccount = req.billingAccount || null;

        const ownerId = billingAccount
            ? billingAccount.ownerId
            : req.owner?._id;

        let shopId;

        if (billingAccount) {
            shopId = billingAccount.shopId;
        } else if (req.owner) {
            // Owner creating a bill directly — look up their shop
            const ownerShop = await Shop.findOne({ ownerId: req.owner._id });

            if (!ownerShop) {
                return res.status(404).json({
                    success: false,
                    message: "Shop not found for this owner",
                });
            }

            shopId = ownerShop._id;
        }

        if (!ownerId || !shopId) {
            return res.status(401).json({
                success: false,
                message: "Invalid billing authentication",
            });
        }

        // ── Transaction ────────────────────────────────────────────────────
        const session = await mongoose.startSession();
        let createdBill;

        try {
            await session.withTransaction(async () => {

                let subtotal = 0;
                let gstTotal = 0;
                const billItems = [];

                for (const item of items) {

                    if (
                        !item.productId ||
                        !item.quantity ||
                        Number(item.quantity) <= 0
                    ) {
                        throw new Error("Invalid bill item: productId and quantity > 0 are required");
                    }

                    const quantity = Number(item.quantity);

                    // Atomic stock decrement — only proceeds when stock >= quantity
                    const product =
                        await Product.findOneAndUpdate(
                            {
                                _id: item.productId,
                                shopId,
                                isActive: true,
                                stock: { $gte: quantity },
                            },
                            {
                                $inc: { stock: -quantity },
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

                    const unitPrice   = Number(product.sellingPrice);
                    const baseAmount  = unitPrice * quantity;
                    // GST is treated as exclusive (added on top of selling price)
                    const gstAmount   = baseAmount * (Number(product.gstRate) / 100);
                    const itemTotal   = baseAmount + gstAmount;

                    subtotal += baseAmount;
                    gstTotal += gstAmount;

                    billItems.push({
                        productId:  product._id,
                        name:       product.name,
                        sku:        product.sku,
                        barcode:    product.barcode,
                        quantity,
                        unitPrice,
                        gstRate:    product.gstRate,
                        gstAmount:  Number(gstAmount.toFixed(2)),
                        total:      Number(itemTotal.toFixed(2)),
                    });

                    await InventoryActivity.create(
                        [
                            {
                                ownerId,
                                shopId,
                                productId: product._id,
                                // FIX C-2: safe optional chaining — null for owner-created bills
                                billingAccountId: billingAccount?._id || null,
                                type: "sale",
                                quantity,
                                // product.stock is post-decrement; add quantity back for previousStock
                                previousStock: product.stock + quantity,
                                newStock:      product.stock,
                                reason: "Product sold",
                            },
                        ],
                        { session }
                    );
                }

                subtotal = Number(subtotal.toFixed(2));
                gstTotal = Number(gstTotal.toFixed(2));

                const finalDiscount = Number(discount);

                const grandTotal = Number(
                    (subtotal + gstTotal - finalDiscount).toFixed(2)
                );

                if (grandTotal < 0) {
                    throw new Error("Discount cannot exceed bill amount");
                }

                const invoiceNumber = await generateInvoiceNumber(shopId, session);

                const bills = await Bill.create(
                    [
                        {
                            ownerId,
                            shopId,
                            // FIX C-2: safe — null when owner creates bill directly
                            billingAccountId: billingAccount?._id || null,
                            invoiceNumber,
                            items:          billItems,
                            subtotal,
                            discount:       finalDiscount,
                            gstTotal,
                            grandTotal,
                            paymentMethod,
                            paymentStatus:  "paid",
                            customerName:   customerName?.trim() || null,
                            customerPhone:  customerPhone?.trim() || null,
                            notes:          notes?.trim() || null,
                            status:         "completed",
                        },
                    ],
                    { session }
                );

                createdBill = bills[0];

                // FIX M-7: Increment cashier's running totals so the dashboard
                // figures stay accurate. Only applicable for cashier-originated bills.
                if (billingAccount) {
                    await BillingAccount.findByIdAndUpdate(
                        billingAccount._id,
                        {
                            $inc: {
                                totalBills: 1,
                                totalSales: grandTotal,
                            },
                        },
                        { session }
                    );

                    await BillingActivity.create(
                        [
                            {
                                ownerId,
                                shopId,
                                billingAccountId: billingAccount._id,
                                type:        "bill_created",
                                billId:      createdBill._id,
                                amount:      grandTotal,
                                description: `Invoice ${invoiceNumber} created for ₹${grandTotal}`,
                            },
                        ],
                        { session }
                    );
                }
            });
        } finally {
            await session.endSession();
        }

        return res.status(201).json({
            success: true,
            message: "Bill created successfully",
            data: {
                bill: createdBill,
            },
        });

    } catch (error) {
        console.error("Create Bill Error:", error);

        // Distinguish domain errors (400) from server errors (500)
        const isDomainError =
            error.message?.startsWith("Insufficient") ||
            error.message?.startsWith("Discount") ||
            error.message?.startsWith("Invalid bill item") ||
            error.message === "Shop not found";

        return res.status(isDomainError ? 400 : 500).json({
            success: false,
            message: error.message || "Failed to create bill",
        });
    }
};

export const getBills = async (req, res) => {
    try {
        const { search, billingAccountId, paymentMethod, status, page = 1, limit = 20 } = req.query;

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

        // FIX M-12: Validate ObjectId and enum before using as DB filter
        if (billingAccountId) {
            if (!mongoose.Types.ObjectId.isValid(billingAccountId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid billingAccountId",
                });
            }
            filter.billingAccountId = billingAccountId;
        }

        if (paymentMethod) {
            const validMethods = ["cash", "upi", "card", "mixed"];
            if (!validMethods.includes(paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid paymentMethod filter",
                });
            }
            filter.paymentMethod = paymentMethod;
        }

        if (status) {
            const validStatuses = ["completed", "cancelled", "refunded"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status filter",
                });
            }
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const total = await Bill.countDocuments(filter);

        const bills = await Bill.find(filter)
            .populate("billingAccountId", "accountNumber name")
            .sort({ createdAt: -1 })
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
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
        });

    } catch (error) {
        console.error("Get Bills Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching bills",
        });
    }
};

export const getBillingBills = async (req, res) => {
    try {
        const {
            search,
            page = 1,
            limit = 20,
        } = req.query;

        // req.billingAccount guaranteed by billingAuthMiddleware
        const filter = {
            billingAccountId: req.billingAccount._id,
        };

        if (search?.trim()) {
            filter.invoiceNumber = {
                $regex: search.trim(),
                $options: "i",
            };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const total = await Bill.countDocuments(filter);

        const bills = await Bill.find(filter)
            .sort({ createdAt: -1 })
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
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
        });

    } catch (error) {
        console.error("Get Billing Bills Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching bills",
        });
    }
};

export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid bill ID" });
        }

        const bill = await Bill.findOne({
            _id: id,
            ownerId: req.owner._id,
        })
            .populate("billingAccountId", "accountNumber name")
            .populate("items.productId", "name sku barcode");

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { bill },
        });

    } catch (error) {
        console.error("Get Bill Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching bill",
        });
    }
};

export const getBillingBillById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid bill ID" });
        }

        // req.billingAccount guaranteed by billingAuthMiddleware
        const bill = await Bill.findOne({
            _id: id,
            billingAccountId: req.billingAccount._id,
        }).populate("items.productId", "name sku barcode");

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { bill },
        });

    } catch (error) {
        console.error("Get Billing Bill Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching bill",
        });
    }
};

export const refundBill = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid bill ID" });
        }

        let refundedBill;

        await session.withTransaction(async () => {

            const bill = await Bill.findOne({
                _id: id,
                ownerId: req.owner._id,
                status: "completed",
            }).session(session);

            if (!bill) {
                throw new Error("Bill not found or already refunded");
            }

            for (const item of bill.items) {

                const product =
                    await Product.findOneAndUpdate(
                        {
                            _id: item.productId,
                            shopId: bill.shopId,
                        },
                        {
                            $inc: { stock: item.quantity },
                        },
                        {
                            new: true,
                            session,
                        }
                    );

                if (!product) {
                    throw new Error(
                        `Product not found during refund: ${item.productId}`
                    );
                }

                await InventoryActivity.create(
                    [
                        {
                            ownerId:          bill.ownerId,
                            shopId:           bill.shopId,
                            productId:        item.productId,
                            billingAccountId: bill.billingAccountId || null,
                            type:             "sale_return",
                            quantity:         item.quantity,
                            previousStock:    product.stock - item.quantity,
                            newStock:         product.stock,
                            reason:           `Refund for invoice ${bill.invoiceNumber}`,
                            referenceId:      bill.invoiceNumber,
                        },
                    ],
                    { session }
                );
            }

            bill.status = "refunded";
            await bill.save({ session });
            refundedBill = bill;

            // FIX M-7: Decrement cashier's running totals on refund
            if (bill.billingAccountId) {
                await BillingAccount.findByIdAndUpdate(
                    bill.billingAccountId,
                    {
                        $inc: {
                            totalBills: -1,
                            totalSales: -bill.grandTotal,
                        },
                    },
                    { session }
                );

                await BillingActivity.create(
                    [
                        {
                            ownerId:          bill.ownerId,
                            shopId:           bill.shopId,
                            billingAccountId: bill.billingAccountId,
                            billId:           bill._id,
                            amount:           bill.grandTotal,
                            type:             "bill_refunded",
                            description:      `Invoice ${bill.invoiceNumber} refunded for ₹${bill.grandTotal}`,
                        },
                    ],
                    { session }
                );
            }
        });

        return res.status(200).json({
            success: true,
            message: "Bill refunded successfully",
            data: { bill: refundedBill },
        });

    } catch (error) {
        console.error("Refund Bill Error:", error);

        return res.status(400).json({
            success: false,
            message: error.message || "Failed to refund bill",
        });

    } finally {
        await session.endSession();
    }
};

export const downloadBillPDF = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid bill ID" });
        }

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

        const billingAccount = bill.billingAccountId
            ? await BillingAccount.findById(bill.billingAccountId)
            : null;

        generateInvoicePDF(bill, shop, billingAccount, res);

    } catch (error) {
        console.error("Download Bill PDF Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate invoice PDF",
        });
    }
};

export const downloadBillingBillPDF = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid bill ID" });
        }

        // req.billingAccount guaranteed by billingAuthMiddleware
        const bill = await Bill.findOne({
            _id: id,
            billingAccountId: req.billingAccount._id,
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        const shop = await Shop.findById(bill.shopId);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const billingAccount = await BillingAccount.findById(
            bill.billingAccountId
        );

        generateInvoicePDF(bill, shop, billingAccount, res);

    } catch (error) {
        console.error("Billing PDF Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate invoice PDF",
        });
    }
};

export const downloadThermalBillPDF = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid bill ID" });
        }

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

        const billingAccount = bill.billingAccountId
            ? await BillingAccount.findById(bill.billingAccountId)
            : null;

        generateThermalInvoice(bill, shop, billingAccount, res);

    } catch (error) {
        console.error("Thermal Invoice Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate thermal invoice",
        });
    }
};

export const downloadBillingThermalBillPDF = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid bill ID" });
        }

        // req.billingAccount guaranteed by billingAuthMiddleware
        const bill = await Bill.findOne({
            _id: id,
            billingAccountId: req.billingAccount._id,
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        const shop = await Shop.findById(bill.shopId);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const billingAccount = await BillingAccount.findById(
            bill.billingAccountId
        );

        generateThermalInvoice(bill, shop, billingAccount, res);

    } catch (error) {
        console.error("Billing Thermal Invoice Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate thermal invoice",
        });
    }
};
