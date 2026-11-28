import React from 'react';
import {
  Barcode,
  Package,
  Tag,
  Percent,
  Layers,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';

import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const SectionHeading = ({ icon: Icon, title, description }) => (
  <div className="mb-4 flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600">
      <Icon className="h-5 w-5" />
    </div>

    <div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </div>
  </div>
);

const ProductModalFields = ({
  isEdit,
  formData,
  errors,
  unitOptions,
  gstOptions,
  catalogueDisplay,
  handleChange,
  handleVariantChange,
  addVariant,
  removeVariant,
  openScanner,
}) => {
  const renderVariant = (variant, index) => (
    <div
      key={variant._id || variant._tempId || `variant-${index}`}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-semibold text-slate-800">
              Variant {index + 1}
            </h5>
            {isEdit && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  variant._id
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {variant._id ? 'Saved Variant' : 'New Variant'}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Example: 500gm, 1kg, 5kg or Small, Large
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="SKU"
            placeholder="e.g. TATA-1KG"
            value={variant.sku}
            onChange={(e) =>
              handleVariantChange(index, 'sku', e.target.value)
            }
            error={errors[`variant_${index}_sku`]}
          />

          <Input
            label="Barcode"
            placeholder="Barcode"
            value={variant.barcode}
            onChange={(e) =>
              handleVariantChange(index, 'barcode', e.target.value)
            }
            error={errors[`variant_${index}_barcode`]}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            openScanner({
              type: 'variant',
              index,
            })
          }
        >
          <Barcode className="mr-2 h-4 w-4" />
          Scan Variant Barcode
        </Button>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label={
              isEdit && variant._id
                ? `Current Stock (${variant.unit})`
                : `Initial Stock (${variant.unit})`
            }
            type="number"
            min="0"
            step="0.001"
            value={variant.stock}
            onChange={(e) =>
              handleVariantChange(index, 'stock', e.target.value)
            }
            error={errors[`variant_${index}_stock`]}
            disabled={isEdit && Boolean(variant._id)}
            required={!isEdit || !variant._id}
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

        {isEdit && Boolean(variant._id) && (
          <p className="text-xs text-slate-500">
            Current stock: {variant.stock} {variant.unit}. Use stock adjustment
            to change it.
          </p>
        )}
      </div>
    </div>
  );

  const renderLooseFields = () => (
    <>
      <section>
        <SectionHeading
          icon={Tag}
          title="Pricing Information"
          description="Set purchase and selling prices"
        />

        <div className="space-y-4">
          <Select
            label="Measurement Unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            options={unitOptions}
            error={errors.unit}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <SectionHeading
          icon={Layers}
          title="Inventory Information"
          description={
            isEdit
              ? 'Manage available quantity and stock alerts'
              : 'Manage initial quantity and stock alerts'
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label={
              isEdit
                ? `Current Stock (${formData.unit})`
                : `Initial Stock (${formData.unit})`
            }
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
            Existing stock is not changed here. Use inventory adjustments to
            update available stock.
          </p>
        )}
      </section>

      <section>
        <SectionHeading
          icon={Barcode}
          title="Product Identification"
          description="SKU and barcode details"
        />

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
  );

  const renderVariantFields = () => (
    <section>
      <SectionHeading
        icon={Layers}
        title={isEdit ? 'Manage Variants' : 'Product Variants'}
        description={
          isEdit
            ? 'Edit existing variants, add new variants or remove variants'
            : 'Add package sizes with separate pricing and stock'
        }
      />

      <div className="space-y-4">
        {formData.variants.map(renderVariant)}

        {errors.variants && (
          <p className="text-xs text-rose-500">{errors.variants}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>
    </section>
  );

  const renderTaxSection = () => (
    <section>
      <SectionHeading
        icon={Percent}
        title="Tax Information"
        description="Set the default GST rate"
      />

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
  );

  return (
    <div className="space-y-6">
      {/* IMMUTABLE CATALOGUE INFORMATION (EDIT MODE) */}
      {isEdit && (
        <section>
          <SectionHeading
            icon={Package}
            title="Product Catalogue"
            description="Catalogue selection cannot be changed after product creation"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-3">
              {[
                {
                  label: 'Category',
                  value: catalogueDisplay.category || 'Unavailable',
                },
                {
                  label: 'Main Product',
                  value: catalogueDisplay.mainProduct || 'Unavailable',
                },
                {
                  label: 'Brand Product',
                  value: catalogueDisplay.brandProduct || 'Unavailable',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-slate-500">{item.label}</span>

                  <span className="font-medium text-slate-800">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              Catalogue hierarchy is locked after creation.
            </div>
          </div>
        </section>
      )}

      {/* SELLING CONFIGURATION */}
      {isEdit ? (
        <section>
          <SectionHeading
            icon={Layers}
            title="Selling Configuration"
            description="Selling type is fixed after product creation"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {formData.sellingType === 'LOOSE'
                    ? 'Loose Product'
                    : 'Product with Variants / Packages'}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formData.sellingType === 'LOOSE'
                    ? 'Sold by weight or measurement.'
                    : 'Sold in different package sizes or options.'}
                </p>
              </div>

              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </section>
      ) : (
        <section>
          <SectionHeading
            icon={Layers}
            title="Selling Configuration"
            description="Choose how this product is sold"
          />

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
                  Use for products sold by weight or measurement, such as rice,
                  sugar, potatoes or oil.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">
                  Product with Variants
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Use for different package sizes or options, such as 500gm, 1kg
                  and 5kg packets.
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {formData.sellingType === 'LOOSE'
        ? renderLooseFields()
        : renderVariantFields()}

      {renderTaxSection()}
    </div>
  );
};

export default ProductModalFields;
