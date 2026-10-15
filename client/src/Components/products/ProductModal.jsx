import React, { useState, useEffect } from 'react';
import { Barcode, Package, Tag, Percent, Layers } from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'box', 'pack', 'unit'];

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
          product.gstRate != null ? Number(product.gstRate) : 0,
        stock: product.stock != null ? String(product.stock) : '',
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
      Number(formData.stock) < 0
    ) {
      errs.stock = 'Stock cannot be negative';
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

    // Set initial stock only when creating a product.
    // Existing stock should be changed through inventory operations.
    if (!isEdit) {
      payload.stock = Number(formData.stock);
    }

    onSave(payload, product?._id || product?.id);
  };

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
        <div className="flex w-full justify-end gap-2">
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
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Information */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Package className="h-4 w-4" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Basic Information
              </h4>
              <p className="text-xs text-slate-500">
                Product name, category and measurement
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Product Name"
              name="name"
              placeholder="e.g. Basmati Rice 5kg"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Category"
                name="category"
                placeholder="e.g. Groceries"
                value={formData.category}
                onChange={handleChange}
              />

              <Select
                label="Measurement Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                options={UNITS}
              />
            </div>
          </div>
        </div>

        {/* Product Identifiers */}
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Barcode className="h-4 w-4" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Product Identification
              </h4>
              <p className="text-xs text-slate-500">
                Optional SKU and barcode
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              placeholder="e.g. 8901234567890"
              value={formData.barcode}
              onChange={handleChange}
              icon={Barcode}
            />
          </div>
        </div>

        {/* Pricing & Tax */}
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Tag className="h-4 w-4" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Pricing & Tax
              </h4>
              <p className="text-xs text-slate-500">
                Set purchase price, selling price and GST
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="mt-3">
            <label
              htmlFor="gstRate"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              GST Slab Rate
            </label>

            <div className="relative">
              <Percent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />

              <select
                id="gstRate"
                name="gstRate"
                value={formData.gstRate}
                onChange={handleChange}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 transition-all hover:border-orange-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                {GST_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}% GST
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Layers className="h-4 w-4" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Inventory Settings
              </h4>
              <p className="text-xs text-slate-500">
                Manage stock and low-stock alerts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                  <span className="rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-700">
                    Current
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
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
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;
