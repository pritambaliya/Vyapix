import mongoose from "mongoose";

import Product from "../../models/ProductModel/product.model.js";
import Category from "../../models/ProductModel/category.model.js";
import MainProduct from "../../models/ProductModel/mainProduct.model.js";
import BrandProduct from "../../models/ProductModel/brandProduct.model.js";
import InventoryActivity from "../../models/inventoryActivity.model.js";


const getOwnerId = (req) => {
    return req.owner?._id || req.user?._id;
};

const getShopId = (req) => {
    return (
        req.owner?.shopId ||
        req.shop?._id ||
        req.billingAccount?.shopId
    );
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getInventoryFilter = (req) => ({
    ownerId: req.billingAccount?.ownerId || getOwnerId(req),
    shopId: getShopId(req)
});

const populateProduct = (query) => {
    return query
        .populate("categoryId", "name")
        .populate("mainProductId", "name image")
        .populate("brandProductId", "name brandName image");
};

const validateProductReferences = async ({
    categoryId,
    mainProductId,
    brandProductId,
    ownerId
}) => {

    const category = await Category.findOne({
        _id: categoryId,
        isActive: true,
        $or: [
            { ownerId: null },
            { ownerId }
        ]
    });

    if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
    }

    const mainProduct = await MainProduct.findOne({
        _id: mainProductId,
        categoryId,
        isActive: true,
        $or: [
            { ownerId: null },
            { ownerId }
        ]
    });

    if (!mainProduct) {
        throw new Error("MAIN_PRODUCT_NOT_FOUND");
    }

    const brandProduct = await BrandProduct.findOne({
        _id: brandProductId,
        mainProductId,
        isActive: true,
        $or: [
            { ownerId: null },
            { ownerId }
        ]
    });

    if (!brandProduct) {
        throw new Error("BRAND_PRODUCT_NOT_FOUND");
    }

    return { category, mainProduct, brandProduct };
};

const validateSellingConfiguration = (data) => {

    if (data.sellingType === "LOOSE") {

        if (
            !data.unit ||
            data.purchasePrice == null ||
            data.sellingPrice == null
        ) {
            throw new Error("INVALID_LOOSE_PRODUCT");
        }

        if (
            !Number.isFinite(Number(data.purchasePrice)) ||
            !Number.isFinite(Number(data.sellingPrice)) ||
            Number(data.purchasePrice) < 0 ||
            Number(data.sellingPrice) < 0
        ) {
            throw new Error("INVALID_PRICE");
        }

        if (data.stock != null && Number(data.stock) < 0) {
            throw new Error("INVALID_STOCK");
        }
    }

    else if (data.sellingType === "VARIANT") {

        if (!Array.isArray(data.variants) || data.variants.length === 0) {
            throw new Error("VARIANTS_REQUIRED");
        }

        for (const variant of data.variants) {

            if (
                !variant.variantName?.trim() ||
                !variant.unit ||
                variant.quantity == null ||
                Number(variant.quantity) <= 0 ||
                variant.purchasePrice == null ||
                variant.sellingPrice == null
            ) {
                throw new Error("INVALID_VARIANT");
            }

            if (
                Number(variant.purchasePrice) < 0 ||
                Number(variant.sellingPrice) < 0 ||
                Number(variant.stock || 0) < 0
            ) {
                throw new Error("INVALID_VARIANT_PRICE_OR_STOCK");
            }
        }
    }

    else {
        throw new Error("INVALID_SELLING_TYPE");
    }
};

const validateVariantIdentifiers = async ({
    shopId,
    variants,
    excludeProductId = null
}) => {
    const skuSet = new Set();
    const barcodeSet = new Set();

    for (const variant of variants) {
        const sku = variant.sku?.trim().toUpperCase();
        const barcode = variant.barcode?.trim();

        if (sku) {
            if (skuSet.has(sku)) {
                throw new Error("DUPLICATE_SKU");
            }

            skuSet.add(sku);

            const existingSKU = await Product.findOne({
                shopId,
                ...(excludeProductId && {
                    _id: { $ne: excludeProductId }
                }),
                $or: [
                    { sku },
                    { "variants.sku": sku }
                ]
            });

            if (existingSKU) {
                throw new Error("DUPLICATE_SKU");
            }
        }

        if (barcode) {
            if (barcodeSet.has(barcode)) {
                throw new Error("DUPLICATE_BARCODE");
            }

            barcodeSet.add(barcode);

            const existingBarcode = await Product.findOne({
                shopId,
                ...(excludeProductId && {
                    _id: { $ne: excludeProductId }
                }),
                $or: [
                    { barcode },
                    { "variants.barcode": barcode }
                ]
            });

            if (existingBarcode) {
                throw new Error("DUPLICATE_BARCODE");
            }
        }
    }
};


