const prisma = require('../configs/prisma');
const vnpay = require('../utils/vnpay');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.buyCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        if (!courseId) return res.status(400).json({ error: 'Thiếu Course ID' });

        // 1. Kiểm tra xem đã mua chưa
        const existing = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: parseInt(courseId) } }
        });
        if (existing) return res.status(400).json({ error: 'Bạn đã sở hữu khóa học này rồi' });

        const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
        if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

        // 2. Tạo Đơn hàng (Order) và Thanh toán (Payment) mô phỏng
        const order = await prisma.order.create({
            data: {
                user_id: userId,
                total_price: course.price,
                status: 'COMPLETED',
                items: {
                    create: {
                        course_id: course.id,
                        price: course.price
                    }
                },
                payments: {
                    create: {
                        method: 'MOMO_SIMULATION',
                        amount: course.price,
                        status: 'SUCCESS'
                    }
                }
            }
        });

        // 3. Cấp quyền truy cập (Enrollment)
        await prisma.enrollment.create({
            data: {
                user_id: userId,
                course_id: course.id
            }
        });

        res.json({ message: 'Thanh toán thành công! Chào mừng bạn đến với khóa học.', orderId: order.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createVnpayUrl = catchAsync(async (req, res) => {
    const { courseId, bankCode } = req.body;
    const userId = req.user.id;
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');

    // 1. Kiểm tra xem đã mua chưa
    const existing = await prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id: userId, course_id: parseInt(courseId) } }
    });
    if (existing) throw new ApiError(400, 'Bạn đã sở hữu khóa học này rồi');

    // 2. Tạo Order ở trạng thái PENDING
    const order = await prisma.order.create({
        data: {
            user_id: userId,
            total_price: course.price,
            status: 'PENDING',
            items: {
                create: {
                    course_id: course.id,
                    price: course.price
                }
            }
        }
    });

    // 3. Tạo URL thanh toán VNPay
    const payUrl = vnpay.createPaymentUrl({
        tmnCode: process.env.VNP_TMN_CODE || '26960000',
        hashSecret: process.env.VNP_HASH_SECRET || 'REYREHRPKRYTFXUOWNSZPUUXIYKQUJMB',
        vnpUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-result`,
        orderId: `ORDER_${order.id}_${Date.now()}`,
        amount: course.price,
        bankCode,
        orderInfo: `Thanh toan khoa hoc: ${course.title}`,
        ipAddr
    });

    res.json({ payUrl });
});

exports.vnpayReturn = catchAsync(async (req, res) => {
    const query = req.query;
    const hashSecret = process.env.VNP_HASH_SECRET || 'REYREHRPKRYTFXUOWNSZPUUXIYKQUJMB';

    const isValid = vnpay.verifyReturnUrl({ ...query }, hashSecret);
    if (!isValid) throw new ApiError(400, 'Chữ ký không hợp lệ');

    const responseCode = query['vnp_ResponseCode'];
    const txnRef = query['vnp_TxnRef']; // ORDER_123_timestamp
    const orderId = parseInt(txnRef.split('_')[1]);

    if (responseCode === '00') {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (order && order.status !== 'COMPLETED') {
            // Cập nhật trạng thái đơn hàng
            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'COMPLETED' }
            });

            // Ghi nhận lịch sử thanh toán
            await prisma.payment.create({
                data: {
                    order_id: orderId,
                    method: 'VNPAY',
                    amount: order.total_price,
                    status: 'SUCCESS',
                    transaction_id: query['vnp_TransactionNo']
                }
            });

            // Cấp quyền truy cập cho tất cả khóa học trong đơn hàng
            for (const item of order.items) {
                await prisma.enrollment.upsert({
                    where: { user_id_course_id: { user_id: order.user_id, course_id: item.course_id } },
                    update: {},
                    create: { user_id: order.user_id, course_id: item.course_id }
                });
            }
        }
        res.json({ message: 'Giao dịch thành công', status: 'success' });
    } else {
        res.json({ message: 'Giao dịch không thành công hoặc bị hủy', status: 'fail' });
    }
});

exports.getMyCourses = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const enrollments = await prisma.enrollment.findMany({
        where: { user_id: userId },
        include: { course: true }
    });
    res.json(enrollments.map(e => e.course));
});
