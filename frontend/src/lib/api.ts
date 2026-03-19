import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const getBaseURL = () => {
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    console.log(`DEBUG: process.env.NEXT_PUBLIC_API_URL is: "${envBase}"`);
    const base = envBase || 'http://127.0.0.1:8000/api/v1';
    const finalBase = base.endsWith('/') ? base : `${base}/`;
    console.log(`DEBUG: Final Axios baseURL is: "${finalBase}"`);
    return finalBase;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    console.log(`AXIOS REQUEST: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (typeof window !== 'undefined') {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    console.error('AXIOS REQUEST ERROR:', error);
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                useAuthStore.getState().logout();
                // Redirect to login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
