import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import Product from "../models/ProductModel/product.model.js";
import "../models/ProductModel/category.model.js";
import "../models/ProductModel/mainProduct.model.js";
import "../models/ProductModel/brandProduct.model.js";
import BillingAccount from "../models/billingAccount.model.js";
import InventoryActivity from "../models/inventoryActivity.model.js";

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

const resolveDateRanges = (range = "last7", startDateParam, endDateParam) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    let currentStart = todayStart;
    let currentEnd = todayEnd;
    let prevStart;
    let prevEnd;
    let label = "Last 7 Days";

    switch (range) {
        case "today": {
            currentStart = todayStart;
            currentEnd = todayEnd;
            prevStart = new Date(todayStart);
            prevStart.setDate(prevStart.getDate() - 1);
            prevEnd = endOfDay(prevStart);
            label = "Today";
            break;
        }
        case "yesterday": {
            currentStart = new Date(todayStart);
            currentStart.setDate(currentStart.getDate() - 1);
            currentEnd = endOfDay(currentStart);
            prevStart = new Date(currentStart);
            prevStart.setDate(prevStart.getDate() - 1);
            prevEnd = endOfDay(prevStart);
            label = "Yesterday";
            break;
        }
        case "last30": {
            currentStart = new Date(todayStart);
            currentStart.setDate(currentStart.getDate() - 29);
            currentEnd = todayEnd;
            prevEnd = new Date(currentStart.getTime() - 1);
            prevStart = startOfDay(new Date(prevEnd.getTime() - 29 * 86400000));
            label = "Last 30 Days";
            break;
        }
        case "thisMonth": {
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            currentEnd = todayEnd;
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            label = "This Month";
            break;
        }
        case "lastMonth": {
            currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
            prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
            label = "Last Month";
            break;
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
                currentStart = startOfDay(orderedStart);
                currentEnd = endOfDay(orderedEnd);
                const durationMs = currentEnd.getTime() - currentStart.getTime();
                prevEnd = new Date(currentStart.getTime() - 1);
                prevStart = startOfDay(new Date(prevEnd.getTime() - durationMs));
                label = `${currentStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${currentEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
                break;
            }
            // Fallback to last7 if invalid custom dates
            currentStart = new Date(todayStart);
            currentStart.setDate(currentStart.getDate() - 6);
            currentEnd = todayEnd;
            prevEnd = new Date(currentStart.getTime() - 1);
            prevStart = startOfDay(new Date(prevEnd.getTime() - 6 * 86400000));
            label = "Last 7 Days";
            break;
        }
        case "last7":
        default: {
            currentStart = new Date(todayStart);
            currentStart.setDate(currentStart.getDate() - 6);
            currentEnd = todayEnd;
            prevEnd = new Date(currentStart.getTime() - 1);
            prevStart = startOfDay(new Date(prevEnd.getTime() - 6 * 86400000));
            label = "Last 7 Days";
            break;
        }
    }

    return {
        range,
        label,
        currentStart,
        currentEnd,
        prevStart,
        prevEnd,
        todayStart,
        todayEnd,
    };
};

const calcPercentChange = (current, previous) => {
    const curr = Number(current || 0);
    const prev = Number(previous || 0);
    if (prev === 0) {
        if (curr === 0) return 0;
        return null; // Cannot compute meaningful % increase from 0
    }
    return Number((((curr - prev) / prev) * 100).toFixed(1));
};

const getProductDisplayName = (product) => {
    return (
        product?.brandProductId?.name ||
        product?.brandProductId?.brandName ||
        product?.mainProductId?.name ||
        "Unnamed Product"
    );
};

export const getDashboardOverview = async (req, res) => {
    try {
        const ownerId = req.owner?._id;
        const shopId = req.shop?._id;

        if (!ownerId || !shopId) {
            return res.status(401).json({
                success: false,
                message: "Owner or shop not found",
            });
        }

        const { range = "last7", startDate, endDate } = req.query;
        const dates = resolveDateRanges(range, startDate, endDate);

        const yesterdayStart = new Date(dates.todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = endOfDay(yesterdayStart);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Run independent DB queries in parallel
        const [
            currentBills,
            previousBills,
            todayBills,
            yesterdayBills,
            sixMonthBills,
            products,
            billingAccounts,
            recentInvoicesRaw,
            recentActivitiesRaw,
        ] = await Promise.all([
            Bill.find({
                ownerId,
                shopId,
                status: "completed",
                createdAt: { $gte: dates.currentStart, $lte: dates.currentEnd },
            })
                .sort({ createdAt: 1 })
                .lean(),
            Bill.find({
                ownerId,
                shopId,
                status: "completed",
                createdAt: { $gte: dates.prevStart, $lte: dates.prevEnd },
            })
                .select("grandTotal createdAt")
                .lean(),
            Bill.find({
                ownerId,
                shopId,
                status: "completed",
                createdAt: { $gte: dates.todayStart, $lte: dates.todayEnd },
            })
                .select("grandTotal")
                .lean(),
            Bill.find({
                ownerId,
                shopId,
                status: "completed",
                createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
            })
                .select("grandTotal")
                .lean(),
            Bill.find({
                ownerId,
                shopId,
                status: "completed",
                createdAt: { $gte: sixMonthsAgo, $lte: dates.todayEnd },
            })
                .select("grandTotal createdAt")
                .lean(),
            Product.find({
                ownerId,
                shopId,
                isActive: true,
            })
                .populate("categoryId", "name")
                .populate("mainProductId", "name")
                .populate("brandProductId", "name brandName")
                .sort({ createdAt: -1 })
                .lean(),
            BillingAccount.find({
                ownerId,
                shopId,
            })
                .select("name employeeName billingCode status lastSeenAt")
                .sort({ name: 1 })
                .lean(),
            Bill.find({
                ownerId,
                shopId,
            })
                .populate("billingAccountId", "name employeeName billingCode")
                .sort({ createdAt: -1 })
                .limit(6)
                .lean(),
            InventoryActivity.find({
                ownerId,
                shopId,
            })
                .populate({
                    path: "productId",
                    select: "brandProductId mainProductId sellingType unit",
                    populate: [
                        { path: "brandProductId", select: "name brandName" },
                        { path: "mainProductId", select: "name" },
                    ],
                })
                .populate("billingAccountId", "name employeeName billingCode")
                .sort({ createdAt: -1 })
                .limit(6)
                .lean(),
        ]);

        // --------------------------------------------------
        // 1. PRODUCT COST MAP & INVENTORY INSIGHTS
        // --------------------------------------------------
        const productCostMap = new Map();
        const productSalesMap = new Map();

        let lowStockCount = 0;
        let outOfStockCount = 0;
        let stockValuation = 0;
        let valuationItemCount = 0;
        const lowStockItems = [];

        for (const product of products) {
            const pId = String(product._id);
            const pName = getProductDisplayName(product);

            if (product.sellingType === "LOOSE") {
                const stock = Number(product.stock ?? 0);
                const limit = Number(product.lowStockLimit ?? 5);
                const cost = Number(product.purchasePrice ?? 0);

                if (Number.isFinite(cost) && cost >= 0) {
                    stockValuation += stock * cost;
                    valuationItemCount += 1;
                }

                productCostMap.set(pId, cost);

                if (stock <= 0) {
                    outOfStockCount += 1;
                    lowStockCount += 1;
                    lowStockItems.push({
                        productId: pId,
                        productName: pName,
                        variantName: null,
                        currentStock: stock,
                        lowStockLimit: limit,
                        unit: product.unit || "unit",
                        status: "out_of_stock",
                    });
                } else if (stock <= limit) {
                    lowStockCount += 1;
                    lowStockItems.push({
                        productId: pId,
                        productName: pName,
                        variantName: null,
                        currentStock: stock,
                        lowStockLimit: limit,
                        unit: product.unit || "unit",
                        status: "low_stock",
                    });
                }

                productSalesMap.set(pId, {
                    productId: pId,
                    name: pName,
                    category: product.categoryId?.name || "",
                    currentStock: stock,
                    unit: product.unit || "unit",
                    unitsSold: 0,
                    revenue: 0,
                    createdAt: product.createdAt,
                });
            } else if (product.sellingType === "VARIANT") {
                const activeVariants = (product.variants || []).filter(
                    (v) => v.isActive !== false
                );
                let totalVariantStock = 0;

                for (const variant of activeVariants) {
                    const vId = String(variant._id);
                    const vStock = Number(variant.stock ?? 0);
                    const vLimit = Number(variant.lowStockLimit ?? 5);
                    const vCost = Number(variant.purchasePrice ?? 0);

                    totalVariantStock += vStock;

                    if (Number.isFinite(vCost) && vCost >= 0) {
                        stockValuation += vStock * vCost;
                        valuationItemCount += 1;
                    }

                    productCostMap.set(`${pId}:${vId}`, vCost);

                    if (vStock <= 0) {
                        outOfStockCount += 1;
                        lowStockCount += 1;
                        lowStockItems.push({
                            productId: pId,
                            productName: pName,
                            variantName: variant.variantName,
                            currentStock: vStock,
                            lowStockLimit: vLimit,
                            unit: variant.unit || "pcs",
                            status: "out_of_stock",
                        });
                    } else if (vStock <= vLimit) {
                        lowStockCount += 1;
                        lowStockItems.push({
                            productId: pId,
                            productName: pName,
                            variantName: variant.variantName,
                            currentStock: vStock,
                            lowStockLimit: vLimit,
                            unit: variant.unit || "pcs",
                            status: "low_stock",
                        });
                    }
                }

                productSalesMap.set(pId, {
                    productId: pId,
                    name: pName,
                    category: product.categoryId?.name || "",
                    currentStock: totalVariantStock,
                    unit: activeVariants[0]?.unit || "pcs",
                    unitsSold: 0,
                    revenue: 0,
                    createdAt: product.createdAt,
                });
            }
        }

        // --------------------------------------------------
        // 2. REVENUE, PROFIT, PAYMENT, COUNTER & CASHIER
        // --------------------------------------------------
        const todaySales = todayBills.reduce((sum, b) => sum + Number(b.grandTotal || 0), 0);
        const yesterdaySales = yesterdayBills.reduce((sum, b) => sum + Number(b.grandTotal || 0), 0);

        let totalRevenue = 0;
        const totalBills = currentBills.length;
        let previousRevenue = 0;
        const previousBillsCount = previousBills.length;

        for (const b of previousBills) {
            previousRevenue += Number(b.grandTotal || 0);
        }

        const paymentMap = {
            cash: 0,
            upi: 0,
            card: 0,
            mixed: 0,
        };

        // Initialize counter buckets for every registered BillingAccount
        const counterMap = new Map();
        for (const acc of billingAccounts) {
            counterMap.set(String(acc._id), {
                id: String(acc._id),
                counterName: acc.name,
                billingCode: acc.billingCode,
                cashierName: acc.employeeName || acc.name,
                status: acc.status,
                totalSales: 0,
                billCount: 0,
            });
        }

        let ownerDirectBucket = {
            id: "owner",
            counterName: "Owner Desk",
            billingCode: "OWNER",
            cashierName: req.owner?.name || "Store Owner",
            status: "active",
            totalSales: 0,
            billCount: 0,
        };

        let estimatedNetRevenueForProfit = 0;
        let estimatedCogs = 0;
        let matchedCostItemsCount = 0;
        let totalSoldItemsCount = 0;

        // Daily trend bucket map for selected range
        const dailyMap = new Map();
        const cursor = new Date(dates.currentStart);
        while (cursor <= dates.currentEnd) {
            const isoKey = cursor.toISOString().slice(0, 10);
            dailyMap.set(isoKey, {
                iso: isoKey,
                date: cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                sales: 0,
                previousSales: 0,
                bills: 0,
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        // Map previous period sales into aligned daily buckets for comparison
        const prevDurationOffsetMs = dates.currentStart.getTime() - dates.prevStart.getTime();
        for (const prevBill of previousBills) {
            const alignedDate = new Date(new Date(prevBill.createdAt).getTime() + prevDurationOffsetMs);
            const isoKey = alignedDate.toISOString().slice(0, 10);
            const bucket = dailyMap.get(isoKey);
            if (bucket) {
                bucket.previousSales += Number(prevBill.grandTotal || 0);
            }
        }

        for (const bill of currentBills) {
            const amount = Number(bill.grandTotal || 0);
            totalRevenue += amount;

            const method = String(bill.paymentMethod || "cash").toLowerCase();
            if (paymentMap[method] !== undefined) {
                paymentMap[method] += amount;
            } else {
                paymentMap.mixed += amount;
            }

            if (bill.billingAccountId) {
                const cKey = String(bill.billingAccountId);
                const bucket = counterMap.get(cKey);
                if (bucket) {
                    bucket.totalSales += amount;
                    bucket.billCount += 1;
                } else {
                    counterMap.set(cKey, {
                        id: cKey,
                        counterName: "Archived Counter",
                        billingCode: "-",
                        cashierName: "Unknown Cashier",
                        status: "disabled",
                        totalSales: amount,
                        billCount: 1,
                    });
                }
            } else {
                ownerDirectBucket.totalSales += amount;
                ownerDirectBucket.billCount += 1;
            }

            const isoKey = new Date(bill.createdAt).toISOString().slice(0, 10);
            const dayBucket = dailyMap.get(isoKey);
            if (dayBucket) {
                dayBucket.sales += amount;
                dayBucket.bills += 1;
            }

            // Item-level sales & gross profit estimation
            const subtotal = Number(bill.subtotal || 0);
            const discount = Number(bill.discount || 0);
            const discountRatio = subtotal > 0 ? Math.min(1, discount / subtotal) : 0;

            for (const item of bill.items || []) {
                const pId = String(item.productId);
                const qty = Number(item.quantity || 0);
                const itemNetBeforeDiscount = Number(item.unitPrice || 0) * qty;
                const itemNetAfterDiscount = itemNetBeforeDiscount * (1 - discountRatio);

                const prodSale = productSalesMap.get(pId);
                if (prodSale) {
                    prodSale.unitsSold += qty;
                    prodSale.revenue += Number(item.total || 0);
                }

                totalSoldItemsCount += 1;
                const costKey = item.variantId ? `${pId}:${String(item.variantId)}` : pId;
                if (productCostMap.has(costKey)) {
                    const unitCost = productCostMap.get(costKey);
                    estimatedCogs += unitCost * qty;
                    estimatedNetRevenueForProfit += itemNetAfterDiscount;
                    matchedCostItemsCount += 1;
                }
            }
        }

        // Weekly & Monthly trends from 6-month bills
        const weeklyMap = new Map();
        const monthlyMap = new Map();
        for (let i = 5; i >= 0; i--) {
            const mDate = new Date();
            mDate.setMonth(mDate.getMonth() - i);
            const mKey = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, "0")}`;
            monthlyMap.set(mKey, {
                date: mDate.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
                sales: 0,
                bills: 0,
            });
        }

        for (const b of sixMonthBills) {
            const d = new Date(b.createdAt);
            const amt = Number(b.grandTotal || 0);

            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (monthlyMap.has(mKey)) {
                monthlyMap.get(mKey).sales += amt;
                monthlyMap.get(mKey).bills += 1;
            }

            // Last 8 weeks grouping (by week start Monday)
            const day = d.getDay();
            const diffToMon = (day === 0 ? -6 : 1) - day;
            const weekStart = startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMon));
            const wKey = weekStart.toISOString().slice(0, 10);
            if (!weeklyMap.has(wKey)) {
                weeklyMap.set(wKey, {
                    iso: wKey,
                    date: weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                    sales: 0,
                    bills: 0,
                });
            }
            weeklyMap.get(wKey).sales += amt;
            weeklyMap.get(wKey).bills += 1;
        }

        const weeklyTrend = Array.from(weeklyMap.values())
            .sort((a, b) => a.iso.localeCompare(b.iso))
            .slice(-8)
            .map((w) => ({ date: w.date, sales: Math.round(w.sales), bills: w.bills }));

        const monthlyTrend = Array.from(monthlyMap.values()).map((m) => ({
            date: m.date,
            sales: Math.round(m.sales),
            bills: m.bills,
        }));

        const dailyTrend = Array.from(dailyMap.values()).map((d) => ({
            date: d.date,
            sales: Math.round(d.sales),
            previousSales: Math.round(d.previousSales),
            bills: d.bills,
        }));

        // Counter & Cashier metrics
        const countersList = Array.from(counterMap.values());
        if (ownerDirectBucket.billCount > 0) {
            countersList.push(ownerDirectBucket);
        }

        const totalCounterSales = countersList.reduce((s, c) => s + c.totalSales, 0);
        const formattedCounters = countersList
            .map((c) => ({
                ...c,
                totalSales: Math.round(c.totalSales),
                avgBillValue: c.billCount > 0 ? Math.round(c.totalSales / c.billCount) : 0,
                contributionPct:
                    totalCounterSales > 0
                        ? Number(((c.totalSales / totalCounterSales) * 100).toFixed(1))
                        : 0,
            }))
            .sort((a, b) => b.totalSales - a.totalSales);

        const activeSellingCounters = formattedCounters.filter((c) => c.billCount > 0);
        const highestCounter = activeSellingCounters.length > 0 ? activeSellingCounters[0] : null;
        const lowestCounter =
            activeSellingCounters.length > 1
                ? activeSellingCounters[activeSellingCounters.length - 1]
                : null;

        // Payment breakdown
        const paymentBreakdown = Object.entries(paymentMap)
            .filter(([, val]) => val > 0)
            .map(([method, val]) => ({
                name: method.toUpperCase(),
                method,
                value: Math.round(val),
                percentage:
                    totalRevenue > 0 ? Number(((val / totalRevenue) * 100).toFixed(1)) : 0,
            }));

        // Top-selling & slow-moving products
        const allProductSales = Array.from(productSalesMap.values());
        const topSellingProducts = [...allProductSales]
            .filter((p) => p.unitsSold > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((p) => ({ ...p, revenue: Math.round(p.revenue) }));

        const slowMovingProducts = [...allProductSales]
            .sort((a, b) => a.unitsSold - b.unitsSold || b.currentStock - a.currentStock)
            .slice(0, 5)
            .map((p) => ({ ...p, revenue: Math.round(p.revenue) }));

        const recentlyAddedProducts = products.slice(0, 5).map((p) => ({
            productId: String(p._id),
            name: getProductDisplayName(p),
            category: p.categoryId?.name || "",
            sellingType: p.sellingType,
            createdAt: p.createdAt,
        }));

        // Gross profit availability
        const profitAvailable = totalSoldItemsCount === 0 || matchedCostItemsCount > 0;
        const grossProfitValue = Math.round(estimatedNetRevenueForProfit - estimatedCogs);

        // Business Alerts & Insights (100% real data)
        const alerts = [];
        if (outOfStockCount > 0) {
            alerts.push({
                id: "out-of-stock",
                severity: "danger",
                message: `${outOfStockCount} product${outOfStockCount === 1 ? " is" : "s are"} currently out of stock.`,
            });
        }
        if (lowStockCount > outOfStockCount) {
            const lowOnly = lowStockCount - outOfStockCount;
            alerts.push({
                id: "low-stock",
                severity: "warning",
                message: `${lowOnly} item${lowOnly === 1 ? " is" : "s are"} running low on stock.`,
            });
        }
        if (highestCounter) {
            alerts.push({
                id: "top-counter",
                severity: "success",
                message: `${highestCounter.counterName} generated the highest sales (₹${highestCounter.totalSales.toLocaleString("en-IN")}) in ${dates.label.toLowerCase()}.`,
            });
        }
        if (totalBills === 0) {
            alerts.push({
                id: "no-sales",
                severity: "info",
                message: `No sales recorded during ${dates.label.toLowerCase()}.`,
            });
        } else {
            const revChange = calcPercentChange(totalRevenue, previousRevenue);
            if (revChange !== null && revChange !== 0) {
                alerts.push({
                    id: "rev-change",
                    severity: revChange > 0 ? "success" : "warning",
                    message: `Revenue ${revChange > 0 ? "increased" : "decreased"} by ${Math.abs(revChange)}% compared to the previous period.`,
                });
            }
        }

        // Format recent invoices & inventory activities
        const recentInvoices = recentInvoicesRaw.map((b) => ({
            id: String(b._id),
            invoiceNumber: b.invoiceNumber,
            grandTotal: Math.round(Number(b.grandTotal || 0)),
            paymentMethod: b.paymentMethod,
            status: b.status,
            counterName: b.billingAccountId?.name || "Owner Desk",
            cashierName: b.billingAccountId?.employeeName || b.billingAccountId?.name || "Owner",
            createdAt: b.createdAt,
        }));

        const recentInventoryActivities = recentActivitiesRaw.map((a) => ({
            id: String(a._id),
            type: a.type,
            quantity: a.quantity,
            previousStock: a.previousStock,
            newStock: a.newStock,
            variantName: a.variantName,
            productName: a.productId
                ? getProductDisplayName(a.productId)
                : "Product",
            unit: a.productId?.unit || "",
            actorName: a.billingAccountId?.employeeName || a.billingAccountId?.name || "Owner",
            reason: a.reason || "",
            createdAt: a.createdAt,
        }));

        return res.status(200).json({
            success: true,
            data: {
                dateRange: {
                    range: dates.range,
                    label: dates.label,
                    start: dates.currentStart,
                    end: dates.currentEnd,
                },
                kpis: {
                    todaySales: {
                        value: Math.round(todaySales),
                        previous: Math.round(yesterdaySales),
                        changePct: calcPercentChange(todaySales, yesterdaySales),
                    },
                    totalBills: {
                        value: totalBills,
                        previous: previousBillsCount,
                        changePct: calcPercentChange(totalBills, previousBillsCount),
                    },
                    totalRevenue: {
                        value: Math.round(totalRevenue),
                        previous: Math.round(previousRevenue),
                        changePct: calcPercentChange(totalRevenue, previousRevenue),
                    },
                    grossProfit: {
                        available: profitAvailable,
                        value: grossProfitValue,
                        matchedItems: matchedCostItemsCount,
                        totalItems: totalSoldItemsCount,
                        note: "Estimated using current product purchase prices (historical cost is not stored per invoice item).",
                    },
                    totalActiveProducts: {
                        value: products.length,
                    },
                    lowStockProducts: {
                        value: lowStockCount,
                        outOfStock: outOfStockCount,
                    },
                },
                counters: {
                    items: formattedCounters,
                    totalCounterSales: Math.round(totalCounterSales),
                    highestCounter,
                    lowestCounter,
                },
                cashiers: formattedCounters,
                salesAnalytics: {
                    dailyTrend,
                    weeklyTrend,
                    monthlyTrend,
                    paymentBreakdown,
                    periodComparison: {
                        currentRevenue: Math.round(totalRevenue),
                        previousRevenue: Math.round(previousRevenue),
                        revenueChangePct: calcPercentChange(totalRevenue, previousRevenue),
                        currentBills: totalBills,
                        previousBills: previousBillsCount,
                        billsChangePct: calcPercentChange(totalBills, previousBillsCount),
                    },
                },
                inventory: {
                    totalActiveProducts: products.length,
                    lowStockCount,
                    outOfStockCount,
                    stockValuation: {
                        available: valuationItemCount > 0,
                        value: Math.round(stockValuation),
                    },
                    lowStockItems: lowStockItems.slice(0, 15),
                    recentlyAddedProducts,
                    topSellingProducts,
                    slowMovingProducts,
                },
                recentActivity: {
                    invoices: recentInvoices,
                    inventoryTransactions: recentInventoryActivities,
                    recentlyAddedProducts,
                },
                alerts,
            },
        });
    } catch (error) {
        console.error("Dashboard Overview Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard overview",
        });
    }
};
