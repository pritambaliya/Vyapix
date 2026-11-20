import React, { useState, useEffect, useCallback } from 'react';
import { Barcode, Package, Tag, Percent, Layers } from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import BarcodeScanner from './BarcodeScanner';

const GST_RATES = [0, 5, 12, 18, 28];

const FIXED_UNITS = [
  'pcs',
  'box',
  'pack',
  'unit',
];

const VARIABLE_UNITS = [
  'kg',
  'gm',
  'ltr',
  'ml',
];

const CATEGORIES = [
  'Groceries',
  'Food & Beverages',
  'Dairy Products',
  'Fruits & Vegetables',
  'Personal Care',
  'Household',
  'Electronics',
  'Clothing',
  'Stationery',
  'Medicines',
  'Hardware',
  'Other',
];

const INITIAL_FORM = {
  name: '',
  category: '',
  sellingType: 'FIXED',
  unit: 'pcs',
  sku: '',
  barcode: '',
  purchasePrice: '',
  sellingPrice: '',
  gstRate: 0,
  stock: '',
  lowStockLimit: '5',
};

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

  // Available units according to product type
  const availableUnits =
    formData.sellingType === 'WEIGHT'
      ? VARIABLE_UNITS
      : FIXED_UNITS;

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (product) {
      const sellingType = product.sellingType || 'FIXED';

      const units =
        sellingType === 'WEIGHT'
          ? VARIABLE_UNITS
          : FIXED_UNITS;

      const productUnit = product.unit || 'pcs';

      setFormData({
        name: product.name || '',
        category: product.category || '',
        sellingType,
        unit: units.includes(productUnit)
          ? productUnit
          : sellingType === 'WEIGHT'
            ? 'kg'
            : 'pcs',
        sku: product.sku || '',
        barcode: product.barcode || '',

        purchasePrice:
          product.purchasePrice != null
            ? String(product.purchasePrice)
            : '',

        sellingPrice:
          product.sellingPrice != null
            ? String(product.sellingPrice)
            : '',

        gstRate:
          product.gstRate != null
            ? Number(product.gstRate)
            : 0,

        stock:
          product.stock != null
            ? String(product.stock)
            : '',

        lowStockLimit:
          product.lowStockLimit != null
            ? String(product.lowStockLimit)
            : '5',
      });
    } else {
      setFormData({ ...INITIAL_FORM });
    }

    setErrors({});
    setShowScanner(false);
  }, [product, isOpen]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Reset unit when product type changes
      if (name === 'sellingType') {
        updated.unit = value === 'WEIGHT' ? 'kg' : 'pcs';
      }

      return updated;
    });

    setErrors((prev) => {
      if (!prev[name]) return prev;

      return {
        ...prev,
        [name]: '',
      };
    });
  };

  // Form validation
  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Product name is required';
    }

    const sellingPrice = Number(formData.sellingPrice);

    if (
      formData.sellingPrice === '' ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      errs.sellingPrice = 'Enter a valid selling price';
    }

    if (
      formData.purchasePrice !== '' &&
      (!Number.isFinite(Number(formData.purchasePrice)) ||
        Number(formData.purchasePrice) < 0)
    ) {
      errs.purchasePrice = 'Enter a valid purchase price';
    }

    if (
      !isEdit &&
      (formData.stock === '' ||
        !Number.isFinite(Number(formData.stock)) ||
        Number(formData.stock) < 0)
    ) {
      errs.stock = 'Enter a valid initial stock quantity';
    }

    if (
      formData.lowStockLimit === '' ||
      !Number.isFinite(Number(formData.lowStockLimit)) ||
      Number(formData.lowStockLimit) < 0
    ) {
      errs.lowStockLimit = 'Enter a valid stock warning limit';
    }

    if (
      formData.stock !== '' &&
      (!Number.isFinite(Number(formData.stock)) ||
        Number(formData.stock) < 0)
    ) {
      errs.stock = 'Enter a valid non-negative stock quantity';
    }

    if (!availableUnits.includes(formData.unit)) {
      errs.unit = 'Please select a valid measurement unit';
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading || !validate()) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim() || undefined,

      sellingType: formData.sellingType,
      unit: formData.unit,

      sku: formData.sku.trim() || undefined,
      barcode: formData.barcode.trim() || undefined,

      purchasePrice:
        formData.purchasePrice !== ''
          ? Number(formData.purchasePrice)
          : 0,

      sellingPrice: Number(formData.sellingPrice),

      gstRate: Number(formData.gstRate),

      lowStockLimit:
        formData.lowStockLimit !== ''
          ? Number(formData.lowStockLimit)
          : 5,
    };

    if (!isEdit) {
      payload.stock = Number(formData.stock);
    }

    onSave(payload, product?._id || product?.id);
  };

  // Section heading
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

  const handleBarcodeScan = useCallback((barcode) => {
    setFormData((prev) => ({
      ...prev,
      barcode,
    }));

    setShowScanner(false);
  }, []);

  const closeScanner = useCallback(() => {
    setShowScanner(false);
  }, []);

  const selectOptions = (items) =>
    items.map((item) => ({
      value: item,
      label: item,
    }));

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Product' : 'Add New Product'}
        subtitle={
          isEdit
            ? 'Update product pricing, tax, and details'
            : 'Add a product to your store inventory'
        }
        maxWidth="max-w-xl"
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
              disabled={loading}
            >
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Information */}
          <section>
            {sectionHeading(
              Package,
              'Basic Information',
              'Product name, category and measurement'
            )}

            <div className="space-y-4">

              <Input
                label="Product Name"
                name="name"
                placeholder="e.g. Basmati Rice 5kg"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={selectOptions(CATEGORIES)}
                placeholder="Select category"
              />

              {/* Product Selling Type */}
              <div className="space-y-2">
                <Select
                  label="How do you sell this product?"
                  name="sellingType"
                  value={formData.sellingType}
                  onChange={handleChange}
                  options={[
                    {
                      value: 'FIXED',
                      label: 'Fixed Quantity (Packet / Piece)',
                    },
                    {
                      value: 'WEIGHT',
                      label: 'Variable Quantity (Weight / Measure)',
                    },
                  ]}
                />

                <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-3">
                  {formData.sellingType === 'FIXED' ? (
                    <>
                      <p className="text-sm font-medium text-slate-700">
                        Fixed Quantity
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        For products sold in fixed packets, bottles,
                        boxes or pieces.
                      </p>

                      <p className="mt-1 text-xs font-medium text-orange-700">
                        Example: Rice 5kg packet, Milk 1L,
                        Biscuit packet.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-700">
                        Variable Quantity
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        For products where customers can purchase
                        any quantity during billing.
                      </p>

                      <p className="mt-1 text-xs font-medium text-orange-700">
                        Example: Potato 400gm, Onion 1kg,
                        Apple 250gm.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Measurement Unit */}
              <Select
                label="Measurement Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                options={selectOptions(availableUnits)}
                error={errors.unit}
              />

              <p className="text-xs text-slate-500">
                {formData.sellingType === 'WEIGHT'
                  ? 'Stock and selling price will be maintained using the selected unit.'
                  : 'Select how the product is counted in your inventory.'}
              </p>

            </div>
          </section>

          {/* Pricing Information */}
          <section>
            {sectionHeading(
              Tag,
              'Pricing Information',
              'Purchase cost and selling price'
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Input
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.purchasePrice}
                onChange={handleChange}
                error={errors.purchasePrice}
              />

              <Input
                label={
                  formData.sellingType === 'WEIGHT'
                    ? `Selling Price (per ${formData.unit})`
                    : 'Selling Price'
                }
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={handleChange}
                error={errors.sellingPrice}
                required
              />

            </div>
          </section>

          {/* Inventory Information */}
          <section>
            {sectionHeading(
              Layers,
              'Inventory Information',
              'Manage available stock and stock alerts'
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Input
                label={
                  `Initial Stock (${formData.unit})`
                }
                name="stock"
                type="number"
                min="0"
                step="0.001"
                placeholder="0"
                value={formData.stock}
                onChange={handleChange}
                error={errors.stock}
                required={!isEdit}
              />

              <Input
                label={`Low Stock Alert (${formData.unit})`}
                name="lowStockLimit"
                type="number"
                min="0"
                step="0.001"
                placeholder="5"
                value={formData.lowStockLimit}
                onChange={handleChange}
                error={errors.lowStockLimit}
              />

            </div>

            {isEdit && (
              <p className="mt-2 text-xs text-slate-500">
                Existing stock is managed separately. Use inventory
                adjustments to update available stock.
              </p>
            )}
          </section>

          {/* Tax Information */}
          <section>
            {sectionHeading(
              Percent,
              'Tax Information',
              'Set the applicable GST rate'
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
              options={GST_RATES.map((rate) => ({
                value: String(rate),
                label: `${rate}%`,
              }))}
            />
          </section>

          {/* Product Identification */}
          <section>
            {sectionHeading(
              Barcode,
              'Product Identification',
              'SKU and barcode details'
            )}

            <div className="space-y-4">

              <Input
                label="SKU"
                name="sku"
                placeholder="e.g. RICE-001"
                value={formData.sku}
                onChange={handleChange}
              />

              <div className="space-y-2">
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
                  onClick={() => setShowScanner(true)}
                >
                  <Barcode className="mr-2 h-4 w-4" />
                  Scan Barcode
                </Button>
              </div>

            </div>
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