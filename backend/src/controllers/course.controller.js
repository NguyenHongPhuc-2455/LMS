const prisma = require('../configs/prisma');

exports.getCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            where: { deleted_at: null },
            include: {
                category: true,
                instructor: { select: { id: true, username: true, full_name: true } },
                _count: { select: { sections: true } }
            }
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCourseDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const course = await prisma.course.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: true,
                instructor: { select: { id: true, username: true, full_name: true } },
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: { orderBy: { order: 'asc' } }
                    }
                }
            }
        });

        if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

        // Lấy danh sách các bài học đã hoàn thành của người dùng này
        let completedLessonIds = [];
        if (userId) {
            const completions = await prisma.lessonCompleted.findMany({
                where: { user_id: userId, lesson_id: { in: course.sections.flatMap(s => s.lessons.map(l => l.id)) } },
                select: { lesson_id: true }
            });
            completedLessonIds = completions.map(c => c.lesson_id);
        }

        // Kiểm tra quyền truy cập (Enrollment)
        let hasAccess = false;
        if (userId) {
            const enrollment = await prisma.enrollment.findUnique({
                where: { user_id_course_id: { user_id: userId, course_id: parseInt(id) } }
            });
            const isAdmin = req.user.roles?.includes('admin');
            const isInstructor = course.instructor_id === userId;

            if (enrollment || isAdmin || isInstructor) hasAccess = true;
        }

        // Nếu chưa mua, có thể ẩn link video của các bài học không miễn phí
        const safeCourse = {
            ...course,
            hasAccess,
            sections: course.sections.map(s => ({
                ...s,
                lessons: s.lessons.map(l => {
                    const isCompleted = completedLessonIds.includes(l.id);
                    if (!hasAccess && !l.is_free) {
                        return { ...l, video_url: null, content: 'Nội dung này đã bị khóa. Vui lòng mua khóa học.', isCompleted };
                    }
                    return { ...l, isCompleted };
                })
            }))
        };

        res.json(safeCourse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, description, category_id, price, level } = req.body;
        const instructor_id = req.user.id;

        const course = await prisma.course.create({
            data: {
                title,
                description,
                category_id: category_id ? parseInt(category_id) : null,
                instructor_id,
                price: parseFloat(price) || 0,
                level
            }
        });
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete
        await prisma.course.update({
            where: { id: parseInt(id) },
            data: { deleted_at: new Date() }
        });
        res.json({ message: 'Đã xóa khóa học thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSection = async (req, res) => {
    try {
        const { title, course_id, order } = req.body;
        const section = await prisma.section.create({
            data: {
                title,
                course_id: parseInt(course_id),
                order: parseInt(order) || 0
            }
        });
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSection = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.section.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Đã xóa chương thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
