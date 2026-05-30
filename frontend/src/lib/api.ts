import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const getBaseURL = () => {
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    const base = envBase || 'http://127.0.0.1:8001/api/v1';
    return base.endsWith('/') ? base : `${base}/`;
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    withCredentials: true, // ← Required to send/receive httpOnly cookies (refresh token)
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

// Track if a refresh is already in-flight to avoid parallel refresh calls
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
    refreshQueue.forEach((cb) => cb(token));
    refreshQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            if (isRefreshing) {
                // Queue this request until refresh is done
                return new Promise((resolve) => {
                    refreshQueue.push((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // withCredentials sends the httpOnly refresh_token cookie
                const { data } = await axios.post(
                    `${getBaseURL()}auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const newToken = data.access_token;
                useAuthStore.getState().setToken(newToken);
                processQueue(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch {
                // Refresh failed — session truly expired
                useAuthStore.getState().logout();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'UNKNOWN';
        console.warn(`[API ERROR] ${method} ${url}:`, error.response?.status, error.message);
        return Promise.reject(error);
    }
);

export default api;
