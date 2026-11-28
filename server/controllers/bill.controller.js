import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import Product from "../models/ProductModel/product.model.js";
import BrandProduct from "../models/ProductModel/brandProduct.model.js";
import Shop from "../models/shop.model.js";
import InventoryActivity from "../models/inventoryActivity.model.js";
import BillingActivity from "../models/billingActivity.model.js";
import BillingAccount from "../models/billingAccount.model.js";
import generateInvoiceNumber from "../utils/generateInvoiceNumber.js";
import generateInvoicePDF from "../utils/generateInvoicePDF.js";
import generateThermalInvoice from "../utils/generateThermalInvoice.js";

export const createBill = async (req, res) => {
    try {
        const {
            items,
            discount = 0,
            paymentMethod,
            customerName,
            customerPhone,
            notes,
            billingAccountId: requestedBillingAccountId,
        } = req.body;

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

        const numericDiscount = Number(discount);
        if (!Number.isFinite(numericDiscount) || numericDiscount < 0) {
            return res.status(400).json({
                success: false,
                message: "Discount must be a valid non-negative number",
            });
        }

        // ── Resolve identity: cashier or owner ──────────────────────────────
        let billingAccount = req.billingAccount || null;

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

            // If owner selected a specific counter in POS, validate & bind it
            if (requestedBillingAccountId) {
                if (!mongoose.Types.ObjectId.isValid(requestedBillingAccountId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid counter selected",
                    });
                }

                const selectedCounter = await BillingAccount.findOne({
                    _id: requestedBillingAccountId,
                    ownerId: req.owner._id,
                    shopId,
                    status: "active",
                });

                if (!selectedCounter) {
                    return res.status(400).json({
                        success: false,
                        message: "Selected counter not found or inactive",
                    });
                }

                billingAccount = selectedCounter;
            }
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
                        !mongoose.Types.ObjectId.isValid(item.productId) ||
                        !Number.isFinite(Number(item.quantity)) ||
                        Number(item.quantity) <= 0
                    ) {
                        throw new Error("Invalid bill item: valid productId and quantity > 0 are required");
                    }

                    const quantity = Number(item.quantity);
                    const hasVariantId = Boolean(
                        item.variantId && mongoose.Types.ObjectId.isValid(item.variantId)
                    );

                    let product;
                    let matchedVariant = null;

                    if (hasVariantId) {
                        product = await Product.findOneAndUpdate(
                            {
                                _id: item.productId,
                                shopId,
                                isActive: true,
                                sellingType: "VARIANT",
                                variants: {
                                    $elemMatch: {
                                        _id: item.variantId,
                                        stock: { $gte: quantity },
                                    },
                                },
                            },
                            {
                                $inc: { "variants.$.stock": -quantity },
                            },
                            {
                                new: true,
                                session,
                            }
                        );

                        if (product) {
                            matchedVariant = product.variants.find(
                                (v) => String(v._id) === String(item.variantId)
                            );
                        }
                    } else {
                        // Atomic stock decrement for LOOSE products — only proceeds when stock >= quantity
                        product = await Product.findOneAndUpdate(
                            {
                                _id: item.productId,
                                shopId,
                                isActive: true,
                                sellingType: { $ne: "VARIANT" },
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
                    }

                    if (!product) {
                        throw new Error(
                            `Insufficient stock or product not found: ${item.name || item.productId}`
                        );
                    }

                    const unitPrice   = Number(
                        matchedVariant ? matchedVariant.sellingPrice : product.sellingPrice
                    );
                    const gstRate     = Number(
                        matchedVariant
                            ? (matchedVariant.gstRate ?? product.gstRate ?? 0)
                            : (product.gstRate ?? 0)
                    );
                    const baseAmount  = unitPrice * quantity;
                    // GST is treated as exclusive (added on top of selling price)
                    const gstAmount   = baseAmount * (gstRate / 100);
                    const itemTotal   = baseAmount + gstAmount;

                    subtotal += baseAmount;
                    gstTotal += gstAmount;

                    // Product has no 'name' field — resolve it from the brandProduct
                    // Use the client-provided name as a fast path; fall back to DB lookup.
                    let productName = item.name?.trim();
                    if (!productName) {
                        const bp = await BrandProduct.findById(product.brandProductId)
                            .select("name brandName")
                            .lean();
                        const baseName = bp?.name || bp?.brandName || "Product";
                        productName = matchedVariant?.variantName
                            ? `${baseName} – ${matchedVariant.variantName}`
                            : baseName;
                    }

                    const postStock = matchedVariant
                        ? Number(matchedVariant.stock)
                        : Number(product.stock);

                    billItems.push({
                        productId:   product._id,
                        variantId:   matchedVariant?._id || null,
                        variantName: matchedVariant?.variantName || null,
                        name:        productName,
                        sku:         (matchedVariant ? matchedVariant.sku : product.sku) || null,
                        barcode:     (matchedVariant ? matchedVariant.barcode : product.barcode) || null,
                        quantity,
                        unitPrice,
                        gstRate,
                        gstAmount:   Number(gstAmount.toFixed(2)),
                        total:       Number(itemTotal.toFixed(2)),
                    });

                    await InventoryActivity.create(
                        [
                            {
                                ownerId,
                                shopId,
                                productId: product._id,
                                variantId: matchedVariant?._id || null,
                                variantName: matchedVariant?.variantName || null,
                                // FIX C-2: safe optional chaining — null for owner-created bills
                                billingAccountId: billingAccount?._id || null,
                                type: "sale",
                                quantity,
                                // postStock is post-decrement; add quantity back for previousStock
                                previousStock: postStock + quantity,
                                newStock:      postStock,
                                reason: matchedVariant?.variantName
                                    ? `Product sold (${matchedVariant.variantName})`
                                    : "Product sold",
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

const escapeRegex = (str = "") =>
    String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

const resolveBillDateRange = (dateRange = "all", startDateParam, endDateParam) => {
    if (!dateRange || dateRange === "all") return null;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    switch (dateRange) {
        case "today":
            return { start: todayStart, end: todayEnd };
        case "yesterday": {
            const s = new Date(todayStart);
            s.setDate(s.getDate() - 1);
            return { start: s, end: endOfDay(s) };
        }
        case "last7": {
            const s = new Date(todayStart);
            s.setDate(s.getDate() - 6);
            return { start: s, end: todayEnd };
        }
        case "thisMonth": {
            const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            return { start: s, end: todayEnd };
        }
        case "lastMonth": {
            const s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return { start: s, end: e };
        }
        case "custom": {
            const parsedStart = startDateParam ? new Date(startDateParam) : null;
            const parsedEnd = endDateParam ? new Date(endDateParam) : null;
            if (
                parsedStart &&
                parsedEnd &&
                !Number.isNaN(parsedStart.getTime()) &&
                !Number.isNaN(parsedEnd.getTime())
            ) {
                const orderedStart = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
                const orderedEnd = parsedStart <= parsedEnd ? parsedEnd : parsedStart;
                return { start: startOfDay(orderedStart), end: endOfDay(orderedEnd) };
            }
            return null;
        }
        default:
            return null;
    }
};

const buildBillQueryFilter = ({ baseScope, query = {}, allowCounterFilter = true }) => {
    const {
        search,
        billingAccountId,
        paymentMethod,
        paymentStatus,
        status,
        dateRange = "all",
        startDate,
        endDate,
    } = query;

    const filter = { ...baseScope };

    if (search?.trim()) {
        const safePattern = escapeRegex(search.trim());
        filter.$or = [
            { invoiceNumber: { $regex: safePattern, $options: "i" } },
            { customerName: { $regex: safePattern, $options: "i" } },
            { customerPhone: { $regex: safePattern, $options: "i" } },
        ];
    }

    if (allowCounterFilter && billingAccountId) {
        if (billingAccountId === "unassigned" || billingAccountId === "owner") {
            filter.billingAccountId = null;
        } else if (mongoose.Types.ObjectId.isValid(billingAccountId)) {
            filter.billingAccountId = new mongoose.Types.ObjectId(billingAccountId);
        } else {
            return { error: "Invalid billingAccountId" };
        }
    }

    if (paymentMethod) {
        const validMethods = ["cash", "upi", "card", "mixed"];
        if (!validMethods.includes(paymentMethod)) {
            return { error: "Invalid paymentMethod filter" };
        }
        filter.paymentMethod = paymentMethod;
    }

    if (paymentStatus) {
        const validPaymentStatuses = ["paid", "partial", "pending"];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            return { error: "Invalid paymentStatus filter" };
        }
        filter.paymentStatus = paymentStatus;
    }

    if (status) {
        const validStatuses = ["completed", "cancelled", "refunded"];
        if (!validStatuses.includes(status)) {
            return { error: "Invalid status filter" };
        }
        filter.status = status;
    }

    const range = resolveBillDateRange(dateRange, startDate, endDate);
    if (range) {
        filter.createdAt = { $gte: range.start, $lte: range.end };
    }

    return { filter };
};

const resolveBillSort = (sortBy = "createdAt", sortOrder = "desc") => {
    const allowedFields = ["createdAt", "grandTotal"];
    const field = allowedFields.includes(sortBy) ? sortBy : "createdAt";
    const dir = sortOrder === "asc" ? 1 : -1;
    return { [field]: dir, _id: dir };
};

export const getBills = async (req, res) => {
    try {
        const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        const baseScope = {
            ownerId: req.owner._id,
            ...(req.shop?._id ? { shopId: req.shop._id } : {}),
        };

        const { filter, error: filterError } = buildBillQueryFilter({
            baseScope,
            query: req.query,
            allowCounterFilter: true,
        });

        if (filterError) {
            return res.status(400).json({ success: false, message: filterError });
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
        const skip = (safePage - 1) * safeLimit;
        const sort = resolveBillSort(sortBy, sortOrder);

        const [total, bills] = await Promise.all([
            Bill.countDocuments(filter),
            Bill.find(filter)
                .populate("billingAccountId", "accountNumber name employeeName billingCode")
                .populate("ownerId", "name")
                .sort(sort)
                .skip(skip)
                .limit(safeLimit)
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                bills,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
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
        const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        const baseScope = {
            ownerId: req.billingAccount.ownerId,
            shopId: req.billingAccount.shopId,
            billingAccountId: req.billingAccount._id,
        };

        const { filter, error: filterError } = buildBillQueryFilter({
            baseScope,
            query: req.query,
            allowCounterFilter: false,
        });

        if (filterError) {
            return res.status(400).json({ success: false, message: filterError });
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
        const skip = (safePage - 1) * safeLimit;
        const sort = resolveBillSort(sortBy, sortOrder);

        const [total, bills] = await Promise.all([
            Bill.countDocuments(filter),
            Bill.find(filter)
                .populate("billingAccountId", "accountNumber name employeeName billingCode")
                .populate("ownerId", "name")
                .sort(sort)
                .skip(skip)
                .limit(safeLimit)
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                bills,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
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
            ...(req.shop?._id ? { shopId: req.shop._id } : {}),
        })
            .populate("billingAccountId", "accountNumber name employeeName billingCode")
            .populate("ownerId", "name")
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
            return res.status(400).json({
                success: false,
                message: "Invalid bill ID",
            });
        }

        const bill = await Bill.findOne({
            _id: id,
            shopId: req.billingAccount.shopId,
        })
            .populate("billingAccountId", "accountNumber name employeeName billingCode")
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

            const bill = await Bill.findOneAndUpdate(
                {
                    _id: id,
                    ownerId: req.owner._id,
                    status: "completed",
                },
                {
                    $set: { status: "refunded" },
                },
                {
                    new: true,
                    session,
                }
            );

            if (!bill) {
                throw new Error("Bill not found or already refunded");
            }

            for (const item of bill.items) {
                let product;
                let restoredVariant = null;

                if (item.variantId) {
                    product = await Product.findOneAndUpdate(
                        {
                            _id: item.productId,
                            shopId: bill.shopId,
                            "variants._id": item.variantId,
                        },
                        {
                            $inc: { "variants.$.stock": item.quantity },
                        },
                        {
                            new: true,
                            session,
                        }
                    );
                    if (product) {
                        restoredVariant = product.variants.find(
                            (v) => String(v._id) === String(item.variantId)
                        );
                    }
                } else {
                    product = await Product.findOneAndUpdate(
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
                }

                if (!product) {
                    throw new Error(
                        `Product not found during refund: ${item.productId}`
                    );
                }

                const newStock = restoredVariant
                    ? Number(restoredVariant.stock)
                    : Number(product.stock);

                await InventoryActivity.create(
                    [
                        {
                            ownerId:          bill.ownerId,
                            shopId:           bill.shopId,
                            productId:        item.productId,
                            variantId:        item.variantId || null,
                            variantName:      item.variantName || null,
                            billingAccountId: bill.billingAccountId || null,
                            type:             "sale_return",
                            quantity:         item.quantity,
                            previousStock:    newStock - item.quantity,
                            newStock,
                            reason:           `Refund for invoice ${bill.invoiceNumber}`,
                            referenceId:      bill.invoiceNumber,
                        },
                    ],
                    { session }
                );
            }

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

const csvCell = (val) => {
    const str = val === null || val === undefined ? "" : String(val);
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
};

const resolveCounterLabel = (billingAccount) => {
    if (!billingAccount) return "Counter information unavailable";
    return billingAccount.name || billingAccount.accountNumber || "Counter information unavailable";
};

const resolveCashierLabel = (billingAccount) => {
    if (!billingAccount) return "—";
    return billingAccount.employeeName || billingAccount.name || "—";
};

const computeCounterSummaryList = (byCounterDocs, accounts, includeUnassigned = true) => {
    const accountMap = new Map();
    for (const acc of accounts) {
        accountMap.set(String(acc._id), {
            counterId: String(acc._id),
            counterName: acc.name,
            accountNumber: acc.accountNumber || null,
            billingCode: acc.billingCode || null,
            cashierName: acc.employeeName || acc.name || "—",
            status: acc.status || "active",
            totalInvoices: 0,
            totalSales: 0,
            cashSales: 0,
            upiSales: 0,
            cardSales: 0,
            mixedSales: 0,
            otherSales: 0,
            averageBillValue: 0,
        });
    }

    let unassignedBucket = null;

    for (const row of byCounterDocs) {
        const totalSales = Number((row.totalSales || 0).toFixed(2));
        const cashSales = Number((row.cashSales || 0).toFixed(2));
        const upiSales = Number((row.upiSales || 0).toFixed(2));
        const cardSales = Number((row.cardSales || 0).toFixed(2));
        const mixedSales = Number((row.mixedSales || 0).toFixed(2));
        const otherSales = Number((cardSales + mixedSales).toFixed(2));
        const totalInvoices = Number(row.totalInvoices || 0);
        const averageBillValue = totalInvoices > 0 ? Number((totalSales / totalInvoices).toFixed(2)) : 0;

        if (!row._id) {
            if (includeUnassigned && totalInvoices > 0) {
                unassignedBucket = {
                    counterId: "unassigned",
                    counterName: "Counter information unavailable",
                    accountNumber: null,
                    billingCode: null,
                    cashierName: "—",
                    status: "historical",
                    totalInvoices,
                    totalSales,
                    cashSales,
                    upiSales,
                    cardSales,
                    mixedSales,
                    otherSales,
                    averageBillValue,
                };
            }
            continue;
        }

        const key = String(row._id);
        const existing = accountMap.get(key);
        if (existing) {
            existing.totalInvoices = totalInvoices;
            existing.totalSales = totalSales;
            existing.cashSales = cashSales;
            existing.upiSales = upiSales;
            existing.cardSales = cardSales;
            existing.mixedSales = mixedSales;
            existing.otherSales = otherSales;
            existing.averageBillValue = averageBillValue;
        } else {
            accountMap.set(key, {
                counterId: key,
                counterName: "Archived Counter",
                accountNumber: null,
                billingCode: null,
                cashierName: "—",
                status: "disabled",
                totalInvoices,
                totalSales,
                cashSales,
                upiSales,
                cardSales,
                mixedSales,
                otherSales,
                averageBillValue,
            });
        }
    }

    const list = Array.from(accountMap.values()).sort((a, b) => b.totalSales - a.totalSales);
    if (unassignedBucket) {
        list.push(unassignedBucket);
    }
    return list;
};

export const getLedgerSummary = async (req, res) => {
    try {
        const isOwnerUser = Boolean(req.owner && req.shop);
        const ownerId = isOwnerUser ? req.owner._id : req.billingAccount.ownerId;
        const shopId = isOwnerUser ? req.shop._id : req.billingAccount.shopId;

        const baseScope = isOwnerUser
            ? { ownerId, shopId }
            : { ownerId, shopId, billingAccountId: req.billingAccount._id };

        const { filter, error: filterError } = buildBillQueryFilter({
            baseScope,
            query: req.query,
            allowCounterFilter: isOwnerUser,
        });

        if (filterError) {
            return res.status(400).json({ success: false, message: filterError });
        }

        // Counter-wise summary uses the same scope + date/search/payment filters, without locking to one counter
        const { filter: counterFilter } = buildBillQueryFilter({
            baseScope,
            query: { ...req.query, billingAccountId: undefined },
            allowCounterFilter: false,
        });

        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        const [aggResult, counterAggResult, accounts] = await Promise.all([
            Bill.aggregate([
                { $match: filter },
                {
                    $facet: {
                        overview: [
                            {
                                $group: {
                                    _id: null,
                                    totalInvoices: { $sum: 1 },
                                    completedInvoices: {
                                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                                    },
                                    cancelledInvoices: {
                                        $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                                    },
                                    refundedInvoices: {
                                        $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] },
                                    },
                                    totalSalesAmount: {
                                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$grandTotal", 0] },
                                    },
                                    totalPaidAmount: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ["$status", "completed"] },
                                                        { $eq: ["$paymentStatus", "paid"] },
                                                    ],
                                                },
                                                "$grandTotal",
                                                0,
                                            ],
                                        },
                                    },
                                    pendingAmount: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ["$status", "completed"] },
                                                        { $in: ["$paymentStatus", ["pending", "partial"]] },
                                                    ],
                                                },
                                                "$grandTotal",
                                                0,
                                            ],
                                        },
                                    },
                                    refundedAmount: {
                                        $sum: { $cond: [{ $eq: ["$status", "refunded"] }, "$grandTotal", 0] },
                                    },
                                },
                            },
                        ],
                        payments: [
                            { $match: { status: "completed" } },
                            {
                                $group: {
                                    _id: "$paymentMethod",
                                    amount: { $sum: "$grandTotal" },
                                    count: { $sum: 1 },
                                },
                            },
                        ],
                    },
                },
            ]),
            Bill.aggregate([
                { $match: { ...counterFilter, status: "completed" } },
                {
                    $group: {
                        _id: "$billingAccountId",
                        totalInvoices: { $sum: 1 },
                        totalSales: { $sum: "$grandTotal" },
                        cashSales: {
                            $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$grandTotal", 0] },
                        },
                        upiSales: {
                            $sum: { $cond: [{ $eq: ["$paymentMethod", "upi"] }, "$grandTotal", 0] },
                        },
                        cardSales: {
                            $sum: { $cond: [{ $eq: ["$paymentMethod", "card"] }, "$grandTotal", 0] },
                        },
                        mixedSales: {
                            $sum: { $cond: [{ $eq: ["$paymentMethod", "mixed"] }, "$grandTotal", 0] },
                        },
                    },
                },
            ]),
            isOwnerUser
                ? BillingAccount.find({ ownerId, shopId })
                      .select("name accountNumber employeeName billingCode status")
                      .sort({ name: 1 })
                      .lean()
                : Promise.resolve([req.billingAccount]),
        ]);

        const todayAgg = await Bill.aggregate([
            {
                $match: {
                    ...baseScope,
                    status: "completed",
                    createdAt: { $gte: todayStart, $lte: todayEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    todaySales: { $sum: "$grandTotal" },
                    todayInvoices: { $sum: 1 },
                },
            },
        ]);

        const ov = aggResult[0]?.overview?.[0] || {};
        const todayData = todayAgg[0] || {};

        const paymentBreakdown = {
            cash: { amount: 0, count: 0 },
            upi: { amount: 0, count: 0 },
            card: { amount: 0, count: 0 },
            mixed: { amount: 0, count: 0 },
        };

        for (const p of aggResult[0]?.payments || []) {
            const key = String(p._id || "").toLowerCase();
            if (paymentBreakdown[key]) {
                paymentBreakdown[key] = {
                    amount: Number((p.amount || 0).toFixed(2)),
                    count: Number(p.count || 0),
                };
            }
        }

        const counterSummary = computeCounterSummaryList(counterAggResult, accounts, isOwnerUser);

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalInvoices: Number(ov.totalInvoices || 0),
                    completedInvoices: Number(ov.completedInvoices || 0),
                    cancelledInvoices: Number(ov.cancelledInvoices || 0),
                    refundedInvoices: Number(ov.refundedInvoices || 0),
                    todaySales: Number((todayData.todaySales || 0).toFixed(2)),
                    todayInvoices: Number(todayData.todayInvoices || 0),
                    totalSalesAmount: Number((ov.totalSalesAmount || 0).toFixed(2)),
                    totalPaidAmount: Number((ov.totalPaidAmount || 0).toFixed(2)),
                    pendingAmount: Number((ov.pendingAmount || 0).toFixed(2)),
                    refundedAmount: Number((ov.refundedAmount || 0).toFixed(2)),
                },
                paymentBreakdown,
                counterSummary,
                counters: accounts.map((acc) => ({
                    _id: acc._id,
                    name: acc.name,
                    accountNumber: acc.accountNumber,
                    employeeName: acc.employeeName || acc.name,
                    billingCode: acc.billingCode,
                    status: acc.status,
                })),
            },
        });
    } catch (error) {
        console.error("Get Ledger Summary Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching ledger summary",
        });
    }
};

