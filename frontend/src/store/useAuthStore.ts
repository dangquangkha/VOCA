import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            login: (token, user) => set({ token, user }),
            logout: () => {
                localStorage.removeItem('token'); // Clear legacy local storage if any
                set({ token: null, user: null });
            },
            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
        }
    )
);
