import axios from 'axios';

const localApiUrl = 'http://localhost:5000/api';
const deployedApiUrl = 'https://attendance-clg-backend.vercel.app/api';
const apiBaseUrl = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? localApiUrl : deployedApiUrl);

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
