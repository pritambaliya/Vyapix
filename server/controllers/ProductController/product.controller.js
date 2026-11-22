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
        .populate("mainProductId", "name")
        .populate("brandProductId", "name");
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
    for (const variant of variants) {

        if (variant.sku) {
            const existingSKU = await Product.findOne({
                shopId,
                ...(excludeProductId && {
                    _id: { $ne: excludeProductId }
                }),
                $or: [
                    { sku: variant.sku },
                    { "variants.sku": variant.sku }
                ]
            });

            if (existingSKU) {
                throw new Error("DUPLICATE_SKU");
            }
        }

        if (variant.barcode) {
            const existingBarcode = await Product.findOne({
                shopId,
                ...(excludeProductId && {
                    _id: { $ne: excludeProductId }
                }),
                $or: [
                    { barcode: variant.barcode },
                    { "variants.barcode": variant.barcode }
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
        const ownerId = getOwnerId(req);
        const shopId = getShopId(req);

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

        // Required fields validation
        if (
            !categoryId ||
            !mainProductId ||
            !brandProductId ||
            !sellingType
        ) {
            return res.status(400).json({
                success: false,
                message: "Category, main product, brand product and selling type are required"
            });
        }

        // Validate ObjectIds
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

        // Validate catalogue references
        await validateProductReferences({
            categoryId,
            mainProductId,
            brandProductId,
            ownerId
        });

        // Validate selling configuration
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
            gstRate: gstRate ?? 0
        };

        if (sellingType === "LOOSE") {

            const normalizedSKU = sku?.trim().toUpperCase() || undefined;
            const normalizedBarcode = barcode?.trim() || undefined;

            // Check duplicate identifiers
            await validateVariantIdentifiers({
                shopId,
                variants: [{
                    sku: normalizedSKU,
                    barcode: normalizedBarcode
                }]
            });

            Object.assign(productData, {
                unit: unit?.trim().toLowerCase(),
                purchasePrice,
                sellingPrice,
                stock: stock ?? 0,
                lowStockLimit: lowStockLimit ?? 5,
                sku: normalizedSKU,
                barcode: normalizedBarcode,
                variants: []
            });

        }

        else if (sellingType === "VARIANT") {

            const normalizedVariants = variants.map(variant => ({
                ...variant,

                variantName: variant.variantName.trim(),

                unit: variant.unit.trim().toLowerCase(),

                sku: variant.sku?.trim().toUpperCase() || undefined,

                barcode: variant.barcode?.trim() || undefined
            }));

            // Check duplicate identifiers
            await validateVariantIdentifiers({
                shopId,
                variants: normalizedVariants
            });

            // Parent-level identifiers must remain empty
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

            console.error("Duplicate Key Error:", {
                keyPattern: error.keyPattern,
                keyValue: error.keyValue
            });

            return res.status(409).json({
                success: false,
                message: "Duplicate SKU or barcode",
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
                const brandName = product.brandProductId?.name?.toLowerCase() || "";
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
            products
        });

    } catch (error) {

        console.error("Get Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products"
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
            .populate("brandProductId", "name");

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
                message: "Invalid product ID"
            });
        }

        if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
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

        let variantName = null;

        if (product.sellingType === "VARIANT") {

            if (!variantId || !isValidId(variantId)) {
                return res.status(400).json({
                    success: false,
                    message: "Variant ID is required"
                });
            }

            const variant = product.variants.id(variantId);

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: "Variant not found"
                });
            }

            variant.stock += Number(quantity);
            variantName = variant.variantName;

        } else {

            if (variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Loose products do not support variant ID"
                });
            }

            product.stock += Number(quantity);
        }

        await product.save();

        await InventoryHistory.create({
            ownerId,
            shopId,
            productId: product._id,
            variantId: variantId || null,
            variantName,
            quantity: Number(quantity),
            type: "ADD",
            note: note || ""
        });

        return res.status(200).json({
            success: true,
            message: "Stock added successfully",
            product
        });

    } catch (error) {

        console.error("Add Stock Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add stock"
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

        if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
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

        let variantName = null;

        if (product.sellingType === "VARIANT") {

            if (!variantId || !isValidId(variantId)) {
                return res.status(400).json({
                    success: false,
                    message: "Variant ID is required"
                });
            }

            const variant = product.variants.id(variantId);

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: "Variant not found"
                });
            }

            if (variant.stock < Number(quantity)) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient variant stock"
                });
            }

            variant.stock -= Number(quantity);
            variantName = variant.variantName;

        } else {

            if (variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Loose products do not support variant ID"
                });
            }

            if (product.stock < Number(quantity)) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock"
                });
            }

            product.stock -= Number(quantity);
        }

        await product.save();

        await InventoryActivity.create({
            ownerId,
            shopId,
            productId: product._id,
            variantId: variantId || null,
            variantName,
            quantity: Number(quantity),
            type: "REMOVE",
            note: note || ""
        });

        return res.status(200).json({
            success: true,
            message: "Stock removed successfully",
            product
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

        const nextSellingType = sellingType || product.sellingType;

        const nextCategoryId = categoryId || product.categoryId;
        const nextMainProductId = mainProductId || product.mainProductId;
        const nextBrandProductId = brandProductId || product.brandProductId;

        if (
            categoryId !== undefined ||
            mainProductId !== undefined ||
            brandProductId !== undefined
        ) {

            await validateProductReferences({
                categoryId: nextCategoryId,
                mainProductId: nextMainProductId,
                brandProductId: nextBrandProductId,
                ownerId
            });

            product.categoryId = nextCategoryId;
            product.mainProductId = nextMainProductId;
            product.brandProductId = nextBrandProductId;
        }

        if (nextSellingType !== product.sellingType) {

            return res.status(400).json({
                success: false,
                message: "Changing selling type requires a separate inventory conversion"
            });
        }

        if (gstRate !== undefined) {
            product.gstRate = gstRate;
        }

        if (product.sellingType === "LOOSE") {

            if (unit !== undefined) product.unit = unit;
            if (purchasePrice !== undefined) product.purchasePrice = purchasePrice;
            if (sellingPrice !== undefined) product.sellingPrice = sellingPrice;
            if (stock !== undefined) product.stock = stock;
            if (lowStockLimit !== undefined) product.lowStockLimit = lowStockLimit;
            if (sku !== undefined) product.sku = sku;
            if (barcode !== undefined) product.barcode = barcode;

        } else if (product.sellingType === "VARIANT") {

            if (!Array.isArray(variants) || variants.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one variant is required"
                });
            }

            // Preserve existing variant IDs when editing.
            // New variants receive new IDs automatically.
            const updatedVariants = [];

            for (const incoming of variants) {

                if (incoming._id) {

                    const existing = product.variants.id(incoming._id);

                    if (!existing) {
                        return res.status(404).json({
                            success: false,
                            message: "Variant not found"
                        });
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
                    existing.isActive = incoming.isActive ?? true;

                    updatedVariants.push(existing);

                } else {

                    updatedVariants.push(incoming);
                }
            }

            product.variants = updatedVariants;
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

        if (error.message === "CATEGORY_NOT_FOUND" ||
            error.message === "MAIN_PRODUCT_NOT_FOUND" ||
            error.message === "BRAND_PRODUCT_NOT_FOUND") {

            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate SKU or barcode"
            });
        }

        console.error("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};


export const deleteProduct = async (req, res) => {
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
            shopId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        product.isActive = false;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {

        console.error("Delete Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
};