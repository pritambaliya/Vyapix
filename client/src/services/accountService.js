import api from './api';

export const accountService = {
  /**
   * Get all sub-billing accounts for the owner's store
   */
  async getBillingAccounts() {
    const response = await api.get('/billing-accounts');
    return response.data;
  },

  /**
   * Create a new sub-billing account
   */
  async createBillingAccount(data) {
    const response = await api.post('/billing-accounts/register', data);
    return response.data;
  },

  /**
   * Update sub-account active/disabled status
   */
  async updateStatus(id, status) {
    const response = await api.patch(`/billing-accounts/${id}/status`, { status });
    return response.data;
  },

  /**
   * Reset sub-account password (requires owner confirmation)
   */
  async resetPassword(id, { ownerPassword, newPassword, confirmPassword }) {
    const response = await api.patch(`/billing-accounts/${id}/reset-password`, {
      ownerPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Get activity logs for a specific sub-billing account
   */
  async getAccountActivity(id) {
    const response = await api.get(`/billing-accounts/${id}/activity`);
    return response.data;
  },

  /**
   * Get all shop billing activity audit logs
   */
  async getAllActivities() {
    const response = await api.get('/billing-accounts/activities');
    return response.data;
  },
};

export default accountService;
