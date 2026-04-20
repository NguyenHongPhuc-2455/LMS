const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // Lưu trữ mapping giữa userId và socketId

/**
 * Khởi tạo Socket.io
 */
exports.init = (server) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Một client đã kết nối: ${socket.id}`);

        // Đăng ký user khi connect
        socket.on('register', (userId) => {
            if (userId) {
                userSockets.set(userId.toString(), socket.id);
                console.log(`👤 User ${userId} đã đăng ký socket ${socket.id}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client ngắt kết nối: ${socket.id}`);
            // Dọn dẹp map khi user ngắt kết nối
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    break;
                }
            }
        });
    });

    return io;
};

exports.emitToUser = (userId, event, data) => {
    if (!io) return;
    const socketId = userSockets.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit(event, data);
        console.log(`📢 Đã gửi event '${event}' tới user ${userId}`);
    } else {
        console.log(`⚠️ Không tìm thấy socketId cho user ${userId}`);
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
                console.log(`📢 Đã gửi event '${event}' tới Admin ${admin.id}`);
            }
        });
    } catch (error) {
        console.error('❌ Lỗi khi gửi broadcast tới Admins:', error);
    }
};

exports.getIO = () => {
    if (!io) {
        throw new Error('Socket.io chưa được khởi tạo!');
    }
    return io;
};
