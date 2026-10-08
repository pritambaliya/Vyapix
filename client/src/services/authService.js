import api from './api';

export const authService = {
  /**
   * Register a new Owner along with Shop details and optional Logo
   * Uses multipart/form-data
   */
  async registerOwner(formData) {
    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Log in as Store Owner with email and password
   */
  async loginOwner(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Get current authenticated Store Owner profile
   */
  async getOwnerProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Log in as Sub-Account / Billing Operator with billingCode and password
   */
  async loginBilling(billingCode, password) {
    const response = await api.post('/billing-accounts/login', { billingCode, password });
    return response.data;
  },

  /**
   * Get current authenticated Billing Operator profile
   */
  async getBillingProfile() {
    const response = await api.get('/billing-accounts/me');
    return response.data;
  },

  /**
   * Log out (clears both owner and billing cookies)
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default authService;
