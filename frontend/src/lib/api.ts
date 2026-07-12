import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adplatform_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url || '';
      // Don't hijack the login/register responses themselves — their 401 is
      // "bad credentials" and the form should surface it inline. Also skip
      // when already on an auth page so we don't reload and wipe form state.
      const isAuthEndpoint = /\/auth\/(login|register)/.test(url);
      const onAuthPage = /^\/(login|register)/.test(window.location.pathname);
      if (!isAuthEndpoint && !onAuthPage) {
        localStorage.removeItem('adplatform_token');
        localStorage.removeItem('adplatform_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
