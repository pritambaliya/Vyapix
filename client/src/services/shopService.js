import api from './api';

export const shopService = {
  /**
   * Get store profile & logo for the current authenticated owner
   */
  async getShop() {
    const response = await api.get('/shop');
    return response.data;
  },

  /**
   * Update store business information (shopName, phone, address, gstNumber)
   */
  async updateShop(data) {
    const response = await api.put('/shop', data);
    return response.data;
  },

  /**
   * Upload / update store logo image to Cloudinary via backend
   */
  async updateShopLogo(formData) {
    const response = await api.put('/shop/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete store logo
   */
  async deleteShopLogo() {
    const response = await api.delete('/shop/logo');
    return response.data;
  },
};

export default shopService;
