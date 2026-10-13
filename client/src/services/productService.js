import api from './api';

export const productService = {
  /**
   * Get products for Store Owner (includes purchase prices)
   */
  async getOwnerProducts(params = {}) {
    const response = await api.get('/products/owner', { params });
    return response.data;
  },

  /**
   * Get products for Billing Operator (excludes purchase prices)
   */
  async getBillingProducts(params = {}) {
    const response = await api.get('/products/billing', { params });
    return response.data;
  },

  /**
   * Look up a single product by barcode (POS quick scan)
   */
  async getProductByBarcode(barcode) {
    const response = await api.get(`/products/billing/barcode/${encodeURIComponent(barcode)}`);
    return response.data;
  },

  /**
   * Create a new product in the catalog
   */
  async createProduct(data) {
    const response = await api.post('/products', data);
    return response.data;
  },

  /**
   * Update existing product details and pricing
   */
  async updateProduct(id, data) {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Add stock with audit reason
   */
  async addStock(id, { quantity, reason }) {
    const response = await api.patch(`/products/${id}/add-stock`, { quantity, reason });
    return response.data;
  },

  /**
   * Remove/deduct stock with audit reason
   */
  async removeStock(id, { quantity, reason }) {
    const response = await api.patch(`/products/${id}/remove-stock`, { quantity, reason });
    return response.data;
  },

  /**
   * Get stock movement audit history for a product
   */
  async getInventoryHistory(id) {
    const response = await api.get(`/products/${id}/inventory-history`);
    return response.data;
  },
};

export default productService;
