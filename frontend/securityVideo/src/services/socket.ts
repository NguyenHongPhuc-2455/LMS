import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const socketService = {
    connect: (userId: number) => {
        if (socket) return socket;

        socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('🔌 Đã kết nối tới Socket server');
            // Đăng ký user với server
            if (socket) {
                socket.emit('register', userId);
            }
        });

        socket.on('disconnect', () => {
            console.log('🔌 Đã ngắt kết nối Socket');
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
