import React, { useState, useEffect, useCallback } from 'react';
import {
  Barcode,
  Package,
  Tag,
  Percent,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import BarcodeScanner from './BarcodeScanner';

import productService from '../../services/productService';

const GST_RATES = [0, 5, 12, 18, 28];

const UNITS = [
  'pcs',
  'box',
  'pack',
  'unit',
  'kg',
  'gm',
  'ltr',
  'ml',
];

const INITIAL_VARIANT = {
  variantName: '',
  quantity: '1',
  unit: 'pcs',
  purchasePrice: '',
  sellingPrice: '',
  gstRate: 0,
  stock: '0',
  lowStockLimit: '5',
  sku: '',
  barcode: '',
};

const INITIAL_FORM = {
  categoryId: '',
  mainProductId: '',
  brandProductId: '',
  sellingType: 'LOOSE',

  unit: 'kg',
  purchasePrice: '',
  sellingPrice: '',
  stock: '0',
  lowStockLimit: '5',
  sku: '',
  barcode: '',

  gstRate: 0,
  variants: [{ ...INITIAL_VARIANT }],
};

const getId = (value) => {
  if (!value) return '';
  return typeof value === 'object' ? value._id || value.id || '' : value;
};

const getList = (response) => {
  if (Array.isArray(response)) return response;

  return (
    response?.data?.categories ||
    response?.data?.mainProducts ||
    response?.data?.brandProducts ||
    response?.categories ||
    response?.mainProducts ||
    response?.brandProducts ||
    response?.data ||
    []
  );
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const ProductModal = ({
  isOpen,
  onClose,
  onSave,
  product = null,
  loading = false,
}) => {
  const isEdit = Boolean(product);

  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);

  const [categories, setCategories] = useState([]);
  const [mainProducts, setMainProducts] = useState([]);
  const [brandProducts, setBrandProducts] = useState([]);

  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');

  // ------------------------------------------
  // CATALOGUE OPTIONS
  // ------------------------------------------

  const categoryOptions = categories.map((item) => ({
    value: item._id,
    label: item.name,
  }));

  const mainProductOptions = mainProducts.map((item) => ({
    value: item._id,
    label: item.name,
  }));

  const brandProductOptions = brandProducts.map((item) => ({
    value: item._id,
    label: item.name,
  }));

  const unitOptions = UNITS.map((unit) => ({
    value: unit,
    label: unit,
  }));

  const gstOptions = GST_RATES.map((rate) => ({
    value: String(rate),
    label: `${rate}%`,
  }));

  // ------------------------------------------
  // FETCH CATEGORIES
  // ------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const fetchCategories = async () => {
      setCatalogueLoading(true);
      setCatalogueError('');

      try {
        const response = await productService.getCategories();

        if (cancelled) return;

        setCategories(getList(response));
      } catch (error) {
        if (cancelled) return;

        setCatalogueError(
          getErrorMessage(error, 'Failed to load categories.')
        );
      } finally {
        if (!cancelled) {
          setCatalogueLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // ------------------------------------------
  // FETCH MAIN PRODUCTS
  // ------------------------------------------

  useEffect(() => {
    if (!isOpen || !formData.categoryId) {
      setMainProducts([]);
      return;
    }

    let cancelled = false;

    const fetchMainProducts = async () => {
      try {
        const response = await productService.getMainProducts({
          categoryId: formData.categoryId,
        });

        if (!cancelled) {
          setMainProducts(getList(response));
        }
      } catch (error) {
        if (!cancelled) {
          setMainProducts([]);
          setCatalogueError(
            getErrorMessage(error, 'Failed to load main products.')
          );
        }
      }
    };

    fetchMainProducts();

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.categoryId]);

  // ------------------------------------------
  // FETCH BRAND PRODUCTS
  // ------------------------------------------

  useEffect(() => {
    if (!isOpen || !formData.mainProductId) {
      setBrandProducts([]);
      return;
    }

    let cancelled = false;

    const fetchBrandProducts = async () => {
      try {
        const response = await productService.getBrandProducts({
          mainProductId: formData.mainProductId,
        });

        if (!cancelled) {
          setBrandProducts(getList(response));
        }
      } catch (error) {
        if (!cancelled) {
          setBrandProducts([]);
          setCatalogueError(
            getErrorMessage(error, 'Failed to load brand products.')
          );
        }
      }
    };

    fetchBrandProducts();

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.mainProductId]);

  // ------------------------------------------
  // POPULATE FORM FOR EDITING
  // ------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      const sellingType = product.sellingType || 'LOOSE';

      const categoryId = getId(product.categoryId);
      const mainProductId = getId(product.mainProductId);
      const brandProductId = getId(product.brandProductId);

      const variants =
        Array.isArray(product.variants) && product.variants.length
          ? product.variants.map((variant) => ({
              _id: variant._id,

              variantName: variant.variantName || '',
              quantity: String(variant.quantity ?? 1),
              unit: variant.unit || 'pcs',

              purchasePrice: String(variant.purchasePrice ?? ''),
              sellingPrice: String(variant.sellingPrice ?? ''),

              gstRate: Number(variant.gstRate ?? product.gstRate ?? 0),

              // Stock is displayed but not overwritten by update.
              stock: String(variant.stock ?? 0),
              lowStockLimit: String(variant.lowStockLimit ?? 5),

              sku: variant.sku || '',
              barcode: variant.barcode || '',
              isActive: variant.isActive ?? true,
            }))
          : [{ ...INITIAL_VARIANT }];

      setFormData({
        categoryId,
        mainProductId,
        brandProductId,
        sellingType,

        unit: product.unit || 'kg',

        purchasePrice:
          product.purchasePrice != null
            ? String(product.purchasePrice)
            : '',

        sellingPrice:
          product.sellingPrice != null
            ? String(product.sellingPrice)
            : '',

        stock: String(product.stock ?? 0),
        lowStockLimit: String(product.lowStockLimit ?? 5),

        sku: product.sku || '',
        barcode: product.barcode || '',

        gstRate: Number(product.gstRate ?? 0),
        variants,
      });

    } else {
      setFormData({
        ...INITIAL_FORM,
        variants: [{ ...INITIAL_VARIANT }],
      });
    }

    setErrors({});
    setShowScanner(false);
    setScannerTarget(null);
    setCatalogueError('');
  }, [isOpen, product]);

  // ------------------------------------------
  // GENERAL FORM CHANGE
  // ------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleCategoryChange = (event) => {
    const categoryId = event.target.value;

    setFormData((prev) => ({
      ...prev,
      categoryId,
      mainProductId: '',
      brandProductId: '',
    }));

    setMainProducts([]);
    setBrandProducts([]);

    setErrors((prev) => ({
      ...prev,
      categoryId: '',
      mainProductId: '',
      brandProductId: '',
    }));
  };

  const handleMainProductChange = (event) => {
    const mainProductId = event.target.value;

    setFormData((prev) => ({
      ...prev,
      mainProductId,
      brandProductId: '',
    }));

    setBrandProducts([]);

    setErrors((prev) => ({
      ...prev,
      mainProductId: '',
      brandProductId: '',
    }));
  };

  // ------------------------------------------
  // VARIANT MANAGEMENT
  // ------------------------------------------

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedVariants = [...prev.variants];

      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value,
      };

      return {
        ...prev,
        variants: updatedVariants,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [`variant_${index}_${field}`]: '',
    }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { ...INITIAL_VARIANT },
      ],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => {
      if (prev.variants.length <= 1) return prev;

      return {
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      };
    });
  };

  // ------------------------------------------
  // VALIDATION HELPERS
  // ------------------------------------------

  const isValidNumber = (value, minimum = 0) =>
    value !== '' &&
    Number.isFinite(Number(value)) &&
    Number(value) >= minimum;

  const validate = () => {
    const nextErrors = {};

    if (!formData.categoryId) {
      nextErrors.categoryId = 'Please select a category';
    }

    if (!formData.mainProductId) {
      nextErrors.mainProductId = 'Please select a main product';
    }

    if (!formData.brandProductId) {
      nextErrors.brandProductId = 'Please select a brand product';
    }

    if (!['LOOSE', 'VARIANT'].includes(formData.sellingType)) {
      nextErrors.sellingType = 'Invalid selling type';
    }

    if (formData.sellingType === 'LOOSE') {
      if (!formData.unit) {
        nextErrors.unit = 'Please select a unit';
      }

      if (!isValidNumber(formData.purchasePrice)) {
        nextErrors.purchasePrice = 'Enter a valid purchase price';
      }

      if (!isValidNumber(formData.sellingPrice)) {
        nextErrors.sellingPrice = 'Enter a valid selling price';
      }

      if (
        !isEdit &&
        !isValidNumber(formData.stock)
      ) {
        nextErrors.stock = 'Enter a valid initial stock';
      }

      if (
        !isEdit &&
        !isValidNumber(formData.lowStockLimit)
      ) {
        nextErrors.lowStockLimit = 'Enter a valid low stock limit';
      }
    }

    if (formData.sellingType === 'VARIANT') {
      if (!formData.variants.length) {
        nextErrors.variants = 'Add at least one variant';
      }

      formData.variants.forEach((variant, index) => {
        if (!variant.variantName.trim()) {
          nextErrors[`variant_${index}_variantName`] =
            'Variant name is required';
        }

        if (!isValidNumber(variant.quantity, 0.001)) {
          nextErrors[`variant_${index}_quantity`] =
            'Enter a valid quantity';
        }

        if (!variant.unit) {
          nextErrors[`variant_${index}_unit`] =
            'Select a unit';
        }

        if (!isValidNumber(variant.purchasePrice)) {
          nextErrors[`variant_${index}_purchasePrice`] =
            'Enter a valid purchase price';
        }

        if (!isValidNumber(variant.sellingPrice)) {
          nextErrors[`variant_${index}_sellingPrice`] =
            'Enter a valid selling price';
        }

        if (
          !isEdit &&
          !isValidNumber(variant.stock)
        ) {
          nextErrors[`variant_${index}_stock`] =
            'Enter a valid stock quantity';
        }

        if (
          !isEdit &&
          !isValidNumber(variant.lowStockLimit)
        ) {
          nextErrors[`variant_${index}_lowStockLimit`] =
            'Enter a valid low stock limit';
        }
      });
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // ------------------------------------------
  // BUILD API PAYLOAD
  // ------------------------------------------

  const buildPayload = () => {
    const commonData = {
      categoryId: formData.categoryId,
      mainProductId: formData.mainProductId,
      brandProductId: formData.brandProductId,
      sellingType: formData.sellingType,
      gstRate: Number(formData.gstRate),
    };

    if (formData.sellingType === 'LOOSE') {
      return {
        ...commonData,

        unit: formData.unit,

        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),

        lowStockLimit: Number(formData.lowStockLimit),

        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,

        // Do not overwrite existing stock while editing.
        ...(!isEdit && {
          stock: Number(formData.stock),
        }),
      };
    }

    return {
      ...commonData,

      variants: formData.variants.map((variant) => ({
        ...(variant._id && { _id: variant._id }),

        variantName: variant.variantName.trim(),
        quantity: Number(variant.quantity),
        unit: variant.unit,

        purchasePrice: Number(variant.purchasePrice),
        sellingPrice: Number(variant.sellingPrice),

        gstRate: Number(variant.gstRate ?? formData.gstRate),

        lowStockLimit: Number(variant.lowStockLimit || 5),

        sku: variant.sku.trim() || undefined,
        barcode: variant.barcode.trim() || undefined,

        ...(variant.isActive !== undefined && {
          isActive: variant.isActive,
        }),

        // Stock is sent only for newly created variants.
        ...(!isEdit && {
          stock: Number(variant.stock || 0),
        }),
      })),
    };
  };

  // ------------------------------------------
  // SUBMIT
  // ------------------------------------------

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading || catalogueLoading || !validate()) return;

    const payload = buildPayload();

    onSave(payload, product?._id || product?.id);
  };

  // ------------------------------------------
  // BARCODE SCANNER
  // ------------------------------------------

  const openScanner = (target) => {
    setScannerTarget(target);
    setShowScanner(true);
  };

  const handleBarcodeScan = useCallback((barcode) => {
    if (!scannerTarget) return;

    if (scannerTarget.type === 'loose') {
      setFormData((prev) => ({
        ...prev,
        barcode,
      }));
    }

    if (scannerTarget.type === 'variant') {
      setFormData((prev) => {
        const variants = [...prev.variants];

        variants[scannerTarget.index] = {
          ...variants[scannerTarget.index],
          barcode,
        };

        return {
          ...prev,
          variants,
        };
      });
    }

    setShowScanner(false);
    setScannerTarget(null);
  }, [scannerTarget]);

  const closeScanner = useCallback(() => {
    setShowScanner(false);
    setScannerTarget(null);
  }, []);

  // ------------------------------------------
  // SECTION HEADING
  // ------------------------------------------

  const sectionHeading = (Icon, title, description) => (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-800">
          {title}
        </h4>

        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );

  // ------------------------------------------
  // VARIANT FORM
  // ------------------------------------------

  const renderVariant = (variant, index) => (
    <div
      key={variant._id || `variant-${index}`}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h5 className="text-sm font-semibold text-slate-800">
            Variant {index + 1}
          </h5>

          <p className="mt-1 text-xs text-slate-500">
            Example: 1kg, 2kg, 5kg or Small, Large
          </p>
        </div>

        {formData.variants.length > 1 && (
          <button
            type="button"
            onClick={() => removeVariant(index)}
            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
            aria-label={`Remove variant ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <Input
          label="Variant Name"
          placeholder="e.g. 1kg Packet"
          value={variant.variantName}
          onChange={(e) =>
            handleVariantChange(index, 'variantName', e.target.value)
          }
          error={errors[`variant_${index}_variantName`]}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Package Quantity"
            type="number"
            min="0.001"
            step="0.001"
            value={variant.quantity}
            onChange={(e) =>
              handleVariantChange(index, 'quantity', e.target.value)
            }
            error={errors[`variant_${index}_quantity`]}
            required
          />

          <Select
            label="Unit"
            value={variant.unit}
            onChange={(e) =>
              handleVariantChange(index, 'unit', e.target.value)
            }
            options={unitOptions}
            error={errors[`variant_${index}_unit`]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Purchase Price"
            type="number"
            min="0"
            step="0.01"
            value={variant.purchasePrice}
            onChange={(e) =>
              handleVariantChange(index, 'purchasePrice', e.target.value)
            }
            error={errors[`variant_${index}_purchasePrice`]}
            required
          />

          <Input
            label="Selling Price"
            type="number"
            min="0"
            step="0.01"
            value={variant.sellingPrice}
            onChange={(e) =>
              handleVariantChange(index, 'sellingPrice', e.target.value)
            }
            error={errors[`variant_${index}_sellingPrice`]}
            required
          />
        </div>

        <Select
          label="GST Rate"
          value={String(variant.gstRate ?? formData.gstRate)}
          onChange={(e) =>
            handleVariantChange(index, 'gstRate', Number(e.target.value))
          }
          options={gstOptions}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="SKU"
            placeholder="e.g. TATA-1KG"
            value={variant.sku}
            onChange={(e) =>
              handleVariantChange(index, 'sku', e.target.value)
            }
          />

          <Input
            label="Barcode"
            placeholder="Barcode"
            value={variant.barcode}
            onChange={(e) =>
              handleVariantChange(index, 'barcode', e.target.value)
            }
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openScanner({
            type: 'variant',
            index,
          })}
        >
          <Barcode className="mr-2 h-4 w-4" />
          Scan Variant Barcode
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Initial Stock (${variant.unit})`}
            type="number"
            min="0"
            step="0.001"
            value={variant.stock}
            onChange={(e) =>
              handleVariantChange(index, 'stock', e.target.value)
            }
            error={errors[`variant_${index}_stock`]}
            disabled={isEdit}
            required={!isEdit}
          />

          <Input
            label="Low Stock Alert"
            type="number"
            min="0"
            step="0.001"
            value={variant.lowStockLimit}
            onChange={(e) =>
              handleVariantChange(index, 'lowStockLimit', e.target.value)
            }
            error={errors[`variant_${index}_lowStockLimit`]}
          />
        </div>

        {isEdit && (
          <p className="text-xs text-slate-500">
            Current stock: {variant.stock} {variant.unit}.
            Use stock adjustment to change it.
          </p>
        )}
      </div>
    </div>
  );

  // ------------------------------------------
  // UI
  // ------------------------------------------

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Product' : 'Add New Product'}
        subtitle={
          isEdit
            ? 'Update product configuration and pricing'
            : 'Add a product to your store inventory'
        }
        maxWidth="max-w-2xl"
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading || catalogueLoading}
            >
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Catalogue Selection */}

          <section>
            {sectionHeading(
              Package,
              'Product Catalogue',
              'Select category, main product and brand product'
            )}

            {catalogueError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {catalogueError}
              </div>
            )}

            <div className="space-y-4">
              <Select
                label="Category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleCategoryChange}
                options={categoryOptions}
                placeholder="Select category"
                error={errors.categoryId}
                required
              />

              <Select
                label="Main Product"
                name="mainProductId"
                value={formData.mainProductId}
                onChange={handleMainProductChange}
                options={mainProductOptions}
                placeholder={
                  formData.categoryId
                    ? 'Select main product'
                    : 'Select category first'
                }
                error={errors.mainProductId}
                disabled={!formData.categoryId}
                required
              />

              <Select
                label="Brand Product"
                name="brandProductId"
                value={formData.brandProductId}
                onChange={handleChange}
                options={brandProductOptions}
                placeholder={
                  formData.mainProductId
                    ? 'Select brand product'
                    : 'Select main product first'
                }
                error={errors.brandProductId}
                disabled={!formData.mainProductId}
                required
              />
            </div>
          </section>

          {/* Selling Configuration */}

          <section>
            {sectionHeading(
              Layers,
              'Selling Configuration',
              'Choose how this product is sold'
            )}

            <Select
              label="Selling Type"
              name="sellingType"
              value={formData.sellingType}
              onChange={handleChange}
              options={[
                {
                  value: 'LOOSE',
                  label: 'Loose Product',
                },
                {
                  value: 'VARIANT',
                  label: 'Product with Variants / Packages',
                },
              ]}
              error={errors.sellingType}
            />

            <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/70 p-3">
              {formData.sellingType === 'LOOSE' ? (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Loose Product
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Use for products sold by weight or measurement,
                    such as rice, sugar, potatoes or oil.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Product with Variants
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Use for different package sizes or options,
                    such as 1kg, 2kg and 5kg packets.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* LOOSE PRODUCT */}

          {formData.sellingType === 'LOOSE' && (
            <>
              <section>
                {sectionHeading(
                  Tag,
                  'Pricing Information',
                  'Set purchase and selling prices'
                )}

                <div className="space-y-4">
                  <Select
                    label="Measurement Unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    options={unitOptions}
                    error={errors.unit}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Purchase Price"
                      type="number"
                      name="purchasePrice"
                      min="0"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      error={errors.purchasePrice}
                      required
                    />

                    <Input
                      label={`Selling Price (per ${formData.unit})`}
                      type="number"
                      name="sellingPrice"
                      min="0"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      error={errors.sellingPrice}
                      required
                    />
                  </div>
                </div>
              </section>

              <section>
                {sectionHeading(
                  Layers,
                  'Inventory Information',
                  'Manage available quantity and stock alerts'
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Initial Stock (${formData.unit})`}
                    type="number"
                    name="stock"
                    min="0"
                    step="0.001"
                    value={formData.stock}
                    onChange={handleChange}
                    error={errors.stock}
                    disabled={isEdit}
                    required={!isEdit}
                  />

                  <Input
                    label={`Low Stock Alert (${formData.unit})`}
                    type="number"
                    name="lowStockLimit"
                    min="0"
                    step="0.001"
                    value={formData.lowStockLimit}
                    onChange={handleChange}
                    error={errors.lowStockLimit}
                  />
                </div>

                {isEdit && (
                  <p className="mt-2 text-xs text-slate-500">
                    Existing stock is not changed here. Use inventory
                    adjustments to update available stock.
                  </p>
                )}
              </section>

              <section>
                {sectionHeading(
                  Barcode,
                  'Product Identification',
                  'SKU and barcode details'
                )}

                <div className="space-y-3">
                  <Input
                    label="SKU"
                    name="sku"
                    placeholder="e.g. RICE-001"
                    value={formData.sku}
                    onChange={handleChange}
                  />

                  <Input
                    label="Barcode"
                    name="barcode"
                    placeholder="Enter or scan barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openScanner({ type: 'loose' })}
                  >
                    <Barcode className="mr-2 h-4 w-4" />
                    Scan Barcode
                  </Button>
                </div>
              </section>
            </>
          )}

          {/* VARIANT PRODUCT */}

          {formData.sellingType === 'VARIANT' && (
            <section>
              {sectionHeading(
                Layers,
                'Product Variants',
                'Add package sizes with separate pricing and stock'
              )}

              <div className="space-y-4">
                {formData.variants.map(renderVariant)}

                {errors.variants && (
                  <p className="text-xs text-rose-500">
                    {errors.variants}
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Variant
                </Button>
              </div>
            </section>
          )}

          {/* GST */}

          <section>
            {sectionHeading(
              Percent,
              'Tax Information',
              'Set the default GST rate'
            )}

            <Select
              label="GST Rate"
              name="gstRate"
              value={String(formData.gstRate)}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: 'gstRate',
                    value: Number(e.target.value),
                  },
                })
              }
              options={gstOptions}
            />
          </section>

        </form>
      </Modal>

      {/* Barcode Scanner */}

      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={closeScanner}
          onScan={handleBarcodeScan}
        />
      )}
    </>
  );
};

export default ProductModal;