export const exportBillsCsv = async (req, res) => {
    try {
        const isOwnerUser = Boolean(req.owner && req.shop);
        const ownerId = isOwnerUser ? req.owner._id : req.billingAccount.ownerId;
        const shopId = isOwnerUser ? req.shop._id : req.billingAccount.shopId;
        const { type = "invoices", sortBy = "createdAt", sortOrder = "desc" } = req.query;

        const baseScope = isOwnerUser
            ? { ownerId, shopId }
            : { ownerId, shopId, billingAccountId: req.billingAccount._id };

        const { filter, error: filterError } = buildBillQueryFilter({
            baseScope,
            query: req.query,
            allowCounterFilter: isOwnerUser,
        });

        if (filterError) {
            return res.status(400).json({ success: false, message: filterError });
        }

        let headers = [];
        let rows = [];
        let filename = `vyapix-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

        if (type === "counters") {
            const [counterAggResult, accounts] = await Promise.all([
                Bill.aggregate([
                    { $match: { ...filter, status: "completed" } },
                    {
                        $group: {
                            _id: "$billingAccountId",
                            totalInvoices: { $sum: 1 },
                            totalSales: { $sum: "$grandTotal" },
                            cashSales: {
                                $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$grandTotal", 0] },
                            },
                            upiSales: {
                                $sum: { $cond: [{ $eq: ["$paymentMethod", "upi"] }, "$grandTotal", 0] },
                            },
                            cardSales: {
                                $sum: { $cond: [{ $eq: ["$paymentMethod", "card"] }, "$grandTotal", 0] },
                            },
                            mixedSales: {
                                $sum: { $cond: [{ $eq: ["$paymentMethod", "mixed"] }, "$grandTotal", 0] },
                            },
                        },
                    },
                ]),
                isOwnerUser
                    ? BillingAccount.find({ ownerId, shopId })
                          .select("name accountNumber employeeName billingCode status")
                          .sort({ name: 1 })
                          .lean()
                    : Promise.resolve([req.billingAccount]),
            ]);

            const counterSummary = computeCounterSummaryList(counterAggResult, accounts, isOwnerUser);
            headers = [
                "Counter Name",
                "Counter Number",
                "Cashier",
                "Total Invoices",
                "Total Sales",
                "Cash Sales",
                "UPI Sales",
                "Other Payment Sales",
                "Average Bill Value",
            ];
            rows = counterSummary.map((c) => [
                c.counterName,
                c.accountNumber || "-",
                c.cashierName,
                c.totalInvoices,
                c.totalSales.toFixed(2),
                c.cashSales.toFixed(2),
                c.upiSales.toFixed(2),
                c.otherSales.toFixed(2),
                c.averageBillValue.toFixed(2),
            ]);
            filename = `vyapix-counter-sales-${new Date().toISOString().slice(0, 10)}.csv`;
        } else {
            const sort = resolveBillSort(sortBy, sortOrder);
            const bills = await Bill.find(filter)
                .populate("billingAccountId", "accountNumber name employeeName billingCode")
                .sort(sort)
                .limit(5000)
                .lean();

            if (type === "ledger") {
                headers = [
                    "Date & Time",
                    "Invoice Number",
                    "Customer",
                    "Phone",
                    "Counter",
                    "Cashier",
                    "Payment Method",
                    "Entry Type",
                    "Transaction Amount",
                    "Payment Status",
                    "Invoice Status",
                ];
                rows = bills.map((b) => [
                    new Date(b.createdAt).toLocaleString("en-IN"),
                    b.invoiceNumber,
                    b.customerName || "Walk-in Customer",
                    b.customerPhone || "-",
                    resolveCounterLabel(b.billingAccountId),
                    resolveCashierLabel(b.billingAccountId),
                    String(b.paymentMethod || "").toUpperCase(),
                    b.status === "refunded" ? "Debit (Refund)" : "Credit (Sale)",
                    b.status === "refunded"
                        ? (-Number(b.grandTotal || 0)).toFixed(2)
                        : Number(b.grandTotal || 0).toFixed(2),
                    b.paymentStatus || "paid",
                    b.status || "completed",
                ]);
                filename = `vyapix-sales-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
            } else {
                headers = [
                    "Invoice Number",
                    "Date & Time",
                    "Customer",
                    "Phone",
                    "Counter",
                    "Cashier",
                    "Items Count",
                    "Payment Method",
                    "Subtotal",
                    "GST Total",
                    "Discount",
                    "Total Amount",
                    "Payment Status",
                    "Status",
                ];
                rows = bills.map((b) => [
                    b.invoiceNumber,
                    new Date(b.createdAt).toLocaleString("en-IN"),
                    b.customerName || "Walk-in Customer",
                    b.customerPhone || "-",
                    resolveCounterLabel(b.billingAccountId),
                    resolveCashierLabel(b.billingAccountId),
                    Array.isArray(b.items) ? b.items.length : 0,
                    String(b.paymentMethod || "").toUpperCase(),
                    Number(b.subtotal || 0).toFixed(2),
                    Number(b.gstTotal || 0).toFixed(2),
                    Number(b.discount || 0).toFixed(2),
                    Number(b.grandTotal || 0).toFixed(2),
                    b.paymentStatus || "paid",
                    b.status || "completed",
                ]);
                filename = `vyapix-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
            }
        }

        const csvContent = [
            headers.map(csvCell).join(","),
            ...rows.map((r) => r.map(csvCell).join(",")),
        ].join("\r\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).send(`\uFEFF${csvContent}`);
    } catch (error) {
        console.error("Export Bills CSV Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to export CSV report",
        });
    }
};
