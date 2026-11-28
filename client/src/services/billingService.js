import api from './api';

export const billingService = {
  /**
   * Create a new Bill (Billing Operator or POS terminal)
   */
  async createBill(data) {
    const response = await api.post('/bills', data);
    return response.data;
  },

  /**
   * Get all store bills for Owner (with pagination & filters)
   */
  async getOwnerBills(params = {}) {
    const response = await api.get('/bills', { params });
    return response.data;
  },

  /**
   * Get bills created by current Billing Operator
   */
  async getBillingBills(params = {}) {
    const response = await api.get('/bills/billing', { params });
    return response.data;
  },

  /**
   * Get single bill detail for Owner
   */
  async getOwnerBillById(id) {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },

  /**
   * Get single bill detail for Billing Operator
   */
  async getBillingBillById(id) {
    const response = await api.get(`/bills/billing/${id}`);
    return response.data;
  },

  /**
   * Refund a bill (Owner only) and restock inventory
   */
  async refundBill(id) {
    const response = await api.patch(`/bills/${id}/refund`);
    return response.data;
  },

  /**
   * Download standard A4 PDF invoice (Owner)
   */
  async downloadOwnerBillPDF(id) {
    const response = await api.get(`/bills/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Download standard A4 PDF invoice (Billing Operator)
   */
  async downloadBillingBillPDF(id) {
    const response = await api.get(`/bills/billing/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Download 80mm Thermal Receipt PDF (Owner)
   */
  async downloadOwnerThermalPDF(id) {
    const response = await api.get(`/bills/${id}/thermal`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Download 80mm Thermal Receipt PDF (Billing Operator)
   */
  async downloadBillingThermalPDF(id) {
    const response = await api.get(`/bills/billing/${id}/thermal`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get aggregated invoice overview, payment breakdown, and counter summary (Owner)
   */
  async getOwnerLedgerSummary(params = {}) {
    const response = await api.get('/bills/ledger-summary', { params });
    return response.data;
  },

  /**
   * Get aggregated invoice overview (Billing Operator)
   */
  async getBillingLedgerSummary(params = {}) {
    const response = await api.get('/bills/billing/ledger-summary', { params });
    return response.data;
  },
};

export default billingService;
