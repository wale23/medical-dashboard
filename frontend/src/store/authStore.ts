import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  specialite: string;
  userRole: string;
}

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  patient: Patient | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  loginPatient: (patient: Patient, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      patient: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, patient: null, token, isAuthenticated: true });
      },
      loginPatient: (patient, token) => {
        set({ patient, user: null, token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, patient: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

