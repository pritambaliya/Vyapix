import React from 'react';
import { CheckCircle2 } from 'lucide-react';

import CategoryStep from './product-wizard/CategoryStep';
import MainProductStep from './product-wizard/MainProductStep';
import BrandProductStep from './product-wizard/BrandProductStep';

export const WizardProgress = ({ wizardStep, isEdit = false }) => {
  const steps = [
    { step: 1, label: 'Category' },
    { step: 2, label: 'Main Product' },
    { step: 3, label: 'Brand Product' },
    { step: 4, label: isEdit ? 'Edit Product' : 'Product Details' },
  ];

  return (
    <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-7">
      <div className="flex items-center justify-between gap-2">
        {steps.map((item, index) => (
          <React.Fragment key={item.step}>
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  wizardStep >= item.step
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {wizardStep > item.step ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  item.step
                )}
              </div>

              <span
                className={`hidden truncate text-xs font-medium sm:inline ${
                  wizardStep === item.step
                    ? 'text-orange-600'
                    : wizardStep > item.step
                      ? 'text-slate-700'
                      : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </div>

            {index !== steps.length - 1 && (
              <div
                className={`h-px min-w-3 flex-1 ${
                  wizardStep > item.step ? 'bg-orange-400' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const ProductModalSteps = ({
  wizardStep,
  isEdit,
  categories,
  mainProducts,
  brandProducts,
  categoriesLoading,
  mainProductsLoading,
  brandProductsLoading,
  catalogueError,
  formData,
  catalogueDisplay,
  goToWizardStep,
  onCategorySelect,
  onCategoryDoubleClick,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
  onMainProductSelect,
  onMainProductDoubleClick,
  onMainProductCreated,
  onMainProductUpdated,
  onMainProductDeleted,
  onBrandProductSelect,
  onBrandProductDoubleClick,
  onBrandProductCreated,
  onBrandProductUpdated,
  onBrandProductDeleted,
  children,
}) => {
  return (
    <>
      {catalogueError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {catalogueError}
        </div>
      )}

      {wizardStep === 1 && (
        <CategoryStep
          categories={categories}
          selectedCategoryId={formData.categoryId}
          loading={categoriesLoading}
          onSelect={onCategorySelect}
          onDoubleClick={onCategoryDoubleClick}
          onCategoryCreated={onCategoryCreated}
          onCategoryUpdated={onCategoryUpdated}
          onCategoryDeleted={onCategoryDeleted}
        />
      )}

      {wizardStep === 2 && (
        <MainProductStep
          mainProducts={mainProducts}
          selectedMainProductId={formData.mainProductId}
          categoryId={formData.categoryId}
          loading={mainProductsLoading}
          onSelect={onMainProductSelect}
          onDoubleClick={onMainProductDoubleClick}
          onMainProductCreated={onMainProductCreated}
          onMainProductUpdated={onMainProductUpdated}
          onMainProductDeleted={onMainProductDeleted}
          onBack={() => goToWizardStep(1)}
        />
      )}

      {wizardStep === 3 && (
        <BrandProductStep
          brandProducts={brandProducts}
          selectedBrandProductId={formData.brandProductId}
          mainProductId={formData.mainProductId}
          loading={brandProductsLoading}
          onSelect={onBrandProductSelect}
          onDoubleClick={onBrandProductDoubleClick}
          onBrandProductCreated={onBrandProductCreated}
          onBrandProductUpdated={onBrandProductUpdated}
          onBrandProductDeleted={onBrandProductDeleted}
          onBack={() => goToWizardStep(2)}
        />
      )}

      {wizardStep === 4 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                  Product Details
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isEdit
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {isEdit ? 'Existing Product' : 'Create New Product'}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {isEdit
                  ? 'Update pricing, tax, or variants for this existing product.'
                  : 'Confirm the catalogue selection and configure inventory.'}
              </p>
            </div>
          </div>

          {/* SELECTED CATALOGUE (CREATE MODE ONLY; EDIT MODE RENDERS LOCKED CARD IN FIELDS) */}
          {!isEdit && (
            <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-800">
                Selected Catalogue
              </h4>

              <div className="space-y-3">
                {[
                  {
                    label: 'Category',
                    value: catalogueDisplay.category || 'Loading...',
                    step: 1,
                  },
                  {
                    label: 'Main Product',
                    value: catalogueDisplay.mainProduct || 'Loading...',
                    step: 2,
                  },
                  {
                    label: 'Brand Product',
                    value: catalogueDisplay.brandProduct || 'Loading...',
                    step: 3,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2 text-slate-500">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {item.label}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {item.value}
                      </span>

                      <button
                        type="button"
                        onClick={() => goToWizardStep(item.step)}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {children}
        </section>
      )}
    </>
  );
};

export default ProductModalSteps;
