import Product from "../models/product.model.js";
import Shop from "../models/shop.model.js";
import InventoryActivity from "../models/inventoryActivity.model.js";

export const createProduct = async (req, res) => {
    try {
        const {name, sku, barcode, category, unit, purchasePrice, sellingPrice, gstRate, stock, lowStockLimit } = req.body;

        if (
            !name ||
            purchasePrice === undefined ||
            sellingPrice === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, purchase price and selling price are required",
            });
        }

        const ownerId = req.owner._id;

        const shop = await Shop.findOne({
            ownerId,
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        if (sku) {
            const existingSku =
                await Product.findOne({
                    shopId: shop._id,
                    sku: sku.trim().toUpperCase(),
                });

            if (existingSku) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Product with this SKU already exists",
                });
            }
        }

        if (barcode) {
            const existingBarcode =
                await Product.findOne({
                    shopId: shop._id,
                    barcode: barcode.trim(),
                });

            if (existingBarcode) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Product with this barcode already exists",
                });
            }
        }

        const product = await Product.create({
            ownerId,
            shopId: shop._id,

            name: name.trim(),

            sku: sku
                ? sku.trim().toUpperCase()
                : undefined,

            barcode: barcode?.trim(),

            category: category?.trim(),

            unit: unit || "pcs",

            purchasePrice: Number(
                purchasePrice
            ),

            sellingPrice: Number(
                sellingPrice
            ),

            gstRate: Number(gstRate || 0),

            stock: Number(stock || 0),

            lowStockLimit: Number(
                lowStockLimit || 5
            ),
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",

            data: {
                product,
            },
        });

    } catch (error) {
        console.error(
            "Create Product Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while creating product",
        });
    }
};

export const getProducts = async (req, res) => {
    try {
        const ownerId =
            req.owner?._id ||
            req.billingAccount?.ownerId;

        const shopId =
            req.owner?.shopId ||
            req.billingAccount?.shopId;

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

        const previousStock = product.stock;

        product.stock += Number(quantity);

        await product.save();

        await InventoryActivity.create({
            ownerId: req.owner._id,
            shopId: product.shopId,
            productId: product._id,

            type: "stock_added",

            quantity: Number(quantity),

            previousStock,

            newStock: product.stock,

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
                    id: product._id,
                    name: product.name,
                    stock: product.stock,
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

        const removeQuantity =
            Number(quantity);

        if (removeQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot remove more stock than available",
            });
        }

        const previousStock = product.stock;

        product.stock -= removeQuantity;

        await product.save();

        await InventoryActivity.create({
            ownerId: req.owner._id,
            shopId: product.shopId,
            productId: product._id,

            type: "stock_removed",

            quantity: removeQuantity,

            previousStock,

            newStock: product.stock,

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
                    id: product._id,
                    name: product.name,
                    stock: product.stock,
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

        const {
            purchasePrice,
            sellingPrice,
            gstRate,
            lowStockLimit,
            category,
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

        // Update only provided fields
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