import axios from 'axios';

export const getBackendUrl = (): string => {
    const isNgrok = window.location.hostname.includes('ngrok');
    if (isNgrok) {
        const savedSettings = localStorage.getItem('system_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.ngrok_be_url) {
                    return settings.ngrok_be_url.replace(/\/$/, '');
                }
            } catch (e) {}
        }
        return window.location.origin.replace(/\/$/, '');
    }
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (envUrl.startsWith('http')) {
        return envUrl.replace('/api', '').replace(/\/$/, '');
    }
    return 'http://localhost:5000';
};

const getInitialBaseURL = () => {
    const isNgrok = window.location.hostname.includes('ngrok');
    if (isNgrok) {
        const savedSettings = localStorage.getItem('system_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.ngrok_be_url) {
                    return settings.ngrok_be_url.replace(/\/$/, '') + '/api/';
                }
            } catch (e) {}
        }
        return window.location.origin.replace(/\/$/, '') + '/api/';
    }
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return envUrl.replace(/\/$/, '') + '/';
};

const api = axios.create({
    baseURL: getInitialBaseURL(),
});

// Flag để tránh gọi refresh nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    
    // Bỏ qua trang cảnh báo của ngrok để tránh lỗi CORS khi truy cập API
    if (config.headers) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                // Không có RT thì logout
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(
                    `${api.defaults.baseURL}auth/refresh`, 
                    { refreshToken },
                    { headers: { 'ngrok-skip-browser-warning': 'true' } }
                );
                const { accessToken } = response.data;

                localStorage.setItem('accessToken', accessToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                processQueue(null, accessToken);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
