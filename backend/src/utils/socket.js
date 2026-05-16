const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // Lưu trữ mapping giữa userId và Set các socketId (hỗ trợ mở nhiều tab)

/**
 * Khởi tạo Socket.io
 */
exports.init = (server) => {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost'
    ];
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`Một client đã kết nối: ${socket.id}`);

        // Đăng ký user khi connect
        socket.on('register', (userId) => {
            if (userId) {
                const uid = userId.toString();
                if (!userSockets.has(uid)) {
                    userSockets.set(uid, new Set());
                }
                userSockets.get(uid).add(socket.id);
                console.log(`User ${userId} đã đăng ký socket ${socket.id} (Tổng số tab: ${userSockets.get(uid).size})`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client ngắt kết nối: ${socket.id}`);
            // Dọn dẹp map khi user ngắt kết nối
            for (const [userId, sockets] of userSockets.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSockets.delete(userId);
                    }
                    break;
                }
            }
        });
    });

    return io;
};

exports.emitToUser = (userId, event, data) => {
    if (!io) return;
    const sockets = userSockets.get(userId.toString());
    if (sockets && sockets.size > 0) {
        sockets.forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
        console.log(`Đã gửi event '${event}' tới user ${userId} (gửi qua ${sockets.size} tab)`);
    } else {
        console.log(`Không tìm thấy socket đang active cho user ${userId}`);
    }
};


/**
 * Gửi dữ liệu cho tất cả các Admin đang online
 */
exports.emitToAdmins = async (event, data) => {
    if (!io) return;

    try {
        const prisma = require('../configs/prisma');
        // Tìm tất cả user có role 'admin'
        const admins = await prisma.user.findMany({
            where: {
                user_roles: {
                    some: {
                        role: {
                            name: 'admin'
                        }
                    }
                }
            },
            select: { id: true }
        });

        admins.forEach(admin => {
            const socketId = userSockets.get(admin.id.toString());
            if (socketId) {
                io.to(socketId).emit(event, data);
                console.log(`Đã gửi event '${event}' tới Admin ${admin.id}`);
            }
        });
    } catch (error) {
        console.error('Lỗi khi gửi broadcast tới Admins:', error);
    }
};

exports.getIO = () => {
    if (!io) {
        throw new Error('Socket.io chưa được khởi tạo!');
    }
    return io;
};
