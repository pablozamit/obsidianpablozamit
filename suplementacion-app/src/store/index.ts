import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  loading: boolean;
  setUsuario: (usuario: Usuario | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      loading: true,
      setUsuario: (usuario) => set({ usuario, loading: false }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ usuario: null, loading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