export const createProduct = async (req, res) => {
    try {
        const { ownerId, shopId } = getInventoryFilter(req);

        if (!ownerId || !shopId) {
            return res.status(401).json({
                success: false,
                message: "Owner or shop not found"
            });
        }

        const {
            categoryId,
            mainProductId,
            brandProductId,
            sellingType,
            unit,
            purchasePrice,
            sellingPrice,
            stock,
            lowStockLimit,
            gstRate,
            sku,
            barcode,
            variants
        } = req.body;

        if (
            !categoryId ||
            !mainProductId ||
            !brandProductId ||
            !sellingType
        ) {
            return res.status(400).json({
                success: false,
                message: "Required product details are missing"
            });
        }

        if (
            !isValidId(categoryId) ||
            !isValidId(mainProductId) ||
            !isValidId(brandProductId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product reference ID"
            });
        }

        // Check whether this Brand Product already has inventory.
        const existingProduct = await Product.findOne({
            ownerId,
            shopId,
            brandProductId,
            isActive: true
        });

        if (existingProduct) {
            const populatedProduct = await populateProduct(
                Product.findById(existingProduct._id)
            );

            return res.status(409).json({
                success: false,
                alreadyExists: true,
                message: "Product already exists. Please edit the existing product.",
                product: populatedProduct
            });
        }

        await validateProductReferences({
            categoryId,
            mainProductId,
            brandProductId,
            ownerId
        });

        validateSellingConfiguration({
            sellingType,
            unit,
            purchasePrice,
            sellingPrice,
            stock,
            variants
        });

        const productData = {
            ownerId,
            shopId,
            categoryId,
            mainProductId,
            brandProductId,
            sellingType,
            gstRate: Number(gstRate ?? 0)
        };

        if (sellingType === "LOOSE") {
            const normalizedSKU = sku?.trim().toUpperCase() || undefined;
            const normalizedBarcode = barcode?.trim() || undefined;

            await validateVariantIdentifiers({
                shopId,
                variants: [{
                    sku: normalizedSKU,
                    barcode: normalizedBarcode
                }]
            });

            Object.assign(productData, {
                unit: unit.trim().toLowerCase(),
                purchasePrice: Number(purchasePrice),
                sellingPrice: Number(sellingPrice),
                stock: Number(stock ?? 0),
                lowStockLimit: Number(lowStockLimit ?? 5),
                sku: normalizedSKU,
                barcode: normalizedBarcode,
                variants: []
            });
        }

        if (sellingType === "VARIANT") {
            const normalizedVariants = variants.map(variant => ({
                variantName: variant.variantName.trim(),
                quantity: Number(variant.quantity),
                unit: variant.unit.trim().toLowerCase(),
                purchasePrice: Number(variant.purchasePrice),
                sellingPrice: Number(variant.sellingPrice),
                gstRate: Number(variant.gstRate ?? gstRate ?? 0),
                stock: Number(variant.stock ?? 0),
                lowStockLimit: Number(variant.lowStockLimit ?? 5),
                sku: variant.sku?.trim().toUpperCase() || undefined,
                barcode: variant.barcode?.trim() || undefined,
                isActive: true
            }));

            await validateVariantIdentifiers({
                shopId,
                variants: normalizedVariants
            });

            productData.sku = undefined;
            productData.barcode = undefined;
            productData.variants = normalizedVariants;
        }

        const product = await Product.create(productData);

        const populatedProduct = await populateProduct(
            Product.findById(product._id)
        );

        return res.status(201).json({
            success: true,
            message: "Product added to inventory successfully",
            product: populatedProduct
        });

    } catch (error) {
        if (error.message === "CATEGORY_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        if (error.message === "MAIN_PRODUCT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Main product not found in selected category"
            });
        }

        if (error.message === "BRAND_PRODUCT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Brand product not found"
            });
        }

        if (error.message === "DUPLICATE_SKU") {
            return res.status(409).json({
                success: false,
                message: "SKU already exists in this shop"
            });
        }

        if (error.message === "DUPLICATE_BARCODE") {
            return res.status(409).json({
                success: false,
                message: "Barcode already exists in this shop"
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A duplicate product or identifier already exists",
                duplicateField: error.keyPattern,
                duplicateValue: error.keyValue
            });
        }

        const validationErrors = [
            "INVALID_LOOSE_PRODUCT",
            "INVALID_PRICE",
            "INVALID_STOCK",
            "VARIANTS_REQUIRED",
            "INVALID_VARIANT",
            "INVALID_VARIANT_PRICE_OR_STOCK",
            "INVALID_SELLING_TYPE"
        ];

        if (validationErrors.includes(error.message)) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error("Create Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
};


