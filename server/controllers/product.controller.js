import Product from "../models/product.model.js";
import Shop from "../models/shop.model.js";           // FIX M-4: static import (was dynamic inside request handler)
import InventoryActivity from "../models/inventoryActivity.model.js";

export const createProduct = async (req, res) => {
    try {
        const {
            name,
            sku,
            barcode,
            category,
            sellingType = "FIXED",
            unit = "pcs",
            purchasePrice,
            sellingPrice,
            gstRate,
            stock,
            lowStockLimit
        } = req.body;

        if (
            !name?.trim() ||
            purchasePrice === undefined ||
            sellingPrice === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, purchase price and selling price are required",
            });
        }

        const allowedSellingTypes = ["FIXED", "WEIGHT"];

        if (!allowedSellingTypes.includes(sellingType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid selling type. Use FIXED or WEIGHT",
            });
        }

        const allowedUnits = {
            FIXED: ["pcs", "packet", "box", "bottle", "dozen"],
            WEIGHT: ["kg", "litre"],
        };

        if (!allowedUnits[sellingType].includes(unit.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid unit for ${sellingType} product`,
            });
        }

        const numericFields = {
            purchasePrice: Number(purchasePrice),
            sellingPrice: Number(sellingPrice),
            gstRate: Number(gstRate ?? 0),
            stock: Number(stock ?? 0),
            lowStockLimit: Number(lowStockLimit ?? 5),
        };

        if (
            Object.values(numericFields).some(value => !Number.isFinite(value)) ||
            numericFields.purchasePrice < 0 ||
            numericFields.sellingPrice < 0 ||
            numericFields.gstRate < 0 ||
            numericFields.gstRate > 100 ||
            numericFields.stock < 0 ||
            numericFields.lowStockLimit < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid numeric values",
            });
        }

        const ownerId = req.owner._id;

        const shop = await Shop.findOne({ ownerId });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        if (sku) {
            const existingSku = await Product.findOne({
                shopId: shop._id,
                sku: sku.trim().toUpperCase(),
            });

            if (existingSku) {
                return res.status(409).json({
                    success: false,
                    message: "Product with this SKU already exists",
                });
            }
        }

        if (barcode) {
            const existingBarcode = await Product.findOne({
                shopId: shop._id,
                barcode: barcode.trim(),
            });

            if (existingBarcode) {
                return res.status(409).json({
                    success: false,
                    message: "Product with this barcode already exists",
                });
            }
        }

        const product = await Product.create({
            ownerId,
            shopId: shop._id,

            name: name.trim(),

            sku: sku?.trim().toUpperCase() || undefined,
            barcode: barcode?.trim() || undefined,
            category: category?.trim(),

            sellingType,
            unit: unit.toLowerCase(),

            purchasePrice: numericFields.purchasePrice,
            sellingPrice: numericFields.sellingPrice,
            gstRate: numericFields.gstRate,

            stock: numericFields.stock,
            lowStockLimit: numericFields.lowStockLimit,
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: {
                product,
            },
        });

    } catch (error) {
        console.error("Create Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating product",
        });
    }
};

export const getProducts = async (req, res) => {
    try {
        // Determine identity: owner or cashier (billingAccount)
        const ownerId = req.owner?._id || req.billingAccount?.ownerId;
        let shopId = req.billingAccount?.shopId;

        if (req.owner) {
            // FIX M-4: Shop is now statically imported at the top; no dynamic import needed
            const shop = await Shop.findOne({ ownerId: req.owner._id });
            if (shop) {
                shopId = shop._id;
            }
        }

        if (!ownerId || !shopId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const {search, category, lowStock, page = 1, limit = 20 } = req.query;

        const filter = {ownerId, shopId, isActive: true};

        if (search?.trim()) {
            const searchValue = search.trim();

            filter.$or = [
                {
                    name: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
                {
                    sku: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
                {
                    barcode: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
            ];
        }

        if (category?.trim()) {
            filter.category = category.trim();
        }

        if (lowStock === "true") {
            filter.$expr = {
                $lte: [
                    "$stock",
                    "$lowStockLimit",
                ],
            };
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const total =
            await Product.countDocuments(filter);

        let query = Product.find(filter)
            .sort({ name: 1 })
            .skip(skip)
            .limit(Number(limit));

        if (req.billingAccount) {
            // Hide cost price and owner ID from cashier view
            query = query.select(
                "-purchasePrice -ownerId"
            );
        }

        const products = await query;

        return res.status(200).json({
            success: true,

            data: {
                products,

                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(
                        total / Number(limit)
                    ),
                },
            },
        });

    } catch (error) {
        console.error(
            "Get Products Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching products",
        });
    }
};

export const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;

        if (!barcode?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Barcode is required",
            });
        }

        // req.billingAccount is guaranteed by billingAuthMiddleware on this route
        const product =
            await Product.findOne({
                shopId:
                    req.billingAccount.shopId,

                barcode: barcode.trim(),

                isActive: true,
            }).select(
                "name sku barcode category unit sellingPrice gstRate stock"
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found",
            });
        }

        return res.status(200).json({
            success: true,

            data: {
                product,
            },
        });

    } catch (error) {
        console.error(
            "Barcode Lookup Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while finding product",
        });
    }
};

export const addStock = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            quantity,
            reason,
        } = req.body;

        if (
            quantity === undefined ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be greater than 0",
            });
        }

        const addQty = Number(quantity);

        // FIX H-7: Atomic $inc — eliminates the read-modify-write race condition.
        // `new: false` returns the document state BEFORE the update so we can
        // log the accurate previousStock value in InventoryActivity.
        const previousProduct =
            await Product.findOneAndUpdate(
                {
                    _id: id,
                    ownerId: req.owner._id,
                },
                {
                    $inc: { stock: addQty },
                },
                {
                    new: false, // return pre-update doc to capture previousStock
                }
            );

        if (!previousProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const previousStock = previousProduct.stock;
        const newStock = previousStock + addQty;

        await InventoryActivity.create({
            ownerId: req.owner._id,
            shopId: previousProduct.shopId,
            productId: previousProduct._id,

            type: "stock_added",

            quantity: addQty,

            previousStock,

            newStock,

            reason:
                reason?.trim() ||
                "Stock added",
        });

        return res.status(200).json({
            success: true,

            message:
                "Stock added successfully",

            data: {
                product: {
                    id: previousProduct._id,
                    name: previousProduct.name,
                    stock: newStock,
                },
            },
        });

    } catch (error) {
        console.error(
            "Add Stock Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while adding stock",
        });
    }
};

export const removeStock = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            quantity,
            reason,
        } = req.body;

        if (
            quantity === undefined ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be greater than 0",
            });
        }

        const removeQty = Number(quantity);

        // FIX H-7: Fully atomic — the $gte guard inside the query filter ensures
        // stock sufficiency and the decrement happen in one DB round-trip,
        // eliminating the race condition.
        // `new: false` returns pre-update doc so we can log accurate previousStock.
        const previousProduct =
            await Product.findOneAndUpdate(
                {
                    _id: id,
                    ownerId: req.owner._id,
                    stock: { $gte: removeQty }, // only proceed if stock is sufficient
                },
                {
                    $inc: { stock: -removeQty },
                },
                {
                    new: false,
                }
            );

        if (!previousProduct) {
            // Distinguish "not found" from "insufficient stock"
            const exists = await Product.exists({
                _id: id,
                ownerId: req.owner._id,
            });

            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            return res.status(400).json({
                success: false,
                message:
                    "Cannot remove more stock than available",
            });
        }

        const previousStock = previousProduct.stock;
        const newStock = previousStock - removeQty;

        await InventoryActivity.create({
            ownerId: req.owner._id,
            shopId: previousProduct.shopId,
            productId: previousProduct._id,

            type: "stock_removed",

            quantity: removeQty,

            previousStock,

            newStock,

            reason:
                reason?.trim() ||
                "Stock removed",
        });

        return res.status(200).json({
            success: true,

            message:
                "Stock removed successfully",

            data: {
                product: {
                    id: previousProduct._id,
                    name: previousProduct.name,
                    stock: newStock,
                },
            },
        });

    } catch (error) {
        console.error(
            "Remove Stock Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while removing stock",
        });
    }
};

export const getInventoryHistory = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({
            _id: id,
            ownerId: req.owner._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const activities =
            await InventoryActivity.find({
                productId: product._id,
                ownerId: req.owner._id,
            })
                .populate(
                    "billingAccountId",
                    "accountNumber name employeeName"
                )
                .sort({
                    createdAt: -1,
                })
                .limit(100);

        return res.status(200).json({
            success: true,

            data: {
                product: {
                    id: product._id,
                    name: product.name,
                    stock: product.stock,
                },

                activities,
            },
        });

    } catch (error) {
        console.error(
            "Inventory History Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching inventory history",
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // FIX M-8: All editable fields are now accepted (name, sku, barcode, unit were
        // silently ignored in the original — now they are explicitly handled).
        const {
            name,
            sku,
            barcode,
            unit,
            category,
            purchasePrice,
            sellingPrice,
            gstRate,
            lowStockLimit,
        } = req.body;

        const product = await Product.findOne({
            _id: id,
            ownerId: req.owner._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // ── Core identity fields ──────────────────────────────────────────
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Product name cannot be empty",
                });
            }
            product.name = name.trim();
        }

        if (sku !== undefined) {
            const newSku = sku ? sku.trim().toUpperCase() : undefined;

            if (newSku && newSku !== product.sku) {
                const conflict = await Product.findOne({
                    shopId: product.shopId,
                    sku: newSku,
                    _id: { $ne: id },
                });
                if (conflict) {
                    return res.status(409).json({
                        success: false,
                        message: "Another product with this SKU already exists",
                    });
                }
            }
            product.sku = newSku || null;
        }

        if (barcode !== undefined) {
            const newBarcode = barcode ? barcode.trim() : null;

            if (newBarcode && newBarcode !== product.barcode) {
                const conflict = await Product.findOne({
                    shopId: product.shopId,
                    barcode: newBarcode,
                    _id: { $ne: id },
                });
                if (conflict) {
                    return res.status(409).json({
                        success: false,
                        message: "Another product with this barcode already exists",
                    });
                }
            }
            product.barcode = newBarcode;
        }

        if (unit !== undefined) {
            product.unit = unit.trim() || "pcs";
        }

        // ── Pricing & classification fields ───────────────────────────────
        if (purchasePrice !== undefined) {
            if (Number(purchasePrice) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Purchase price cannot be negative",
                });
            }

            product.purchasePrice = Number(purchasePrice);
        }

        if (sellingPrice !== undefined) {
            if (Number(sellingPrice) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selling price cannot be negative",
                });
            }

            product.sellingPrice = Number(sellingPrice);
        }

        if (gstRate !== undefined) {
            if (
                Number(gstRate) < 0 ||
                Number(gstRate) > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "GST rate must be between 0 and 100",
                });
            }

            product.gstRate = Number(gstRate);
        }

        if (lowStockLimit !== undefined) {
            if (Number(lowStockLimit) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Low stock limit cannot be negative",
                });
            }

            product.lowStockLimit =
                Number(lowStockLimit);
        }

        if (category !== undefined) {
            product.category = category.trim();
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",

            data: {
                product: {
                    id: product._id,
                    name: product.name,
                    sku: product.sku,
                    barcode: product.barcode,
                    unit: product.unit,
                    purchasePrice: product.purchasePrice,
                    sellingPrice: product.sellingPrice,
                    gstRate: product.gstRate,
                    lowStockLimit: product.lowStockLimit,
                    category: product.category,
                    stock: product.stock,
                },
            },
        });

    } catch (error) {
        console.error(
            "Update Product Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating product",
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({
            _id: id,
            ownerId: req.owner._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Soft-delete: marks as inactive so historical bills remain intact
        product.isActive = false;
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete Product Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting product",
        });
    }
};
