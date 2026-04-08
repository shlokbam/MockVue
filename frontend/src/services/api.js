import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockvue_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → clear auth and redirect
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Retry logic for network errors (common during cold starts)
    const config = err.config;
    if (!err.response && !config._retry) {
      config._retry = true;
      // Wait 1s before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(config);
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('mockvue_token');
      localStorage.removeItem('mockvue_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
