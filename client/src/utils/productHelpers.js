export const getId = (value) => {
  if (!value) return '';

  if (typeof value === 'object') {
    return value._id || value.id || '';
  }

  return value;
};

export const getProductName = (product) => {
  return (
    product?.brandProductId?.name ||
    product?.name ||
    'Unnamed Product'
  );
};

export const getCategoryName = (product) => {
  return (
    product?.categoryId?.name ||
    product?.category?.name ||
    product?.category ||
    'General'
  );
};

export const getMainProductName = (product) => {
  return (
    product?.mainProductId?.name ||
    '—'
  );
};

export const getBrandName = (product) => {
  return (
    product?.brandProductId?.brandName ||
    product?.brandProductId?.name ||
    'Unbranded'
  );
};

export const getProductStock = (product) => {
  if (product?.sellingType === 'VARIANT') {
    return (product.variants || [])
      .filter((variant) => variant.isActive !== false)
      .reduce(
        (total, variant) => total + Number(variant.stock || 0),
        0
      );
  }

  return Number(product?.stock || 0);
};

export const getStockSummary = (product) => {
  if (product?.sellingType === 'VARIANT') {
    const variants = (product.variants || []).filter(
      (variant) => variant.isActive !== false
    );

    const totalStock = variants.reduce(
      (total, variant) => total + Number(variant.stock || 0),
      0
    );

    const lowStockCount = variants.filter((variant) => {
      const stock = Number(variant.stock || 0);
      const limit = Number(variant.lowStockLimit ?? 5);

      return stock > 0 && stock <= limit;
    }).length;

    const outOfStockCount = variants.filter(
      (variant) => Number(variant.stock || 0) <= 0
    ).length;

    return {
      totalStock,
      lowStockCount,
      outOfStockCount,
      variantCount: variants.length,
    };
  }

  const stock = Number(product?.stock || 0);
  const limit = Number(product?.lowStockLimit ?? 5);

  return {
    totalStock: stock,
    lowStockCount: stock > 0 && stock <= limit ? 1 : 0,
    outOfStockCount: stock <= 0 ? 1 : 0,
    variantCount: 0,
  };
};

export const isProductLowStock = (product) => {
  const summary = getStockSummary(product);

  return summary.lowStockCount > 0;
};

export const isProductOutOfStock = (product) => {
  const summary = getStockSummary(product);

  if (product?.sellingType === 'VARIANT') {
    return (
      summary.variantCount > 0 &&
      summary.outOfStockCount === summary.variantCount
    );
  }

  return summary.totalStock <= 0;
};

export const getProductPrice = (product) => {
  if (product?.sellingType === 'VARIANT') {
    const prices = (product.variants || [])
      .filter((variant) => variant.isActive !== false)
      .map((variant) => Number(variant.sellingPrice || 0));

    if (!prices.length) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return { min, max };
  }

  return {
    min: Number(product?.sellingPrice || 0),
    max: Number(product?.sellingPrice || 0),
  };
};

export const getProductCostPrice = (product) => {
  if (product?.sellingType === 'VARIANT') {
    const prices = (product.variants || [])
      .filter((variant) => variant.isActive !== false)
      .map((variant) => Number(variant.purchasePrice || 0));

    if (!prices.length) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return { min, max };
  }

  return {
    min: Number(product?.purchasePrice || 0),
    max: Number(product?.purchasePrice || 0),
  };
};

export const formatPriceRange = (price, formatCurrency) => {
  if (!price) return '—';

  if (price.min === price.max) {
    return formatCurrency(price.min);
  }

  return `${formatCurrency(price.min)} - ${formatCurrency(price.max)}`;
};

export const getProductIdentifiers = (product) => {
  if (product?.sellingType === 'VARIANT') {
    const variants = (product.variants || []).filter(
      (variant) => variant.isActive !== false
    );

    return variants.length;
  }

  return product?.sku || product?.barcode || null;
};

export const normalizeList = (response, keys = []) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};