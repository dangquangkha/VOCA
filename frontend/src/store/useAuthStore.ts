import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
    token: string | null;       // Access token — memory only, never persisted
    user: User | null;          // User profile — persisted for UI restore
    _hasHydrated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    setToken: (token: string | null) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            _hasHydrated: false,
            login: (token, user) => set({ token, user }),
            logout: () => set({ token: null, user: null }),
            updateUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'auth-storage',
            // ⚠️ Chỉ persist user profile, KHÔNG persist token (bảo mật XSS)
            partialize: (state) => ({ user: state.user }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
