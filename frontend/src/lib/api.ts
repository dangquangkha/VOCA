import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const getBaseURL = () => {
    // We prefer the environment variable, but fallback to 127.0.0.1 for local dev
    // We use a trailing slash to ensure consistent path joining
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    const base = envBase || 'http://127.0.0.1:8001/api/v1';
    return base.endsWith('/') ? base : `${base}/`;
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'UNKNOWN';
        
        // Log error for debugging (using warn instead of error to prevent Next.js Dev Error Overlay popup for handled API validation errors like 400 or 422)
        console.warn(`[API ERROR] ${method} ${url}:`, error.response?.status, error.message);

        // ONLY logout on 401 if we are not already on the login page
        // and if it's NOT the /me call failing immediately after login
        if (error.response?.status === 401) {
            const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
            if (!isLoginPage) {
                console.warn('[API] Unauthorized access - Logging out');
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
