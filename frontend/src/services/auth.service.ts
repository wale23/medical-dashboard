import api from './api';

export interface LoginCredentials {
  email: string;
  motDePasse: string;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  specialite: string;
  numeroOrdre: string;
  telephone: string;
  email: string;
  motDePasse: string;
  userRole?: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    specialite: string;
    userRole: string;
  };
}

export const authService = {

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  logout: () => {
    // La déconnexion est gérée par le store Zustand
    // Cette fonction peut être utilisée pour des appels API futurs si nécessaire
  },
};

