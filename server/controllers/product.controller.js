import Product from "../models/product.model.js";
import Shop from "../models/shop.model.js";


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