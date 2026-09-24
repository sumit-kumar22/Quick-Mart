import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quickmart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (typeof res.data === 'string' && res.data.trim().startsWith('<!doctype')) {
      const err = new Error('API endpoint returned HTML (backend not connected)');
      err.code = 'ENDPOINT_NOT_FOUND';
      err.status = 404;
      return Promise.reject(err);
    }
    return res;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const code = error.response?.data?.code || 'SERVER_ERROR';
    const err = new Error(message);
    err.code = code;
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export default api;