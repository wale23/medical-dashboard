import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger si on est déjà sur la page de login
    // ou si l'erreur vient d'une tentative de connexion
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isOnLoginPage = window.location.pathname === '/login';
    
    if (error.response?.status === 401 && !isLoginRequest && !isOnLoginPage) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;


