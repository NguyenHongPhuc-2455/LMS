const prisma = require('../configs/prisma');

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

exports.getMyCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const enrollments = await prisma.enrollment.findMany({
            where: { user_id: userId },
            include: { course: true }
        });
        res.json(enrollments.map(e => e.course));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