export const getProducts = async (req, res) => {
    try {

        const { ownerId, shopId } = getInventoryFilter(req);

        if (!ownerId || !shopId) {
            return res.status(401).json({
                success: false,
                message: "Owner or shop not found"
            });
        }

        const {
            search,
            categoryId,
            sellingType
        } = req.query;

        const filter = {
            ownerId,
            shopId,
            isActive: true
        };

        if (categoryId) {

            if (!isValidId(categoryId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category ID"
                });
            }

            filter.categoryId = categoryId;
        }

        if (sellingType) {
            if (!["LOOSE", "VARIANT"].includes(sellingType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid selling type"
                });
            }

            filter.sellingType = sellingType;
        }

        let products = await populateProduct(
            Product.find(filter).sort({ createdAt: -1 })
        );

        if (search?.trim()) {

            const searchText = search.trim().toLowerCase();

            products = products.filter(product => {

                const mainName = product.mainProductId?.name?.toLowerCase() || "";
                const brandName = (
                    product.brandProductId?.name ||
                    product.brandProductId?.brandName ||
                    ""
                ).toLowerCase();
                const categoryName = product.categoryId?.name?.toLowerCase() || "";

                const variantMatch = product.variants?.some(variant =>
                    variant.variantName.toLowerCase().includes(searchText) ||
                    variant.sku?.toLowerCase().includes(searchText) ||
                    variant.barcode?.includes(searchText)
                );

                return (
                    mainName.includes(searchText) ||
                    brandName.includes(searchText) ||
                    categoryName.includes(searchText) ||
                    variantMatch ||
                    product.sku?.toLowerCase().includes(searchText) ||
                    product.barcode?.includes(searchText)
                );
            });
        }

        return res.status(200).json({
            success: true,
            count: products.length,
            products: products.map(p => {
                const obj = p.toObject ? p.toObject() : { ...p };
                // Add computed display fields for frontend convenience
                obj.name = p.brandProductId?.name || p.brandProductId?.brandName || "Product";
                obj.category = p.categoryId?.name || "";
                obj.mainProduct = p.mainProductId?.name || "";
                return obj;
            })
        });

    } catch (error) {

        console.error("Get Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};

export const getProductByBrandProduct = async (req, res) => {
    try {
        const { ownerId, shopId } = getInventoryFilter(req);
        const { brandProductId } = req.params;

        if (!ownerId || !shopId) {
            return res.status(401).json({
                success: false,
                message: "Owner or shop not found"
            });
        }

        if (!isValidId(brandProductId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid brand product ID"
            });
        }

        const product = await populateProduct(
            Product.findOne({
                ownerId,
                shopId,
                brandProductId,
                isActive: true
            })
        );

        return res.status(200).json({
            success: true,
            exists: Boolean(product),
            product: product || null
        });

    } catch (error) {
        console.error("Get Product By Brand Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};


export const getProductById = async (req, res) => {
    try {

        const { ownerId, shopId } = getInventoryFilter(req);
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await populateProduct(
            Product.findOne({
                _id: id,
                ownerId,
                shopId,
                isActive: true
            })
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {

        console.error("Get Product By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};


export const getProductByBarcode = async (req, res) => {
    try {

        const { ownerId, shopId } = getInventoryFilter(req);
        const { barcode } = req.params;

        if (!barcode?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Barcode is required"
            });
        }

        const product = await Product.findOne({
            ownerId,
            shopId,
            isActive: true,
            $or: [
                { barcode: barcode.trim() },
                { "variants.barcode": barcode.trim() }
            ]
        })
            .populate("categoryId", "name")
            .populate("mainProductId", "name")
            .populate("brandProductId", "name brandName");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found for this barcode"
            });
        }

        let matchedVariant = null;

        if (product.sellingType === "VARIANT") {

            matchedVariant = product.variants.find(
                variant => variant.barcode === barcode.trim()
            );
        }

        return res.status(200).json({
            success: true,
            product,
            matchedVariant
        });

    } catch (error) {

        console.error("Get Product By Barcode Error:", error);

        return res.status(500).json({
            success: false,
            message: "Barcode search failed"
        });
    }
};


export const addStock = async (req, res) => {
    try {
        const { ownerId, shopId } = getInventoryFilter(req);
        const { id } = req.params;
        const { quantity, variantId, note } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const stockQuantity = Number(quantity);

        if (!Number.isFinite(stockQuantity) || stockQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock quantity",
            });
        }

        const product = await Product.findOne({
            _id: id,
            ownerId,
            shopId,
            isActive: true,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        let previousStock;
        let newStock;
        let variantName = null;
        let selectedVariantId = null;

        // VARIANT PRODUCT
        if (product.sellingType === "VARIANT") {

            if (!variantId || !isValidId(variantId)) {
                return res.status(400).json({
                    success: false,
                    message: "Variant ID is required",
                });
            }

            const variant = product.variants.id(variantId);

            if (!variant || !variant.isActive) {
                return res.status(404).json({
                    success: false,
                    message: "Active variant not found",
                });
            }

            // Update ONLY selected variant stock
            previousStock = variant.stock;

            variant.stock += stockQuantity;

            newStock = variant.stock;
            variantName = variant.variantName;
            selectedVariantId = variant._id;

        } else {

            // LOOSE PRODUCT
            if (variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Loose products do not support variants",
                });
            }

            previousStock = product.stock;

            product.stock += stockQuantity;

            newStock = product.stock;
        }

        await product.save();

        await InventoryActivity.create({
            ownerId,
            shopId,
            productId: product._id,
            variantId: selectedVariantId,
            variantName,
            quantity: stockQuantity,
            type: "stock_added",
            previousStock,
            newStock,
            reason: note || "",
        });

        return res.status(200).json({
            success: true,
            message: "Stock added successfully",
            data: {
                productId: product._id,
                variantId: selectedVariantId,
                variantName,
                previousStock,
                newStock,
            },
        });

    } catch (error) {
        console.error("Add Stock Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add stock",
        });
    }
};


export const removeStock = async (req, res) => {
    try {
        const { ownerId, shopId } = getInventoryFilter(req);
        const { id } = req.params;
        const { quantity, variantId, note } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const stockQuantity = Number(quantity);

        if (!Number.isFinite(stockQuantity) || stockQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid quantity is required"
            });
        }

        const product = await Product.findOne({
            _id: id,
            ownerId,
            shopId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let previousStock;
        let newStock;
        let variantName = null;
        let selectedVariantId = null;

        if (product.sellingType === "VARIANT") {

            if (!variantId || !isValidId(variantId)) {
                return res.status(400).json({
                    success: false,
                    message: "Variant ID is required"
                });
            }

            const variant = product.variants.id(variantId);

            if (!variant || !variant.isActive) {
                return res.status(404).json({
                    success: false,
                    message: "Active variant not found"
                });
            }

            if (variant.stock < stockQuantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient variant stock"
                });
            }

            // Update only selected variant stock
            previousStock = variant.stock;

            variant.stock -= stockQuantity;

            newStock = variant.stock;
            variantName = variant.variantName;
            selectedVariantId = variant._id;

        } else {

            if (variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Loose products do not support variants"
                });
            }

            if (product.stock < stockQuantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock"
                });
            }

            previousStock = product.stock;

            product.stock -= stockQuantity;

            newStock = product.stock;
        }

        await product.save();

        await InventoryActivity.create({
            ownerId,
            shopId,
            productId: product._id,
            variantId: selectedVariantId,
            variantName,
            quantity: stockQuantity,
            type: "stock_removed",
            previousStock,
            newStock,
            reason: note || ""
        });

        return res.status(200).json({
            success: true,
            message: "Stock removed successfully",
            data: {
                productId: product._id,
                variantId: selectedVariantId,
                variantName,
                previousStock,
                newStock
            }
        });

    } catch (error) {
        console.error("Remove Stock Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove stock"
        });
    }
};


