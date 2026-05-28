import { io, Socket } from 'socket.io-client';

// Ứu tiên VITE_SOCKET_URL nếu có, sau đó tự động suy ra từ VITE_API_URL (bằng cách xóa '/api')
const getSocketUrl = () => {
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
    return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const socketService = {
    connect: (userId: number) => {
        if (socket) return socket;

        socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            // Đăng ký user với server
            if (socket) {
                socket.emit('register', userId);
            }
        });

        socket.on('disconnect', () => {
            // No action needed
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    getSocket: () => socket
};
