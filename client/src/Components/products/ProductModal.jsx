import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, X, Loader2 } from 'lucide-react';

import Modal from '../common/Modal';
import Button from '../common/Button';
import BarcodeScanner from './BarcodeScanner';
import ProductModalSteps, { WizardProgress } from './ProductModalSteps';
import ProductModalFields from './ProductModalFields';

import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';

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
  isActive: true,
};

const createEmptyVariant = (defaultGstRate = 0) => ({
  ...INITIAL_VARIANT,
  gstRate: Number(defaultGstRate ?? 0),
  _tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
});

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
  if (typeof value === 'string') return value.trim();

  if (typeof value === 'object') {
    if (value._id) return getId(value._id);
    if (value.id) return getId(value.id);
    if (value.mainProductId) return getId(value.mainProductId);
    if (value.categoryId) return getId(value.categoryId);
    if (value.brandProductId) return getId(value.brandProductId);
    if (typeof value.toString === 'function') {
      const str = value.toString();
      if (/^[a-f\d]{24}$/i.test(str)) return str;
    }
  }

  return '';
};

const getRefName = (ref) => {
  if (!ref || typeof ref !== 'object') return '';

  return ref.name || ref.brandName || '';
};

const getList = (response, keys = []) => {
  if (Array.isArray(response)) return response;

  const candidates = [];

  for (const key of keys) {
    candidates.push(response?.[key]);
    candidates.push(response?.data?.[key]);
    candidates.push(response?.data?.data?.[key]);
  }

  candidates.push(
    response?.categories,
    response?.mainProducts,
    response?.brandProducts,
    response?.products,
    response?.data?.categories,
    response?.data?.mainProducts,
    response?.data?.brandProducts,
    response?.data?.products,
    response?.data?.data,
    response?.data
  );

  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }

  return [];
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const slugify = (value = '') => {
  const base = String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return base || 'item';
};

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const computeDeterministicSlugs = (items = []) => {
  const ordered = [...items].sort((a, b) => {
    const tA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (tA !== tB) return tA - tB;
    return String(getId(a)).localeCompare(String(getId(b)));
  });

  const used = new Set();
  const slugMap = new Map();

  ordered.forEach((item) => {
    const base = item?.slug || slugify(item?.name || item?.brandName || 'item');
    let candidate = base;
    let counter = 2;

    while (used.has(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }

    used.add(candidate);
    slugMap.set(String(getId(item)), candidate);
  });

  return slugMap;
};

const routeSegment = (item, siblings = []) => {
  if (!item) return 'item';
  if (item.slug) return item.slug;

  if (Array.isArray(siblings) && siblings.length > 0) {
    const slugMap = computeDeterministicSlugs(siblings);
    const mapped = slugMap.get(String(getId(item)));
    if (mapped) return mapped;
  }

  return slugify(item?.name || item?.brandName || 'item');
};

const resolveRouteItem = (items, segment) => {
  if (!segment || !Array.isArray(items)) return null;

  const decodedSegment = decodeURIComponent(segment).trim();

  // 1. Exact stored slug match
  const byStoredSlug = items.find(
    (item) => item?.slug && item.slug === decodedSegment
  );
  if (byStoredSlug) return byStoredSlug;

  // 2. Deterministic unique slug match (handles duplicate names without IDs)
  const slugMap = computeDeterministicSlugs(items);
  const byComputedSlug = items.find(
    (item) => slugMap.get(String(getId(item))) === decodedSegment
  );
  if (byComputedSlug) return byComputedSlug;

  // 3. Base slug match
  const byBaseSlug = items.find(
    (item) => slugify(item?.name || item?.brandName) === decodedSegment
  );
  if (byBaseSlug) return byBaseSlug;

  // 4. Backward compatibility: legacy `slug--mongoId` or raw `mongoId` URLs
  const legacyId = decodedSegment.includes('--')
    ? decodedSegment.split('--').pop()
    : decodedSegment;

  if (OBJECT_ID_RE.test(legacyId)) {
    return (
      items.find(
        (item) => String(getId(item)) === String(legacyId)
      ) || null
    );
  }

  return null;
};

const unwrapProduct = (response) => {
  if (!response) return null;

  if (response.product) return response.product;

  if (response.data?.product) {
    return response.data.product;
  }

  if (response.data?._id || response.data?.id) {
    return response.data;
  }

  if (response._id || response.id) {
    return response;
  }

  return null;
};

const isNotFoundError = (error) =>
  error?.response?.status === 404;

const CenteredLoader = ({ message = 'Loading...', minHeight = 'min-h-[260px]' }) => (
  <div className={`flex ${minHeight} w-full items-center justify-center`}>
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  </div>
);

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

  const {
    error: showError,
    confirm,
  } = useToast();

  const closePage = onClose || (() => navigate('/products'));

  // Direct edit mode = opened from ProductsPage with a `product` prop.
  // Wizard mode = `/product/create` (can still edit an existing product in Step 4).
  const isDirectEdit = Boolean(product);

  const lookupRequestRef = useRef(0);
  const lookupPromiseRef = useRef(null);
  const lookupBrandIdRef = useRef('');
  const mainRequestRef = useRef(0);
  const brandRequestRef = useRef(0);
  const lastFetchedMainCategoryRef = useRef('');
  const lastFetchedBrandMainRef = useRef('');
  const navLockRef = useRef(false);

  // --------------------------------------------------
  // ACTIVE & DETECTED PRODUCT
  // --------------------------------------------------

  const [activeProduct, setActiveProduct] = useState(product);
  const [detectedProduct, setDetectedProduct] = useState(product);
  const isEdit = Boolean(activeProduct);
  const activeProductRef = useRef(activeProduct);
  activeProductRef.current = activeProduct;

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

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [mainProductsLoading, setMainProductsLoading] = useState(false);
  const [brandProductsLoading, setBrandProductsLoading] = useState(false);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');

  const [productLookupLoading, setProductLookupLoading] = useState(false);

  const [resolvedCatalogue, setResolvedCatalogue] = useState({
    category: '',
    mainProduct: '',
    brandProduct: '',
  });

  const [wizardCatalogue, setWizardCatalogue] = useState({
    category: null,
    mainProduct: null,
    brandProduct: null,
  });

  // --------------------------------------------------
  // WIZARD STATE
  // --------------------------------------------------

  const routeStep = brandProductSlug
    ? 4
    : mainProductSlug
      ? 3
      : categorySlug
        ? 2
        : 1;

  const [wizardStep, setWizardStep] = useState(isDirectEdit ? 4 : routeStep);

  // --------------------------------------------------
  // LOCK BACKGROUND SCROLL
  // --------------------------------------------------

  useEffect(() => {
    if (isDirectEdit || !isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDirectEdit, isOpen]);

  // --------------------------------------------------
  // OPTIONS
  // --------------------------------------------------

  const unitOptions = UNITS.map((unit) => ({
    value: unit,
    label: unit,
  }));

  const gstOptions = GST_RATES.map((rate) => ({
    value: String(rate),
    label: `${rate}%`,
  }));

  // --------------------------------------------------
  // POPULATE PRODUCT FORM
  // --------------------------------------------------

  const populateProductForm = useCallback((selectedProduct) => {
    if (!selectedProduct) return;

    const variants = Array.isArray(selectedProduct.variants)
      ? selectedProduct.variants
          .filter((variant) => variant.isActive !== false)
          .map((variant) => ({
            _id: variant._id,
            variantName: variant.variantName || '',
            quantity: String(variant.quantity ?? 1),
            unit: variant.unit || 'pcs',
            purchasePrice: String(variant.purchasePrice ?? ''),
            sellingPrice: String(variant.sellingPrice ?? ''),
            gstRate: Number(
              variant.gstRate ?? selectedProduct.gstRate ?? 0
            ),
            stock: String(variant.stock ?? 0),
            lowStockLimit: String(variant.lowStockLimit ?? 5),
            sku: variant.sku || '',
            barcode: variant.barcode || '',
            isActive: variant.isActive ?? true,
          }))
      : [];

    setFormData({
      categoryId: getId(selectedProduct.categoryId),
      mainProductId: getId(selectedProduct.mainProductId),
      brandProductId: getId(selectedProduct.brandProductId),
      sellingType: selectedProduct.sellingType || 'LOOSE',
      unit: selectedProduct.unit || 'kg',
      purchasePrice:
        selectedProduct.purchasePrice != null
          ? String(selectedProduct.purchasePrice)
          : '',
      sellingPrice:
        selectedProduct.sellingPrice != null
          ? String(selectedProduct.sellingPrice)
          : '',
      stock: String(selectedProduct.stock ?? 0),
      lowStockLimit: String(selectedProduct.lowStockLimit ?? 5),
      sku: selectedProduct.sku || '',
      barcode: selectedProduct.barcode || '',
      gstRate: Number(selectedProduct.gstRate ?? 0),
      variants:
        variants.length > 0
          ? variants
          : [{ ...INITIAL_VARIANT }],
    });

    setErrors({});
  }, []);

  // --------------------------------------------------
  // RESET / INITIAL PRODUCT (ONLY ON OPEN OR PROP CHANGE)
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    setActiveProduct(product || null);
    setDetectedProduct(product || null);

    if (product) {
      populateProductForm(product);
      setWizardStep(4);
    } else {
      setFormData({
        ...INITIAL_FORM,
        variants: [{ ...INITIAL_VARIANT }],
      });
      setWizardCatalogue({
        category: null,
        mainProduct: null,
        brandProduct: null,
      });
      lastFetchedMainCategoryRef.current = '';
      lastFetchedBrandMainRef.current = '';
      lookupBrandIdRef.current = '';
      lookupPromiseRef.current = null;
    }

    setErrors({});
    setShowScanner(false);
    setScannerTarget(null);
    setCatalogueError('');
    setProductLookupLoading(false);
  }, [isOpen, product, populateProductForm]);

  // Sync wizardStep with URL routeStep in wizard mode
  useEffect(() => {
    if (!isOpen || isDirectEdit) return;
    setWizardStep(routeStep);
  }, [isOpen, isDirectEdit, routeStep]);

  // --------------------------------------------------
  // FETCH HELPERS (MAIN & BRAND PRODUCTS)
  // --------------------------------------------------

  const fetchMainProductsForCategory = useCallback(async (categoryId) => {
    const resolvedCatId = getId(categoryId);
    if (!resolvedCatId) {
      setMainProducts([]);
      lastFetchedMainCategoryRef.current = '';
      return [];
    }

    const reqId = ++mainRequestRef.current;
    lastFetchedMainCategoryRef.current = String(resolvedCatId);
    setMainProductsLoading(true);
    setCatalogueError('');

    try {
      const response = await productService.getMainProducts({
        categoryId: resolvedCatId,
      });

      if (reqId !== mainRequestRef.current) return [];

      const list = getList(response, ['mainProducts']);
      setMainProducts(list);
      return list;
    } catch (err) {
      if (reqId !== mainRequestRef.current) return [];

      setMainProducts([]);
      setCatalogueError(
        getErrorMessage(err, 'Failed to load main products.')
      );
      return [];
    } finally {
      if (reqId === mainRequestRef.current) {
        setMainProductsLoading(false);
      }
    }
  }, []);

  const fetchBrandProductsForMain = useCallback(async (mainProductId) => {
    const resolvedMainId = getId(mainProductId);
    if (!resolvedMainId) {
      setBrandProducts([]);
      lastFetchedBrandMainRef.current = '';
      return [];
    }

    const reqId = ++brandRequestRef.current;
    lastFetchedBrandMainRef.current = String(resolvedMainId);
    setBrandProductsLoading(true);
    setCatalogueError('');

    try {
      const response = await productService.getBrandProducts({
        mainProductId: resolvedMainId,
      });

      if (reqId !== brandRequestRef.current) return [];

      const list = getList(response, ['brandProducts']);
      setBrandProducts(list);
      return list;
    } catch (err) {
      if (reqId !== brandRequestRef.current) return [];

      setBrandProducts([]);
      setCatalogueError(
        getErrorMessage(err, 'Failed to load brand products.')
      );
      return [];
    } finally {
      if (reqId === brandRequestRef.current) {
        setBrandProductsLoading(false);
      }
    }
  }, []);

  // --------------------------------------------------
  // CHECK EXISTING PRODUCT BY BRAND PRODUCT
  // --------------------------------------------------

  const checkExistingProduct = useCallback(
    async (brandProductId, { openDetails = false } = {}) => {
      const resolvedBrandId = getId(brandProductId);
      if (!resolvedBrandId) return null;

      // Reuse in-flight request for the same Brand Product to avoid duplicate API calls
      if (
        lookupBrandIdRef.current === resolvedBrandId &&
        lookupPromiseRef.current
      ) {
        const existing = await lookupPromiseRef.current;
        if (openDetails) {
          if (existing) {
            const currentActiveId = getId(activeProductRef.current);
            setActiveProduct(existing);
            if (currentActiveId !== getId(existing)) {
              populateProductForm(existing);
            }
          } else {
            setActiveProduct(null);
          }
        }
        return existing;
      }

      const requestId = ++lookupRequestRef.current;
      lookupBrandIdRef.current = resolvedBrandId;
      setProductLookupLoading(true);
      setCatalogueError('');

      const runLookup = async () => {
        try {
          const response =
            await productService.getProductByBrandProduct(resolvedBrandId);

          if (requestId !== lookupRequestRef.current) {
            return null;
          }

          if (response?.exists === false || response?.data?.exists === false) {
            setDetectedProduct(null);
            if (openDetails) setActiveProduct(null);
            return null;
          }

          const existingProduct = unwrapProduct(response);
          setDetectedProduct(existingProduct || null);

          if (openDetails) {
            if (existingProduct) {
              setActiveProduct(existingProduct);
              populateProductForm(existingProduct);
            } else {
              setActiveProduct(null);
            }
          }

          return existingProduct || null;
        } catch (err) {
          if (requestId !== lookupRequestRef.current) {
            return null;
          }

          if (isNotFoundError(err)) {
            setDetectedProduct(null);
            if (openDetails) setActiveProduct(null);
            return null;
          }

          const message = getErrorMessage(
            err,
            'Unable to check existing product.'
          );

          setCatalogueError(message);
          showError(message);

          throw err;
        } finally {
          if (requestId === lookupRequestRef.current) {
            setProductLookupLoading(false);
            lookupPromiseRef.current = null;
          }
        }
      };

      const promise = runLookup();
      lookupPromiseRef.current = promise;
      return promise;
    },
    [populateProductForm, showError]
  );

  // --------------------------------------------------
  // DIRECT EDIT MODE CATALOGUE FETCHING
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen || !isDirectEdit) return;

    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const response = await productService.getCategories();
        if (!cancelled) {
          setCategories(getList(response, ['categories']));
        }
      } catch (err) {
        if (!cancelled) {
          setCatalogueError(
            getErrorMessage(err, 'Failed to load categories.')
          );
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [isOpen, isDirectEdit]);

  useEffect(() => {
    if (!isOpen || !isDirectEdit) return;

    if (!formData.categoryId) {
      setMainProducts([]);
      return;
    }

    fetchMainProductsForCategory(formData.categoryId);
  }, [isOpen, isDirectEdit, formData.categoryId, fetchMainProductsForCategory]);

  useEffect(() => {
    if (!isOpen || !isDirectEdit) return;

    if (!formData.mainProductId) {
      setBrandProducts([]);
      return;
    }

    fetchBrandProductsForMain(formData.mainProductId);
  }, [isOpen, isDirectEdit, formData.mainProductId, fetchBrandProductsForMain]);

  // --------------------------------------------------
  // RESTORE WIZARD FLOW FROM URL (PRESERVING BACK SELECTIONS)
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen || isDirectEdit) return;

    let cancelled = false;

    const restoreFromRoute = async () => {
      setCatalogueError('');

      try {
        // 1. Load categories once
        let categoryList = categories;
        if (categoryList.length === 0) {
          setCategoriesLoading(true);
          if (categorySlug) setCatalogueLoading(true);

          const categoryResponse = await productService.getCategories();
          categoryList = getList(categoryResponse, ['categories']);

          if (cancelled) return;
          setCategories(categoryList);
          setCategoriesLoading(false);
        }

        if (!categorySlug) {
          setCatalogueLoading(false);
          return;
        }

        const category = resolveRouteItem(categoryList, categorySlug);

        if (!category) {
          setCatalogueLoading(false);
          navigate('/product/create', { replace: true });
          return;
        }

        const catId = getId(category);

        // 2. Load main products for selected category if not already fetched
        let mainList = mainProducts;
        if (lastFetchedMainCategoryRef.current !== String(catId)) {
          mainList = await fetchMainProductsForCategory(catId);
          if (cancelled) return;
        }

        const mainProduct = mainProductSlug
          ? resolveRouteItem(mainList, mainProductSlug)
          : null;

        if (mainProductSlug && !mainProduct) {
          setCatalogueLoading(false);
          navigate(`/product/create/${categorySlug}`, { replace: true });
          return;
        }

        // 3. Load brand products if mainProductSlug is in the URL
        let brandList = brandProducts;
        let brandProduct = null;

        if (mainProduct) {
          const mainId = getId(mainProduct);
          if (lastFetchedBrandMainRef.current !== String(mainId)) {
            brandList = await fetchBrandProductsForMain(mainId);
            if (cancelled) return;
          }

          brandProduct = brandProductSlug
            ? resolveRouteItem(brandList, brandProductSlug)
            : null;

          if (brandProductSlug && !brandProduct) {
            setCatalogueLoading(false);
            navigate(
              `/product/create/${categorySlug}/${mainProductSlug}`,
              { replace: true }
            );
            return;
          }
        }

        if (cancelled) return;

        // Preserve previously selected deeper IDs when navigating Back to a shorter URL!
        const resolvedMainId = getId(mainProduct);
        const resolvedBrandId = getId(brandProduct);

        setWizardCatalogue((prev) => ({
          category: category || prev.category,
          mainProduct: mainProduct || prev.mainProduct,
          brandProduct: brandProduct || prev.brandProduct,
        }));

        setFormData((prev) => ({
          ...prev,
          categoryId: catId || prev.categoryId,
          mainProductId: resolvedMainId || prev.mainProductId,
          brandProductId: resolvedBrandId || prev.brandProductId,
        }));

        // If URL directly loads Step 4 with a brandProductSlug, load its existing product
        // only if we haven't already loaded it for this brandProductId (prevents wiping user edits).
        const alreadyLoadedForBrand =
          String(getId(activeProductRef.current?.brandProductId)) === String(resolvedBrandId) ||
          (lookupBrandIdRef.current === String(resolvedBrandId) && !lookupPromiseRef.current);

        if (brandProduct && brandProductSlug && !alreadyLoadedForBrand) {
          try {
            await checkExistingProduct(resolvedBrandId, { openDetails: true });
          } catch {
            // Error already shown by checkExistingProduct
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCatalogueError(
            getErrorMessage(err, 'Unable to restore product selection.')
          );
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
          setCatalogueLoading(false);
        }
      }
    };

    restoreFromRoute();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    isDirectEdit,
    categorySlug,
    mainProductSlug,
    brandProductSlug,
    navigate,
    fetchMainProductsForCategory,
    fetchBrandProductsForMain,
    checkExistingProduct,
  ]);

  // --------------------------------------------------
  // WIZARD ROUTE NAVIGATION
  // --------------------------------------------------

  const getCreateRoute = useCallback(
    (step) => {
      const category =
        categories.find(
          (item) => String(getId(item)) === String(formData.categoryId)
        ) || wizardCatalogue.category;

      const mainProduct =
        mainProducts.find(
          (item) => String(getId(item)) === String(formData.mainProductId)
        ) || wizardCatalogue.mainProduct;

      const brandProduct =
        brandProducts.find(
          (item) => String(getId(item)) === String(formData.brandProductId)
        ) || wizardCatalogue.brandProduct;

      if (step <= 1 || !category) {
        return '/product/create';
      }

      const categoryPath = routeSegment(category, categories);

      if (step === 2 || !mainProduct) {
        return `/product/create/${categoryPath}`;
      }

      const mainProductPath = routeSegment(mainProduct, mainProducts);

      if (step === 3 || !brandProduct) {
        return `/product/create/${categoryPath}/${mainProductPath}`;
      }

      const brandProductPath = routeSegment(brandProduct, brandProducts);

      return `/product/create/${categoryPath}/${mainProductPath}/${brandProductPath}`;
    },
    [
      categories,
      mainProducts,
      brandProducts,
      formData.categoryId,
      formData.mainProductId,
      formData.brandProductId,
      wizardCatalogue,
    ]
  );

  const goToWizardStep = useCallback(
    (step, overrideItems = {}) => {
      if (step < 1 || step > 4 || isDirectEdit) return;

      const cat =
        overrideItems.category ||
        categories.find(
          (item) => String(getId(item)) === String(formData.categoryId)
        ) ||
        wizardCatalogue.category;

      const main =
        overrideItems.mainProduct ||
        mainProducts.find(
          (item) => String(getId(item)) === String(formData.mainProductId)
        ) ||
        wizardCatalogue.mainProduct;

      const brand =
        overrideItems.brandProduct ||
        brandProducts.find(
          (item) => String(getId(item)) === String(formData.brandProductId)
        ) ||
        wizardCatalogue.brandProduct;

      let targetRoute = '/product/create';
      if (step >= 2 && cat) {
        const catPath = routeSegment(cat, categories);
        targetRoute = `/product/create/${catPath}`;

        if (step >= 3 && main) {
          const mainPath = routeSegment(main, mainProducts);
          targetRoute = `/product/create/${catPath}/${mainPath}`;

          if (step >= 4 && brand) {
            const brandPath = routeSegment(brand, brandProducts);
            targetRoute = `/product/create/${catPath}/${mainPath}/${brandPath}`;
          }
        }
      }

      setWizardStep(step);
      navigate(targetRoute);
    },
    [
      isDirectEdit,
      categories,
      mainProducts,
      brandProducts,
      formData.categoryId,
      formData.mainProductId,
      formData.brandProductId,
      wizardCatalogue,
      navigate,
    ]
  );

  // --------------------------------------------------
  // WIZARD SELECTION HANDLERS (SINGLE + DOUBLE CLICK)
  // --------------------------------------------------

  const handleWizardCategorySelect = useCallback(
    (category) => {
      const categoryId = getId(category);
      if (!categoryId) return;

      const isSameCategory =
        String(formData.categoryId) === String(categoryId);

      setWizardCatalogue((prev) =>
        isSameCategory
          ? { ...prev, category: category || prev.category }
          : {
              category: category || null,
              mainProduct: null,
              brandProduct: null,
            }
      );

      if (isSameCategory) {
        // Still ensure mainProducts are fetched if not loaded yet
        if (lastFetchedMainCategoryRef.current !== String(categoryId)) {
          fetchMainProductsForCategory(categoryId);
        }
        return;
      }

      setActiveProduct(null);
      setDetectedProduct(null);
      lookupBrandIdRef.current = '';
      lookupPromiseRef.current = null;

      setFormData((prev) => ({
        ...prev,
        categoryId,
        mainProductId: '',
        brandProductId: '',
      }));

      setMainProducts([]);
      setBrandProducts([]);
      lastFetchedBrandMainRef.current = '';
      setErrors({});

      fetchMainProductsForCategory(categoryId);
    },
    [formData.categoryId, fetchMainProductsForCategory]
  );

  const handleWizardCategoryDoubleClick = useCallback(
    (category) => {
      const categoryId = getId(category);
      if (!categoryId || navLockRef.current) return;

      navLockRef.current = true;
      setTimeout(() => {
        navLockRef.current = false;
      }, 300);

      handleWizardCategorySelect(category);
      goToWizardStep(2, { category });
    },
    [handleWizardCategorySelect, goToWizardStep]
  );

  const handleWizardMainProductSelect = useCallback(
    (mainProduct) => {
      const mainProductId = getId(mainProduct);
      if (!mainProductId) return;

      const isSameMain =
        String(formData.mainProductId) === String(mainProductId);

      setWizardCatalogue((prev) =>
        isSameMain
          ? { ...prev, mainProduct: mainProduct || prev.mainProduct }
          : {
              ...prev,
              mainProduct: mainProduct || null,
              brandProduct: null,
            }
      );

      if (isSameMain) {
        if (lastFetchedBrandMainRef.current !== String(mainProductId)) {
          fetchBrandProductsForMain(mainProductId);
        }
        return;
      }

      setActiveProduct(null);
      setDetectedProduct(null);
      lookupBrandIdRef.current = '';
      lookupPromiseRef.current = null;

      setFormData((prev) => ({
        ...prev,
        mainProductId,
        brandProductId: '',
      }));

      setBrandProducts([]);
      setErrors({});

      fetchBrandProductsForMain(mainProductId);
    },
    [formData.mainProductId, fetchBrandProductsForMain]
  );

  const handleWizardMainProductDoubleClick = useCallback(
    (mainProduct) => {
      const mainProductId = getId(mainProduct);
      if (!mainProductId || navLockRef.current) return;

      navLockRef.current = true;
      setTimeout(() => {
        navLockRef.current = false;
      }, 300);

      handleWizardMainProductSelect(mainProduct);
      goToWizardStep(3, { mainProduct });
    },
    [handleWizardMainProductSelect, goToWizardStep]
  );

  // Single-click Brand Product: highlight + detect existing product WITHOUT opening Step 4
  const handleWizardBrandProductSelect = useCallback(
    async (brandProduct) => {
      const brandProductId = getId(brandProduct);
      if (!brandProductId) return;

      const isSameBrand =
        String(formData.brandProductId) === String(brandProductId);

      setWizardCatalogue((prev) => ({
        ...prev,
        brandProduct: brandProduct || prev.brandProduct,
      }));

      if (!isSameBrand) {
        setActiveProduct(null);
        setDetectedProduct(null);
        setFormData((prev) => ({
          ...prev,
          brandProductId,
        }));
        setErrors({});
      }

      // Check existing product silently in Step 3 unless already checked for this brandProductId
      if (!isSameBrand || lookupBrandIdRef.current !== String(brandProductId)) {
        try {
          await checkExistingProduct(brandProductId, { openDetails: false });
        } catch {
          // Error already shown by checkExistingProduct
        }
      }
    },
    [formData.brandProductId, checkExistingProduct]
  );

  // Open Step 4 (Product Details) for currently selected or double-clicked Brand Product
  const openProductDetails = useCallback(
    async (brandProductOverride = null) => {
      const targetBrandId =
        getId(brandProductOverride) || formData.brandProductId;

      if (!targetBrandId || navLockRef.current) return;

      navLockRef.current = true;
      setTimeout(() => {
        navLockRef.current = false;
      }, 300);

      try {
        const existingProduct = await checkExistingProduct(targetBrandId, {
          openDetails: false,
        });

        if (existingProduct) {
          // Only re-populate if we haven't already loaded this exact product into activeProduct
          if (getId(activeProduct) !== getId(existingProduct)) {
            setActiveProduct(existingProduct);
            populateProductForm(existingProduct);
          } else if (!activeProduct) {
            setActiveProduct(existingProduct);
            populateProductForm(existingProduct);
          }
        } else {
          // If switching from an earlier existing product to a new product, reset detail fields
          if (activeProduct) {
            setActiveProduct(null);
            setFormData((prev) => ({
              ...INITIAL_FORM,
              categoryId: prev.categoryId,
              mainProductId: prev.mainProductId,
              brandProductId: targetBrandId,
              variants: [{ ...INITIAL_VARIANT }],
            }));
          } else {
            setActiveProduct(null);
          }
        }

        goToWizardStep(
          4,
          brandProductOverride ? { brandProduct: brandProductOverride } : {}
        );
      } catch {
        // Error already shown by checkExistingProduct
      }
    },
    [
      formData.brandProductId,
      activeProduct,
      checkExistingProduct,
      populateProductForm,
      goToWizardStep,
    ]
  );

  const handleWizardBrandProductDoubleClick = useCallback(
    async (brandProduct) => {
      const brandProductId = getId(brandProduct);
      if (!brandProductId) return;

      setWizardCatalogue((prev) => ({
        ...prev,
        brandProduct: brandProduct || prev.brandProduct,
      }));

      if (String(formData.brandProductId) !== String(brandProductId)) {
        setActiveProduct(null);
        setDetectedProduct(null);
        setFormData((prev) => ({
          ...prev,
          brandProductId,
        }));
        setErrors({});
      }

      await openProductDetails(brandProduct);
    },
    [formData.brandProductId, openProductDetails]
  );

  // --------------------------------------------------
  // CATALOGUE CRUD CALLBACKS
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

  const handleCategoryDeleted = useCallback(
    (categoryId) => {
      if (!categoryId) return;
      const deletedId = String(categoryId);

      setCategories((prev) =>
        prev.filter((category) => String(getId(category)) !== deletedId)
      );

      if (String(formData.categoryId) !== deletedId) return;

      setActiveProduct(null);
      setDetectedProduct(null);
      setFormData((prev) => ({
        ...prev,
        categoryId: '',
        mainProductId: '',
        brandProductId: '',
      }));

      setMainProducts([]);
      setBrandProducts([]);
      lastFetchedMainCategoryRef.current = '';
      lastFetchedBrandMainRef.current = '';
      lookupBrandIdRef.current = '';
      setErrors({});
      setWizardStep(1);

      navigate('/product/create', { replace: true });
    },
    [formData.categoryId, navigate]
  );

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

  const handleMainProductDeleted = useCallback(
    (productId) => {
      if (!productId) return;
      const deletedId = String(productId);

      setMainProducts((prev) =>
        prev.filter((item) => String(getId(item)) !== deletedId)
      );

      if (String(formData.mainProductId) !== deletedId) return;

      setActiveProduct(null);
      setDetectedProduct(null);
      setFormData((prev) => ({
        ...prev,
        mainProductId: '',
        brandProductId: '',
      }));

      setBrandProducts([]);
      lastFetchedBrandMainRef.current = '';
      lookupBrandIdRef.current = '';
      setErrors({});
      setWizardStep(2);

      const category = categories.find(
        (item) => String(getId(item)) === String(formData.categoryId)
      );

      navigate(
        category
          ? `/product/create/${routeSegment(category, categories)}`
          : '/product/create',
        { replace: true }
      );
    },
    [categories, formData.categoryId, formData.mainProductId, navigate]
  );

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

  const handleBrandProductUpdated = (updatedProduct) => {
    const productId = getId(updatedProduct);

    setBrandProducts((prev) =>
      prev.map((item) => {
        if (getId(item) !== productId) return item;

        return {
          ...item,
          ...updatedProduct,
          image: updatedProduct.image || item.image || '',
        };
      })
    );
  };

  const handleBrandProductDeleted = useCallback(
    (productId) => {
      if (!productId) return;
      const deletedId = String(productId);

      setBrandProducts((prev) =>
        prev.filter((item) => String(getId(item)) !== deletedId)
      );

      if (String(formData.brandProductId) !== deletedId) return;

      setActiveProduct(null);
      setDetectedProduct(null);
      lookupBrandIdRef.current = '';
      setFormData((prev) => ({
        ...prev,
        brandProductId: '',
      }));

      setErrors({});
      setWizardStep(3);

      const category = categories.find(
        (item) => String(getId(item)) === String(formData.categoryId)
      );
      const mainProduct = mainProducts.find(
        (item) => String(getId(item)) === String(formData.mainProductId)
      );

      navigate(
        category && mainProduct
          ? `/product/create/${routeSegment(category, categories)}/${routeSegment(mainProduct, mainProducts)}`
          : category
            ? `/product/create/${routeSegment(category, categories)}`
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
  // FORM & VARIANT HANDLERS
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
      variants: [...prev.variants, createEmptyVariant(prev.gstRate)],
    }));
  };

  const removeVariant = async (index) => {
    const variant = formData.variants[index];

    if (!variant || formData.variants.length <= 1) {
      showError('At least one variant is required.');
      return;
    }

    if (variant._id) {
      const confirmed = await confirm({
        title: 'Remove Variant?',
        message:
          `Are you sure you want to remove "${variant.variantName}"? ` +
          'This variant will be deactivated when you save changes and will no longer be available for sale.',
        confirmText: 'Remove Variant',
        cancelText: 'Keep Variant',
        variant: 'danger',
      });

      if (!confirmed) return;
    }

    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));

    setErrors({});
  };

  // --------------------------------------------------
  // VALIDATION & PAYLOAD
  // --------------------------------------------------

  const isValidNumber = (value, minimum = 0) =>
    value !== '' &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value)) &&
    Number(value) >= minimum;

  const validate = () => {
    const nextErrors = {};

    if (!isEdit) {
      if (!formData.categoryId) {
        nextErrors.categoryId = 'Please select a category';
      }
      if (!formData.mainProductId) {
        nextErrors.mainProductId = 'Please select a main product';
      }
      if (!formData.brandProductId) {
        nextErrors.brandProductId = 'Please select a brand product';
      }
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
      if (!isValidNumber(formData.lowStockLimit)) {
        nextErrors.lowStockLimit = 'Enter a valid low stock limit';
      }
    }

    if (formData.sellingType === 'VARIANT') {
      if (!formData.variants.length) {
        nextErrors.variants = 'Add at least one variant';
      }

      const seenSkus = new Map();
      const seenBarcodes = new Map();

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
          nextErrors[`variant_${index}_unit`] = 'Select a unit';
        }
        if (!isValidNumber(variant.purchasePrice)) {
          nextErrors[`variant_${index}_purchasePrice`] =
            'Enter a valid purchase price';
        }
        if (!isValidNumber(variant.sellingPrice)) {
          nextErrors[`variant_${index}_sellingPrice`] =
            'Enter a valid selling price';
        }
        if ((!isEdit || !variant._id) && !isValidNumber(variant.stock)) {
          nextErrors[`variant_${index}_stock`] =
            'Enter a valid stock quantity';
        }
        if (!isValidNumber(variant.lowStockLimit)) {
          nextErrors[`variant_${index}_lowStockLimit`] =
            'Enter a valid low stock limit';
        }

        const normalizedSku = variant.sku.trim().toUpperCase();
        if (normalizedSku) {
          if (seenSkus.has(normalizedSku)) {
            nextErrors[`variant_${index}_sku`] = 'Duplicate SKU in variants';
          } else {
            seenSkus.set(normalizedSku, index);
          }
        }

        const normalizedBarcode = variant.barcode.trim();
        if (normalizedBarcode) {
          if (seenBarcodes.has(normalizedBarcode)) {
            nextErrors[`variant_${index}_barcode`] =
              'Duplicate barcode in variants';
          } else {
            seenBarcodes.set(normalizedBarcode, index);
          }
        }
      });
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => {
        const firstError = document.querySelector(
          '#product-form [aria-invalid="true"], #product-form .text-rose-500'
        );

        firstError?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });

      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const commonData = isEdit
      ? {}
      : {
          categoryId: getId(formData.categoryId),
          mainProductId: getId(formData.mainProductId),
          brandProductId: getId(formData.brandProductId),
          sellingType: formData.sellingType,
        };

    if (formData.sellingType === 'LOOSE') {
      return {
        ...commonData,
        unit: formData.unit,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        gstRate: Number(formData.gstRate),
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
      gstRate: Number(formData.gstRate),
      variants: formData.variants.map((variant) => ({
        ...(variant._id && { _id: variant._id }),
        variantName: variant.variantName.trim(),
        quantity: Number(variant.quantity),
        unit: variant.unit,
        purchasePrice: Number(variant.purchasePrice),
        sellingPrice: Number(variant.sellingPrice),
        gstRate: Number(variant.gstRate ?? formData.gstRate),
        lowStockLimit:
          variant.lowStockLimit === '' || variant.lowStockLimit == null
            ? 5
            : Number(variant.lowStockLimit),
        sku: variant.sku.trim() || undefined,
        barcode: variant.barcode.trim() || undefined,
        ...(variant.isActive !== undefined && {
          isActive: variant.isActive,
        }),
        // Preserve existing variant stock on edit; send stock only for new variants
        ...((!isEdit || !variant._id) && {
          stock: Number(variant.stock || 0),
        }),
      })),
    };
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (loading || catalogueLoading || productLookupLoading) {
      return;
    }

    if (!validate()) return;

    if (!onSave) {
      showError('Save handler is not configured.');
      return;
    }

    try {
      const payload = buildPayload();

      const productId = activeProduct
        ? activeProduct._id || activeProduct.id
        : undefined;

      await onSave(payload, productId);
    } catch (err) {
      showError(getErrorMessage(err, 'Unable to save product.'));
    }
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
  // SELECTED CATALOGUE SUMMARY & RESOLUTION
  // --------------------------------------------------

  const selectedCategory = categories.find(
    (item) => String(getId(item)) === String(formData.categoryId)
  );

  const selectedMainProduct = mainProducts.find(
    (item) => String(getId(item)) === String(formData.mainProductId)
  );

  const selectedBrandProduct = brandProducts.find(
    (item) => String(getId(item)) === String(formData.brandProductId)
  );

  useEffect(() => {
    if (!isOpen) {
      setResolvedCatalogue({
        category: '',
        mainProduct: '',
        brandProduct: '',
      });
      return;
    }

    let cancelled = false;

    const immediateCategory =
      getRefName(activeProduct?.categoryId) ||
      (typeof activeProduct?.category === 'string'
        ? activeProduct.category
        : '') ||
      getRefName(wizardCatalogue.category) ||
      selectedCategory?.name ||
      '';

    const immediateMainProduct =
      getRefName(activeProduct?.mainProductId) ||
      (typeof activeProduct?.mainProduct === 'string'
        ? activeProduct.mainProduct
        : '') ||
      getRefName(wizardCatalogue.mainProduct) ||
      selectedMainProduct?.name ||
      '';

    const immediateBrandProduct =
      getRefName(activeProduct?.brandProductId) ||
      (typeof activeProduct?.name === 'string'
        ? activeProduct.name
        : '') ||
      getRefName(wizardCatalogue.brandProduct) ||
      getRefName(selectedBrandProduct) ||
      '';

    setResolvedCatalogue({
      category: immediateCategory,
      mainProduct: immediateMainProduct,
      brandProduct: immediateBrandProduct,
    });

    const catId = formData.categoryId || getId(activeProduct?.categoryId);
    const mainId =
      formData.mainProductId || getId(activeProduct?.mainProductId);
    const brandId =
      formData.brandProductId || getId(activeProduct?.brandProductId);

    const needsFetch =
      (catId && !immediateCategory) ||
      (mainId && !immediateMainProduct) ||
      (brandId && !immediateBrandProduct);

    if (!needsFetch) return;

    const resolveMissingNames = async () => {
      let nextCat = immediateCategory;
      let nextMain = immediateMainProduct;
      let nextBrand = immediateBrandProduct;

      const activeId = getId(activeProduct);
      if (
        activeId &&
        (typeof activeProduct?.categoryId !== 'object' ||
          typeof activeProduct?.mainProductId !== 'object' ||
          typeof activeProduct?.brandProductId !== 'object')
      ) {
        try {
          const prodRes = await productService.getProductById(activeId);
          const populated = unwrapProduct(prodRes);
          if (populated && !cancelled) {
            nextCat = nextCat || getRefName(populated.categoryId);
            nextMain = nextMain || getRefName(populated.mainProductId);
            nextBrand = nextBrand || getRefName(populated.brandProductId);
            setActiveProduct((prev) =>
              prev && String(getId(prev)) === String(activeId)
                ? { ...prev, ...populated }
                : prev
            );
          }
        } catch {
          // Fall through to individual record lookups
        }
      }

      const [catRes, mainRes, brandRes] = await Promise.allSettled([
        catId && !nextCat
          ? productService.getCategoryById(catId)
          : Promise.resolve(null),
        mainId && !nextMain
          ? productService.getMainProductById(mainId)
          : Promise.resolve(null),
        brandId && !nextBrand
          ? productService.getBrandProductById(brandId)
          : Promise.resolve(null),
      ]);

      if (cancelled) return;

      if (catRes.status === 'fulfilled' && catRes.value) {
        const c =
          catRes.value.category ||
          catRes.value.data?.category ||
          catRes.value;
        nextCat = nextCat || getRefName(c);
      }

      if (mainRes.status === 'fulfilled' && mainRes.value) {
        const m =
          mainRes.value.mainProduct ||
          mainRes.value.data?.mainProduct ||
          mainRes.value;
        nextMain = nextMain || getRefName(m);
      }

      if (brandRes.status === 'fulfilled' && brandRes.value) {
        const b =
          brandRes.value.brandProduct ||
          brandRes.value.data?.brandProduct ||
          brandRes.value;
        nextBrand = nextBrand || getRefName(b);
      }

      setResolvedCatalogue({
        category: nextCat,
        mainProduct: nextMain,
        brandProduct: nextBrand,
      });
    };

    resolveMissingNames();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    activeProduct,
    formData.categoryId,
    formData.mainProductId,
    formData.brandProductId,
    selectedCategory,
    selectedMainProduct,
    selectedBrandProduct,
    wizardCatalogue,
  ]);

  const catalogueDisplay = {
    category:
      resolvedCatalogue.category ||
      getRefName(wizardCatalogue.category) ||
      selectedCategory?.name ||
      getRefName(activeProduct?.categoryId) ||
      '',
    mainProduct:
      resolvedCatalogue.mainProduct ||
      getRefName(wizardCatalogue.mainProduct) ||
      selectedMainProduct?.name ||
      getRefName(activeProduct?.mainProductId) ||
      '',
    brandProduct:
      resolvedCatalogue.brandProduct ||
      getRefName(wizardCatalogue.brandProduct) ||
      getRefName(selectedBrandProduct) ||
      getRefName(activeProduct?.brandProductId) ||
      '',
  };

  // Keep getCreateRoute referenced if needed by any future step links
  void getCreateRoute;

  // --------------------------------------------------
  // FOOTER
  // --------------------------------------------------

  const renderFooter = () => {
    if (!isDirectEdit) {
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
        if (
          !canContinue ||
          catalogueLoading ||
          productLookupLoading
        ) {
          return;
        }

        if (wizardStep === 3) {
          openProductDetails();
          return;
        }

        goToWizardStep(wizardStep + 1);
      };

      const step3Label = productLookupLoading
        ? 'Checking...'
        : detectedProduct
          ? 'Edit Product'
          : 'Create Product';

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
                disabled={
                  !canContinue ||
                  catalogueLoading ||
                  productLookupLoading
                }
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {wizardStep === 3 ? step3Label : 'Continue'}
              </button>
            ) : (
              <button
                type="submit"
                form="product-form"
                disabled={
                  loading ||
                  catalogueLoading ||
                  productLookupLoading
                }
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? isEdit
                    ? 'Saving...'
                    : 'Creating...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Create Product'}
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

  const fieldsElement = (
    <ProductModalFields
      isEdit={isEdit}
      formData={formData}
      errors={errors}
      unitOptions={unitOptions}
      gstOptions={gstOptions}
      catalogueDisplay={catalogueDisplay}
      handleChange={handleChange}
      handleVariantChange={handleVariantChange}
      addVariant={addVariant}
      removeVariant={removeVariant}
      openScanner={openScanner}
    />
  );

  const formContent = (
    <form
      id="product-form"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {!isDirectEdit ? (
        <ProductModalSteps
          wizardStep={wizardStep}
          isEdit={isEdit}
          categories={categories}
          mainProducts={mainProducts}
          brandProducts={brandProducts}
          categoriesLoading={categoriesLoading}
          mainProductsLoading={mainProductsLoading}
          brandProductsLoading={brandProductsLoading}
          catalogueError={catalogueError}
          formData={formData}
          catalogueDisplay={catalogueDisplay}
          goToWizardStep={goToWizardStep}
          onCategorySelect={handleWizardCategorySelect}
          onCategoryDoubleClick={handleWizardCategoryDoubleClick}
          onCategoryCreated={handleCategoryCreated}
          onCategoryUpdated={handleCategoryUpdated}
          onCategoryDeleted={handleCategoryDeleted}
          onMainProductSelect={handleWizardMainProductSelect}
          onMainProductDoubleClick={handleWizardMainProductDoubleClick}
          onMainProductCreated={handleMainProductCreated}
          onMainProductUpdated={handleMainProductUpdated}
          onMainProductDeleted={handleMainProductDeleted}
          onBrandProductSelect={handleWizardBrandProductSelect}
          onBrandProductDoubleClick={handleWizardBrandProductDoubleClick}
          onBrandProductCreated={handleBrandProductCreated}
          onBrandProductUpdated={handleBrandProductUpdated}
          onBrandProductDeleted={handleBrandProductDeleted}
        >
          {fieldsElement}
        </ProductModalSteps>
      ) : (
        fieldsElement
      )}
    </form>
  );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  if (!isOpen) return null;

  return (
    <>
      {isDirectEdit ? (
        <Modal
          isOpen={isOpen}
          onClose={closePage}
          title="Edit Product"
          subtitle="Update product configuration and pricing"
          maxWidth="max-w-4xl"
          footer={renderFooter()}
        >
          {catalogueError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {catalogueError}
            </div>
          )}

          {productLookupLoading ? (
            <CenteredLoader message="Loading product details..." />
          ) : (
            formContent
          )}
        </Modal>
      ) : (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/45 p-2 backdrop-blur-md sm:p-4 lg:p-6">
          <div
            className="relative flex h-[90vh] max-h-[950px] w-[95vw] max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl sm:rounded-3xl"
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
                    {wizardStep === 4 && isEdit
                      ? 'Edit Product'
                      : 'Create New Product'}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    {wizardStep === 4 && isEdit
                      ? 'Update existing product pricing, tax, and variants'
                      : 'Add a new product to your inventory'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePage}
                disabled={loading}
                aria-label="Close product modal"
                title="Close"
                className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* WIZARD PROGRESS */}
            <WizardProgress wizardStep={wizardStep} isEdit={isEdit} />

            {/* MODAL BODY */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-7 sm:py-6">
              {catalogueLoading ? (
                <CenteredLoader message="Loading catalogue..." minHeight="min-h-full" />
              ) : (
                formContent
              )}
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
