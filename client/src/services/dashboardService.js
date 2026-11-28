import api from './api';

const dashboardService = {
  async getOverview(params = {}) {
    const response = await api.get('/dashboard/overview', { params });
    return response.data;
  },
};

export default dashboardService;
