import axios from 'axios';

const API_BASE_URL = "http://localhost:5000" || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      message = error.response.data?.message || `Server error: ${error.response.statusText || error.response.status}`;
    } else if (error.request) {
      message = 'Unable to reach the Vyapix server. Please verify your backend connection.';
    } else {
      message = error.message || message;
    }

    const enhancedError = new Error(message);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;

    return Promise.reject(enhancedError);
  }
);

export default api;
