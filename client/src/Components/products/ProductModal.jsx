import React, { useState, useEffect, useCallback } from 'react';
import { Barcode, Package, Tag, Percent, Layers, Camera } from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import BarcodeScanner from './BarcodeScanner';

const GST_RATES = [0, 5, 12, 18, 28];

const UNITS = [
  'pcs',
  'kg',
  'gm',
  'ltr',
  'ml',
  'box',
  'pack',
  'unit',
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

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        unit: product.unit || 'pcs',
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
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      if (!prev[name]) return prev;

      return {
        ...prev,
        [name]: '',
      };
    });
  };

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

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading || !validate()) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim() || undefined,
      unit: formData.unit || 'pcs',
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

  const [showScanner, setShowScanner] = useState(false);

  const handleBarcodeScan = useCallback((barcode) => {
    setFormData((prev) => ({
      ...prev,
      barcode,
    }));
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={selectOptions(CATEGORIES)}
                placeholder="Select category"
              />

              <Select
                label="Measurement Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                options={selectOptions(UNITS)}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-5">
          {sectionHeading(
            Barcode,
            'Product Identification',
            'Optional SKU and barcode'
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="SKU Code"
              name="sku"
              placeholder="e.g. RICE-5KG-01"
              value={formData.sku}
              onChange={handleChange}
            />

            <Input
              label="Barcode (EAN / UPC)"
              name="barcode"
              placeholder="Enter barcode number"
              value={formData.barcode}
              onChange={handleChange}
              icon={Barcode}
            />

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="mt-2 flex items-center gap-2 rounded-lg border px-4 py-2"
            >
              <Camera size={18} />
              Scan Barcode
            </button>

            {showScanner && (
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onClose={closeScanner}
              />
            )}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-5">
          {sectionHeading(
            Tag,
            'Pricing & Tax',
            'Set purchase price, selling price and GST'
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="product-price-input">
              <Input
                label="Purchase Price (₹)"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                prefix="₹"
                value={formData.purchasePrice}
                onChange={handleChange}
                error={errors.purchasePrice}
                helperText="Your cost price"
              />
            </div>

            <div className="product-price-input">
              <Input
                label="Selling Price (₹)"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                prefix="₹"
                value={formData.sellingPrice}
                onChange={handleChange}
                error={errors.sellingPrice}
                required
                helperText="Base selling price per unit"
              />
            </div>
          </div>

          <div className="mt-4">
            <Select
              label="GST Slab Rate"
              name="gstRate"
              value={String(formData.gstRate)}
              onChange={handleChange}
              options={GST_RATES.map((rate) => ({
                value: String(rate),
                label: `${rate}% GST`,
              }))}
            />
          </div>
        </section>

        {/* Inventory Settings */}
        <section className="border-t border-slate-100 pt-5">
          {sectionHeading(
            Layers,
            'Inventory Settings',
            'Manage stock and low-stock alerts'
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!isEdit ? (
              <Input
                label="Initial Stock Quantity"
                name="stock"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 100"
                value={formData.stock}
                onChange={handleChange}
                error={errors.stock}
                required
              />
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Current Stock (In Hand)
                </label>

                <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3">
                  <span className="text-sm font-semibold text-slate-800">
                    {product?.stock ?? 0} {formData.unit}
                  </span>

                  <span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700">
                    Current
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Adjust stock through inventory operations.
                </p>
              </div>
            )}

            <Input
              label="Low Stock Warning Limit"
              name="lowStockLimit"
              type="number"
              min="0"
              step="any"
              placeholder="5"
              value={formData.lowStockLimit}
              onChange={handleChange}
              error={errors.lowStockLimit}
              helperText="Alert when stock reaches this level"
            />
          </div>
        </section>
      </form>

      {/* Remove number-input spinner arrows and soften placeholders */}
      <style>{`
        .product-price-input input[type="number"]::-webkit-inner-spin-button,
        .product-price-input input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .product-price-input input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }

        input::placeholder,
        textarea::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        select:invalid {
          color: #94a3b8;
        }
      `}</style>
    </Modal>
  );
};

export default ProductModal;