import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import {
  Barcode,
  Package,
  Tag,
  Percent,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import BarcodeScanner from './BarcodeScanner';

import productService from '../../services/productService';

import CategoryStep from './product-wizard/CategoryStep';
import MainProductStep from './product-wizard/MainProductStep';
import BrandProductStep from './product-wizard/BrandProductStep';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

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

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const getId = (value) => {
  if (!value) return '';

  return typeof value === 'object'
    ? value._id || value.id || ''
    : value;
};

const getList = (response) => {
  if (Array.isArray(response)) return response;

  const list =
    response?.categories ||
    response?.mainProducts ||
    response?.brandProducts ||
    response?.products ||
    response?.data?.categories ||
    response?.data?.mainProducts ||
    response?.data?.brandProducts ||
    response?.data?.products ||
    response?.data;

  return Array.isArray(list) ? list : [];
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const routeSegment = (item) =>
  `${slugify(item?.name || item?.brandName || 'item')}--${getId(item)}`;

const resolveRouteItem = (items, segment) => {
  if (!segment || !Array.isArray(items)) return null;

  const id = segment.split('--').pop();

  const byId = items.find(
    (item) => getId(item) === id
  );

  if (byId) return byId;

  return (
    items.find(
      (item) =>
        slugify(item.name || item.brandName) === segment
    ) || null
  );
};

// --------------------------------------------------
// PRODUCT MODAL
// --------------------------------------------------

export const ProductModal = ({
  isOpen = true,
  onClose,
  onSave,
  product = null,
  loading = false,
}) => {
  const navigate = useNavigate();

  const {
    categorySlug,
    mainProductSlug,
    brandProductSlug,
  } = useParams();

  const isEdit = Boolean(product);

  const routeStep = brandProductSlug
    ? 4
    : mainProductSlug
      ? 3
      : categorySlug
        ? 2
        : 1;

  const closePage = onClose || (() => navigate('/products'));

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------

  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    variants: [{ ...INITIAL_VARIANT }],
  });

  const [errors, setErrors] = useState({});

  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);

  // --------------------------------------------------
  // CATALOGUE STATE
  // --------------------------------------------------

  const [categories, setCategories] = useState([]);
  const [mainProducts, setMainProducts] = useState([]);
  const [brandProducts, setBrandProducts] = useState([]);

  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');

  // --------------------------------------------------
  // WIZARD STATE
  // --------------------------------------------------

  const [wizardStep, setWizardStep] = useState(1);

  // --------------------------------------------------
  // BODY SCROLL LOCK FOR CREATE MODAL
  // --------------------------------------------------

  useEffect(() => {
    if (isEdit || !isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEdit, isOpen]);

  // --------------------------------------------------
  // OPTIONS
  // --------------------------------------------------

  const categoryOptions = categories.map((item) => ({
    value: getId(item),
    label: item.name,
  }));

  const mainProductOptions = mainProducts.map((item) => ({
    value: getId(item),
    label: item.name,
  }));

  const brandProductOptions = brandProducts.map((item) => ({
    value: getId(item),
    label: item.name || item.brandName,
  }));

  const unitOptions = UNITS.map((unit) => ({
    value: unit,
    label: unit,
  }));

  const gstOptions = GST_RATES.map((rate) => ({
    value: String(rate),
    label: `${rate}%`,
  }));

  // --------------------------------------------------
  // FETCH CATEGORIES FOR EDIT MODE
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen || !isEdit) return;

    let cancelled = false;

    const fetchCategories = async () => {
      setCatalogueLoading(true);
      setCatalogueError('');

      try {
        const response = await productService.getCategories();

        if (!cancelled) {
          setCategories(getList(response));
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogueError(
            getErrorMessage(error, 'Failed to load categories.')
          );
        }
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
  }, [isOpen, isEdit]);

  // --------------------------------------------------
  // FETCH MAIN PRODUCTS FOR EDIT MODE
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen || !isEdit || !formData.categoryId) {
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
  }, [isOpen, isEdit, formData.categoryId]);

  // --------------------------------------------------
  // FETCH BRAND PRODUCTS FOR EDIT MODE
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen || !isEdit || !formData.mainProductId) {
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
  }, [isOpen, isEdit, formData.mainProductId]);

  // --------------------------------------------------
  // POPULATE FORM / RESET FORM
  // --------------------------------------------------

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
            gstRate: Number(
              variant.gstRate ?? product.gstRate ?? 0
            ),
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

      setWizardStep(1);
    } else {
      setFormData({
        ...INITIAL_FORM,
        variants: [{ ...INITIAL_VARIANT }],
      });

      setWizardStep(1);
    }

    setErrors({});
    setShowScanner(false);
    setScannerTarget(null);
    setCatalogueError('');
  }, [isOpen, product]);

  // --------------------------------------------------
  // RESTORE CREATE FLOW FROM URL
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen || isEdit) return;

    let cancelled = false;

    const restoreFromRoute = async () => {
      setCatalogueLoading(true);
      setCatalogueError('');
      setWizardStep(routeStep);

      try {
        const categoryResponse =
          await productService.getCategories();

        const categoryList = getList(categoryResponse);

        if (cancelled) return;

        setCategories(categoryList);

        if (!categorySlug) {
          setMainProducts([]);
          setBrandProducts([]);

          setFormData((prev) => ({
            ...prev,
            categoryId: '',
            mainProductId: '',
            brandProductId: '',
          }));

          return;
        }

        const category = resolveRouteItem(
          categoryList,
          categorySlug
        );

        if (!category) {
          navigate('/product/create', {
            replace: true,
          });

          return;
        }

        const mainResponse =
          await productService.getMainProducts({
            categoryId: getId(category),
          });

        const mainList = getList(mainResponse);

        if (cancelled) return;

        setMainProducts(mainList);

        const mainProduct = resolveRouteItem(
          mainList,
          mainProductSlug
        );

        if (mainProductSlug && !mainProduct) {
          navigate(
            `/product/create/${categorySlug}`,
            { replace: true }
          );

          return;
        }

        let brandList = [];
        let brandProduct = null;

        if (mainProduct) {
          const brandResponse =
            await productService.getBrandProducts({
              mainProductId: getId(mainProduct),
            });

          brandList = getList(brandResponse);

          if (cancelled) return;

          setBrandProducts(brandList);

          brandProduct = resolveRouteItem(
            brandList,
            brandProductSlug
          );

          if (brandProductSlug && !brandProduct) {
            navigate(
              `/product/create/${categorySlug}/${mainProductSlug}`,
              { replace: true }
            );

            return;
          }
        } else {
          setBrandProducts([]);
        }

        if (cancelled) return;

        setFormData((prev) => ({
          ...prev,
          categoryId: getId(category),
          mainProductId: getId(mainProduct),
          brandProductId: getId(brandProduct),
        }));
      } catch (error) {
        if (!cancelled) {
          setCatalogueError(
            getErrorMessage(
              error,
              'Unable to restore product selection.'
            )
          );
        }
      } finally {
        if (!cancelled) {
          setCatalogueLoading(false);
        }
      }
    };

    restoreFromRoute();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    isEdit,
    categorySlug,
    mainProductSlug,
    brandProductSlug,
    routeStep,
    navigate,
  ]);

  // --------------------------------------------------
  // WIZARD SELECTION HANDLERS
  // --------------------------------------------------

  const handleWizardCategorySelect = (category) => {
    const categoryId = getId(category);

    if (!categoryId) return;

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

  const handleWizardMainProductSelect = (mainProduct) => {
    const mainProductId = getId(mainProduct);

    if (!mainProductId) return;

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

  const handleWizardBrandProductSelect = (brandProduct) => {
    const brandProductId = getId(brandProduct);

    if (!brandProductId) return;

    setFormData((prev) => ({
      ...prev,
      brandProductId,
    }));

    setErrors((prev) => ({
      ...prev,
      brandProductId: '',
    }));
  };

  // --------------------------------------------------
  // CREATE CATEGORY CALLBACK
  // --------------------------------------------------

  const handleCategoryCreated = (category) => {
    if (!category) return;

    setCategories((prev) => {
      const exists = prev.some(
        (item) => getId(item) === getId(category)
      );

      return exists ? prev : [...prev, category];
    });

    handleWizardCategorySelect(category);
  };

  // --------------------------------------------------
  // UPDATE CATEGORY CALLBACK
  // --------------------------------------------------

  const handleCategoryUpdated = useCallback((updatedCategory) => {
    const categoryId = getId(updatedCategory);

    if (!categoryId) return;

    setCategories((prev) =>
      prev.map((category) =>
        String(getId(category)) === String(categoryId)
          ? { ...category, ...updatedCategory }
          : category
      )
    );
  }, []);

  // --------------------------------------------------
  // DELETE CATEGORY CALLBACK
  // --------------------------------------------------

  const handleCategoryDeleted = useCallback((categoryId) => {
    if (!categoryId) return;

    const deletedId = String(categoryId);

    setCategories((prev) =>
      prev.filter(
        (category) => String(getId(category)) !== deletedId
      )
    );

    if (String(formData.categoryId) !== deletedId) return;

    setFormData((prev) => ({
      ...prev,
      categoryId: '',
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

    setWizardStep(1);

    navigate('/product/create', {
      replace: true,
    });
  }, [formData.categoryId, navigate]);

  // --------------------------------------------------
  // CREATE MAIN PRODUCT CALLBACK
  // --------------------------------------------------

  const handleMainProductCreated = (mainProduct) => {
    if (!mainProduct) return;

    setMainProducts((prev) => {
      const exists = prev.some(
        (item) => getId(item) === getId(mainProduct)
      );

      return exists ? prev : [...prev, mainProduct];
    });

    handleWizardMainProductSelect(mainProduct);
  };

  // --------------------------------------------------
  // UPDATE MAIN PRODUCT CALLBACK
  // --------------------------------------------------

  const handleMainProductUpdated = useCallback((updatedProduct) => {
    const productId = getId(updatedProduct);

    if (!productId) return;

    setMainProducts((prev) =>
      prev.map((item) =>
        String(getId(item)) === String(productId)
          ? { ...item, ...updatedProduct }
          : item
      )
    );
  }, []);

  // --------------------------------------------------
  // DELETE MAIN PRODUCT CALLBACK
  // --------------------------------------------------

  const handleMainProductDeleted = useCallback(
    (productId) => {
      if (!productId) return;

      const deletedId = String(productId);

      setMainProducts((prev) =>
        prev.filter((item) => String(getId(item)) !== deletedId)
      );

      if (String(formData.mainProductId) !== deletedId) return;

      setFormData((prev) => ({
        ...prev,
        mainProductId: '',
        brandProductId: '',
      }));

      setBrandProducts([]);

      setErrors((prev) => ({
        ...prev,
        mainProductId: '',
        brandProductId: '',
      }));

      setWizardStep(2);

      const category = categories.find(
        (item) => String(getId(item)) === String(formData.categoryId)
      );

      navigate(
        category
          ? `/product/create/${routeSegment(category)}`
          : '/product/create',
        { replace: true }
      );
    },
    [categories, formData.categoryId, formData.mainProductId, navigate]
  );

  // --------------------------------------------------
  // CREATE BRAND PRODUCT CALLBACK
  // --------------------------------------------------

  const handleBrandProductCreated = (brandProduct) => {
    if (!brandProduct) return;

    setBrandProducts((prev) => {
      const exists = prev.some(
        (item) => getId(item) === getId(brandProduct)
      );

      return exists ? prev : [...prev, brandProduct];
    });

    handleWizardBrandProductSelect(brandProduct);
  };

  // --------------------------------------------------
  // UPDATE BRAND PRODUCT CALLBACK
  // --------------------------------------------------

  const handleBrandProductUpdated = (updatedProduct) => {
    const productId = getId(updatedProduct);

    setBrandProducts((prev) =>
      prev.map((item) => {
        if (getId(item) !== productId) return item;

        return {
          ...item,
          ...updatedProduct,
          image: updatedProduct.image || item.image || "",
        };
      })
    );
  };

  // --------------------------------------------------
  // DELETE BRAND PRODUCT CALLBACK
  // --------------------------------------------------

  const handleBrandProductDeleted = useCallback(
    (productId) => {
      if (!productId) return;

      const deletedId = String(productId);

      setBrandProducts((prev) =>
        prev.filter((item) => String(getId(item)) !== deletedId)
      );

      if (String(formData.brandProductId) !== deletedId) return;

      setFormData((prev) => ({
        ...prev,
        brandProductId: '',
      }));

      setErrors((prev) => ({
        ...prev,
        brandProductId: '',
      }));

      setWizardStep(3);

      const category = categories.find(
        (item) => String(getId(item)) === String(formData.categoryId)
      );

      const mainProduct = mainProducts.find(
        (item) => String(getId(item)) === String(formData.mainProductId)
      );

      navigate(
        category && mainProduct
          ? `/product/create/${routeSegment(category)}/${routeSegment(mainProduct)}`
          : category
            ? `/product/create/${routeSegment(category)}`
            : '/product/create',
        { replace: true }
      );
    },
    [
      categories,
      mainProducts,
      formData.categoryId,
      formData.mainProductId,
      formData.brandProductId,
      navigate,
    ]
  );

  // --------------------------------------------------
  // EDIT MODE DROPDOWN HANDLERS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // GENERAL FORM CHANGE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // VARIANT MANAGEMENT
  // --------------------------------------------------

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
        variants: prev.variants.filter(
          (_, i) => i !== index
        ),
      };
    });
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

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

      if (!isEdit && !isValidNumber(formData.stock)) {
        nextErrors.stock = 'Enter a valid initial stock';
      }

      if (!isEdit && !isValidNumber(formData.lowStockLimit)) {
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

        if (!isEdit && !isValidNumber(variant.stock)) {
          nextErrors[`variant_${index}_stock`] =
            'Enter a valid stock quantity';
        }

        if (!isEdit && !isValidNumber(variant.lowStockLimit)) {
          nextErrors[`variant_${index}_lowStockLimit`] =
            'Enter a valid low stock limit';
        }
      });
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // --------------------------------------------------
  // BUILD API PAYLOAD
  // --------------------------------------------------

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

        gstRate: Number(
          variant.gstRate ?? formData.gstRate
        ),

        lowStockLimit: Number(
          variant.lowStockLimit || 5
        ),

        sku: variant.sku.trim() || undefined,
        barcode: variant.barcode.trim() || undefined,

        ...(variant.isActive !== undefined && {
          isActive: variant.isActive,
        }),

        ...(!isEdit && {
          stock: Number(variant.stock || 0),
        }),
      })),
    };
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = (event) => {
    event?.preventDefault();

    if (loading || catalogueLoading) return;

    if (!validate()) return;

    const payload = buildPayload();

    onSave(payload, product?._id || product?.id);
  };

  // --------------------------------------------------
  // BARCODE SCANNER
  // --------------------------------------------------

  const openScanner = (target) => {
    setScannerTarget(target);
    setShowScanner(true);
  };

  const handleBarcodeScan = useCallback(
    (barcode) => {
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
    },
    [scannerTarget]
  );

  const closeScanner = useCallback(() => {
    setShowScanner(false);
    setScannerTarget(null);
  }, []);

  // --------------------------------------------------
  // SECTION HEADING
  // --------------------------------------------------

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

  // --------------------------------------------------
  // VARIANT FORM
  // --------------------------------------------------

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
          onClick={() => openScanner({ type: 'variant', index })}
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

  // --------------------------------------------------
  // SELECTED CATALOGUE SUMMARY
  // --------------------------------------------------

  const selectedCategory = categories.find(
    (item) => getId(item) === formData.categoryId
  );

  const selectedMainProduct = mainProducts.find(
    (item) => getId(item) === formData.mainProductId
  );

  const selectedBrandProduct = brandProducts.find(
    (item) => getId(item) === formData.brandProductId
  );

  // --------------------------------------------------
  // WIZARD ROUTE NAVIGATION
  // --------------------------------------------------

  const getCreateRoute = (step) => {
    const category = categories.find(
      (item) => getId(item) === formData.categoryId
    );

    const mainProduct = mainProducts.find(
      (item) => getId(item) === formData.mainProductId
    );

    const brandProduct = brandProducts.find(
      (item) => getId(item) === formData.brandProductId
    );

    if (step <= 1 || !category) {
      return '/product/create';
    }

    const categoryPath = routeSegment(category);

    if (step === 2 || !mainProduct) {
      return `/product/create/${categoryPath}`;
    }

    const mainProductPath = routeSegment(mainProduct);

    if (step === 3 || !brandProduct) {
      return `/product/create/${categoryPath}/${mainProductPath}`;
    }

    const brandProductPath = routeSegment(brandProduct);

    return `/product/create/${categoryPath}/${mainProductPath}/${brandProductPath}`;
  };

  const goToWizardStep = (step) => {
    if (step < 1 || step > 4) return;

    navigate(getCreateRoute(step));
  };

  // --------------------------------------------------
  // FOOTER
  // --------------------------------------------------

  const renderFooter = () => {
    if (!isEdit) {
      const canContinue =
        (wizardStep === 1 && Boolean(formData.categoryId)) ||
        (wizardStep === 2 && Boolean(formData.mainProductId)) ||
        (wizardStep === 3 && Boolean(formData.brandProductId));

      const goBack = () => {
        if (wizardStep === 1) {
          closePage();
          return;
        }

        goToWizardStep(wizardStep - 1);
      };

      const goNext = () => {
        if (!canContinue || catalogueLoading) return;

        goToWizardStep(wizardStep + 1);
      };

      return (
        <div className="flex w-full items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {wizardStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:inline">
              Step {wizardStep} of 4
            </span>

            {wizardStep < 4 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue || catalogueLoading}
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                form="product-form"
                disabled={loading || catalogueLoading}
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closePage}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          form="product-form"
          variant="primary"
          size="sm"
          loading={loading}
          disabled={loading || catalogueLoading}
        >
          Save Changes
        </Button>
      </div>
    );
  };

  // --------------------------------------------------
  // FORM CONTENT
  // --------------------------------------------------

  const formContent = (
    <form
      id="product-form"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ================================== */}
      {/* CREATE MODE */}
      {/* ================================== */}

      {!isEdit && (
        <>
          {catalogueError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {catalogueError}
            </div>
          )}

          {/* STEP 1: CATEGORY */}

          {wizardStep === 1 && (
            <CategoryStep
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onSelect={handleWizardCategorySelect}
              onCategoryCreated={handleCategoryCreated}
              onCategoryUpdated={handleCategoryUpdated}
              onCategoryDeleted={handleCategoryDeleted}
            />
          )}

          {/* STEP 2: MAIN PRODUCT */}

          {wizardStep === 2 && (
            <MainProductStep
              mainProducts={mainProducts}
              selectedMainProductId={formData.mainProductId}
              categoryId={formData.categoryId}
              onSelect={handleWizardMainProductSelect}
              onMainProductCreated={handleMainProductCreated}
              onMainProductUpdated={handleMainProductUpdated}
              onMainProductDeleted={handleMainProductDeleted}
              onBack={() => goToWizardStep(1)}
            />
          )}

          {/* STEP 3: BRAND PRODUCT */}

          {wizardStep === 3 && (
            <BrandProductStep
              brandProducts={brandProducts}
              selectedBrandProductId={formData.brandProductId}
              mainProductId={formData.mainProductId}
              onSelect={handleWizardBrandProductSelect}
              onBrandProductCreated={handleBrandProductCreated}
              onBrandProductUpdated={handleBrandProductUpdated}
              onBrandProductDeleted={handleBrandProductDeleted}
              onBack={() => goToWizardStep(2)}
            />
          )}

          {/* STEP 4: PRODUCT DETAILS */}

          {wizardStep === 4 && (
            <section className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Product Details
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Confirm the catalogue selection and configure inventory.
                </p>
              </div>

              {/* SELECTED CATALOGUE */}

              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Selected Catalogue
                  </h4>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: 'Category',
                      value: selectedCategory?.name || 'Selected',
                      step: 1,
                    },
                    {
                      label: 'Main Product',
                      value: selectedMainProduct?.name || 'Selected',
                      step: 2,
                    },
                    {
                      label: 'Brand Product',
                      value:
                        selectedBrandProduct?.name ||
                        selectedBrandProduct?.brandName ||
                        'Selected',
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

              {/* SELLING CONFIGURATION */}

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
                    {sectionHeading(
                      Layers,
                      'Inventory Information',
                      'Manage initial quantity and stock alerts'
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label={`Initial Stock (${formData.unit})`}
                        type="number"
                        name="stock"
                        min="0"
                        step="0.001"
                        value={formData.stock}
                        onChange={handleChange}
                        error={errors.stock}
                        required
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
            </section>
          )}
        </>
      )}

      {/* ================================== */}
      {/* EDIT MODE */}
      {/* ================================== */}

      {isEdit && (
        <>
          <section>
            {sectionHeading(
              Package,
              'Product Catalogue',
              'Update category, main product and brand product'
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

          {/* SELLING CONFIGURATION */}

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
                {sectionHeading(
                  Layers,
                  'Inventory Information',
                  'Manage available quantity and stock alerts'
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label={`Initial Stock (${formData.unit})`}
                    type="number"
                    name="stock"
                    min="0"
                    step="0.001"
                    value={formData.stock}
                    onChange={handleChange}
                    error={errors.stock}
                    disabled
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

                <p className="mt-2 text-xs text-slate-500">
                  Existing stock is not changed here. Use inventory
                  adjustments to update available stock.
                </p>
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
        </>
      )}
    </form>
  );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  if (!isOpen) return null;

  return (
    <>
      {/* EDIT PRODUCT */}

      {isEdit ? (
        <Modal
          isOpen={isOpen}
          onClose={closePage}
          title="Edit Product"
          subtitle="Update product configuration and pricing"
          maxWidth="max-w-4xl"
          footer={renderFooter()}
        >
          {formContent}
        </Modal>
      ) : (
        /* CREATE PRODUCT */

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-md sm:p-5 lg:p-8">
          <div
            className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-orange-100 bg-white px-5 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Package className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                    Create New Product
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Add a new product to your inventory
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePage}
                disabled={loading}
                aria-label="Close product creation"
                title="Close"
                className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* WIZARD PROGRESS */}

            <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-7">
              <div className="flex items-center justify-between gap-2">
                {[
                  { step: 1, label: 'Category' },
                  { step: 2, label: 'Main Product' },
                  { step: 3, label: 'Brand Product' },
                  { step: 4, label: 'Details' },
                ].map((item, index) => (
                  <React.Fragment key={item.step}>
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${wizardStep >= item.step
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
                        className={`hidden truncate text-xs font-medium sm:inline ${wizardStep === item.step
                          ? 'text-orange-600'
                          : wizardStep > item.step
                            ? 'text-slate-700'
                            : 'text-slate-400'
                          }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {index !== 3 && (
                      <div
                        className={`h-px min-w-3 flex-1 ${wizardStep > item.step
                          ? 'bg-orange-400'
                          : 'bg-slate-200'
                          }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* MODAL BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              {catalogueLoading && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
                  Loading catalogue...
                </div>
              )}

              {formContent}
            </div>

            {/* MODAL FOOTER */}

            <div className="flex shrink-0 items-center border-t border-orange-100 bg-white px-5 py-4 sm:px-7">
              {renderFooter()}
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER */}

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