import api from './api';

const productService = {

  // ======================================================
  // CATEGORIES
  // ======================================================

  async getCategories(params = {}) {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  async getCategoryById(id) {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async createCategory(data) {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async updateCategory(id, data) {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await api.patch(`/archive/category/${id}/archive`);
    return response.data;
  },

  async restoreCategory(id) {
    const response = await api.patch(`/archive/category/${id}/restore`);
    return response.data;
  },

  async permanentDeleteCategory(id) {
    const response = await api.delete(`/archive/category/${id}/permanent`);
    return response.data;
  },


  // ======================================================
  // MAIN PRODUCTS
  // ======================================================

  async getMainProducts(params = {}) {
    const response = await api.get('/main-products', { params });
    return response.data;
  },

  async getMainProductById(id) {
    const response = await api.get(`/main-products/${id}`);
    return response.data;
  },

  async createMainProduct(data) {
    const response = await api.post('/main-products', data);
    return response.data;
  },

  async updateMainProduct(id, data) {
    const response = await api.patch(`/main-products/${id}`, data);
    return response.data;
  },

  async deleteMainProduct(id) {
    const response = await api.patch(`/archive/main-product/${id}/archive`);
    return response.data;
  },

  async restoreMainProduct(id) {
    const response = await api.patch(`/archive/main-product/${id}/restore`);
    return response.data;
  },

  async permanentDeleteMainProduct(id) {
    const response = await api.delete(`/archive/main-product/${id}/permanent`);
    return response.data;
  },


  // ======================================================
  // BRAND PRODUCTS
  // ======================================================

  async getBrandProducts(params = {}) {
    const response = await api.get('/brand-products', { params });
    return response.data;
  },

  async getBrandProductById(id) {
    const response = await api.get(`/brand-products/${id}`);
    return response.data;
  },

  async createBrandProduct(data) {
    const response = await api.post('/brand-products', data);
    return response.data;
  },

  async updateBrandProduct(id, data) {
    const response = await api.patch(`/brand-products/${id}`, data);
    return response.data;
  },

  async deleteBrandProduct(id) {
    const response = await api.patch(`/archive/brand-product/${id}/archive`);
    return response.data;
  },

  async restoreBrandProduct(id) {
    const response = await api.patch(`/archive/brand-product/${id}/restore`);
    return response.data;
  },

  async permanentDeleteBrandProduct(id) {
    const response = await api.delete(`/archive/brand-product/${id}/permanent`);
    return response.data;
  },


  // ======================================================
  // INVENTORY PRODUCTS
  // ======================================================

  async getOwnerProducts(params = {}) {
    const response = await api.get('/products/owner', { params });
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/products/owner/${id}`);
    return response.data;
  },

  // NEW: Find existing inventory product by Brand Product ID
  async getProductByBrandProduct(brandProductId) {
    const response = await api.get(
      `/products/brand-product/${brandProductId}`
    );

    return response.data;
  },

  async createProduct(data) {
    const response = await api.post('/products', data);
    return response.data;
  },

  async updateProduct(id, payload) {
    const response = await api.patch(
      `/products/${id}`,
      payload
    );

    return response.data;
  },

  async deleteProduct(id) {
    const response = await api.patch(`/archive/product/${id}/archive`);
    return response.data;
  },

  async restoreProduct(id) {
    const response = await api.patch(`/archive/product/${id}/restore`);
    return response.data;
  },

  async permanentDeleteProduct(id) {
    const response = await api.delete(`/archive/product/${id}/permanent`);
    return response.data;
  },


  // ======================================================
  // STOCK MANAGEMENT
  // ======================================================

  async addStock(id, { quantity, reason, variantId }) {
    const response = await api.patch(
      `/products/${id}/add-stock`,
      {
        quantity,
        note: reason,
        ...(variantId ? { variantId } : {}),
      }
    );

    return response.data;
  },

  async removeStock(id, { quantity, reason, variantId }) {
    const response = await api.patch(
      `/products/${id}/remove-stock`,
      {
        quantity,
        note: reason,
        ...(variantId ? { variantId } : {}),
      }
    );

    return response.data;
  },

  async getInventoryHistory(id, params = {}) {
    const response = await api.get(
      `/products/${id}/inventory-history`,
      { params }
    );

    return response.data;
  },


  // ======================================================
  // BILLING PRODUCTS
  // ======================================================

  async getBillingProducts(params = {}) {
    const response = await api.get('/products/billing', { params });
    return response.data;
  },

  async getProductByBarcode(barcode) {
    const response = await api.get(
      `/products/billing/barcode/${encodeURIComponent(barcode)}`
    );

    return response.data;
  },

};

export { productService };
export default productService;