export const getInventoryHistory = async (req, res) => {
    try {

        const { ownerId, shopId } = getInventoryFilter(req);
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findOne({
            _id: id,
            ownerId,
            shopId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const history = await InventoryActivity.find({
            productId: id,
            ownerId,
            shopId
        })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: history.length,
            history
        });

    } catch (error) {

        console.error("Get Inventory History Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch inventory history"
        });
    }
};


export const updateProduct = async (req, res) => {
    try {
        const { ownerId, shopId } = getInventoryFilter(req);
        const { id } = req.params;

        if (!ownerId || !shopId) {
            return res.status(401).json({
                success: false,
                message: "Owner or shop not found"
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findOne({
            _id: id,
            ownerId,
            shopId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const {
            categoryId,
            mainProductId,
            brandProductId,
            sellingType,
            unit,
            purchasePrice,
            sellingPrice,
            stock,
            lowStockLimit,
            gstRate,
            sku,
            barcode,
            variants
        } = req.body;

        // Hierarchy cannot be changed after product creation.
        if (
            (categoryId !== undefined &&
                String(categoryId) !== String(product.categoryId)) ||
            (mainProductId !== undefined &&
                String(mainProductId) !== String(product.mainProductId)) ||
            (brandProductId !== undefined &&
                String(brandProductId) !== String(product.brandProductId))
        ) {
            return res.status(400).json({
                success: false,
                message: "Category, main product and brand product cannot be changed"
            });
        }

        // Selling type cannot be changed.
        if (
            sellingType !== undefined &&
            sellingType !== product.sellingType
        ) {
            return res.status(400).json({
                success: false,
                message: "Selling type cannot be changed after product creation"
            });
        }

        if (gstRate !== undefined) {
            const rate = Number(gstRate);

            if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid GST rate"
                });
            }

            product.gstRate = rate;
        }

        // LOOSE PRODUCT
        if (product.sellingType === "LOOSE") {
            if (unit !== undefined) {
                if (!unit.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: "Unit is required"
                    });
                }

                product.unit = unit.trim().toLowerCase();
            }

            if (purchasePrice !== undefined) {
                product.purchasePrice = Number(purchasePrice);
            }

            if (sellingPrice !== undefined) {
                product.sellingPrice = Number(sellingPrice);
            }

            if (stock !== undefined) {
                product.stock = Number(stock);
            }

            if (lowStockLimit !== undefined) {
                product.lowStockLimit = Number(lowStockLimit);
            }

            if (sku !== undefined) {
                product.sku = sku?.trim().toUpperCase() || undefined;
            }

            if (barcode !== undefined) {
                product.barcode = barcode?.trim() || undefined;
            }

            validateSellingConfiguration({
                sellingType: "LOOSE",
                unit: product.unit,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
                stock: product.stock
            });

            await validateVariantIdentifiers({
                shopId,
                excludeProductId: product._id,
                variants: [{
                    sku: product.sku,
                    barcode: product.barcode
                }]
            });
        }

        // VARIANT PRODUCT
        if (product.sellingType === "VARIANT") {
            if (!Array.isArray(variants) || variants.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one variant is required"
                });
            }

            const incomingIds = new Set();

            const normalizedVariants = variants.map(incoming => {
                if (
                    !incoming.variantName?.trim() ||
                    !incoming.unit?.trim() ||
                    Number(incoming.quantity) <= 0 ||
                    !Number.isFinite(Number(incoming.purchasePrice)) ||
                    !Number.isFinite(Number(incoming.sellingPrice)) ||
                    Number(incoming.purchasePrice) < 0 ||
                    Number(incoming.sellingPrice) < 0 ||
                    Number(incoming.stock ?? 0) < 0
                ) {
                    throw new Error("INVALID_VARIANT");
                }

                if (incoming._id) {
                    if (!isValidId(incoming._id)) {
                        throw new Error("INVALID_VARIANT_ID");
                    }

                    if (incomingIds.has(String(incoming._id))) {
                        throw new Error("DUPLICATE_VARIANT_ID");
                    }

                    incomingIds.add(String(incoming._id));
                }

                return {
                    ...incoming,
                    variantName: incoming.variantName.trim(),
                    quantity: Number(incoming.quantity),
                    unit: incoming.unit.trim().toLowerCase(),
                    purchasePrice: Number(incoming.purchasePrice),
                    sellingPrice: Number(incoming.sellingPrice),
                    gstRate: Number(incoming.gstRate ?? product.gstRate ?? 0),
                    stock: incoming.stock === undefined
                        ? undefined
                        : Number(incoming.stock),
                    lowStockLimit: Number(incoming.lowStockLimit ?? 5),
                    sku: incoming.sku?.trim().toUpperCase() || undefined,
                    barcode: incoming.barcode?.trim() || undefined
                };
            });

            await validateVariantIdentifiers({
                shopId,
                excludeProductId: product._id,
                variants: normalizedVariants
            });

            // Deactivate old variants first.
            // Never physically remove them.
            product.variants.forEach(existing => {
                existing.isActive = false;
            });

            for (const incoming of normalizedVariants) {
                if (incoming._id) {
                    const existing = product.variants.id(incoming._id);

                    if (!existing) {
                        throw new Error("VARIANT_NOT_FOUND");
                    }

                    existing.variantName = incoming.variantName;
                    existing.quantity = incoming.quantity;
                    existing.unit = incoming.unit;
                    existing.purchasePrice = incoming.purchasePrice;
                    existing.sellingPrice = incoming.sellingPrice;
                    existing.gstRate = incoming.gstRate;
                    existing.lowStockLimit = incoming.lowStockLimit;
                    existing.sku = incoming.sku;
                    existing.barcode = incoming.barcode;

                    // Preserve stock unless explicitly updated.
                    if (incoming.stock !== undefined) {
                        existing.stock = incoming.stock;
                    }

                    existing.isActive = true;

                } else {
                    product.variants.push({
                        variantName: incoming.variantName,
                        quantity: incoming.quantity,
                        unit: incoming.unit,
                        purchasePrice: incoming.purchasePrice,
                        sellingPrice: incoming.sellingPrice,
                        gstRate: incoming.gstRate,
                        stock: incoming.stock ?? 0,
                        lowStockLimit: incoming.lowStockLimit,
                        sku: incoming.sku,
                        barcode: incoming.barcode,
                        isActive: true
                    });
                }
            }

            const activeVariants = product.variants.filter(
                variant => variant.isActive
            );

            if (activeVariants.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one active variant is required"
                });
            }
        }

        await product.save();

        const updatedProduct = await populateProduct(
            Product.findById(product._id)
        );

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        if (
            error.message === "DUPLICATE_SKU" ||
            error.message === "DUPLICATE_BARCODE"
        ) {
            return res.status(409).json({
                success: false,
                message: error.message === "DUPLICATE_SKU"
                    ? "SKU already exists in this shop"
                    : "Barcode already exists in this shop"
            });
        }

        if (
            error.message === "INVALID_VARIANT" ||
            error.message === "INVALID_VARIANT_ID" ||
            error.message === "DUPLICATE_VARIANT_ID"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.message === "VARIANT_NOT_FOUND"
        ) {
            return res.status(404).json({
                success: false,
                message: "Variant not found"
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate SKU or barcode",
                duplicateField: error.keyPattern,
                duplicateValue: error.keyValue
            });
        }

        console.error("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};