import api from './api';

const productService = {

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
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

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
    const response = await api.delete(`/main-products/${id}`);
    return response.data;
  },

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
    const response = await api.delete(`/brand-products/${id}`);
    return response.data;
  },

  async getOwnerProducts(params = {}) {
    const response = await api.get('/products/owner', { params });
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/products/owner/${id}`);
    return response.data;
  },

  async createProduct(data) {
    const response = await api.post('/products', data);
    return response.data;
  },

  async updateProduct(id, data) {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  async addStock(id, { quantity, reason, variantId }) {
    const response = await api.patch(
      `/products/${id}/add-stock`,
      {
        quantity,
        reason,
        variantId,
      }
    );

    return response.data;
  },

  async removeStock(id, { quantity, reason, variantId }) {
    const response = await api.patch(
      `/products/${id}/remove-stock`,
      {
        quantity,
        reason,
        variantId,
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