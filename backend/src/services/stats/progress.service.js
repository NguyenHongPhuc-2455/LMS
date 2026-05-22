const prisma = require('../../configs/prisma');

const getStudentsProgressByCourse = async (courseId, departmentId = null) => {
    try {
        const id = parseInt(courseId);

        // 1. Get all lessons in this course to calculate total
        const lessons = await prisma.lesson.findMany({
            where: {
                section: {
                    course_id: id
                }
            },
            select: { id: true }
        });

        const lessonIds = lessons.map(l => l.id);
        const totalLessons = lessonIds.length;

        // 2. Get students enrolled in this course (optionally filtered by department)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                course_id: id,
                ...(departmentId && {
                    user: { department_id: parseInt(departmentId) }
                })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });

        const userIds = enrollments.map(e => e.user_id);

        // 3. Tối ưu: Lấy số lượng bài học đã hoàn thành của tất cả học viên trong 1 câu truy vấn
        const completionCounts = await prisma.lessonCompleted.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: userIds },
                lesson_id: { in: lessonIds }
            },
            _count: {
                lesson_id: true
            }
        });

        const completionMap = {};
        completionCounts.forEach(c => {
            completionMap[c.user_id] = c._count.lesson_id;
        });

        // 4. Tổng hợp dữ liệu
        const progressData = enrollments.map((e) => {
            const completedCount = completionMap[e.user_id] || 0;
            const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

            return {
                id: e.user.id,
                fullName: e.user.full_name || e.user.username,
                email: e.user.email,
                avatar: e.user.avatar,
                completedLessons: completedCount,
                totalLessons: totalLessons,
                progressPercent: progressPercent,
                enrolledAt: e.enrolled_at
            };
        });


        return progressData;
    } catch (error) {
        console.error('Error in getStudentsProgressByCourse:', error);
        throw error;
    }
};

const searchStudentsProgress = async (searchTerm, courseId = null, departmentId = null) => {
    try {
        const whereClause = {
            course: {
                deleted_at: null
            },
            ...(courseId && { course_id: parseInt(courseId) }),
            ...(departmentId && {
                user: {
                    department_id: parseInt(departmentId),
                    ...(searchTerm && {
                        OR: [
                            { full_name: { contains: searchTerm, mode: 'insensitive' } },
                            { email: { contains: searchTerm, mode: 'insensitive' } },
                            { username: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    })
                }
            }),
            ...(!departmentId && searchTerm && {
                user: {
                    OR: [
                        { full_name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                        { username: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                }
            })
        };

        const enrollments = await prisma.enrollment.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        username: true,
                        avatar: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        category_id: true,
                        category: { select: { name: true } },
                        sections: {
                            select: {
                                lessons: { select: { id: true } }
                            }
                        }
                    }
                }
            }
        });

        // Lấy tất cả userIds và lessonIds cần kiểm tra để tối ưu hóa
        const userIds = enrollments.map(e => e.user_id);
        const allLessonIdsInvolved = [...new Set(enrollments.flatMap(e => e.course.sections.flatMap(s => s.lessons.map(l => l.id))))];

        // Lấy dữ liệu hoàn thành bài học trong 1 câu truy vấn
        const completionCounts = await prisma.lessonCompleted.groupBy({
            by: ['user_id', 'lesson_id'],
            where: {
                user_id: { in: userIds },
                lesson_id: { in: allLessonIdsInvolved }
            }
        });

        // Xây dựng map để truy xuất nhanh: completionMap[userId][lessonId] = true
        const completionMap = {};
        completionCounts.forEach(c => {
            if (!completionMap[c.user_id]) completionMap[c.user_id] = new Set();
            completionMap[c.user_id].add(c.lesson_id);
        });

        const progressData = enrollments.map((e) => {
            const lessonIds = e.course.sections.flatMap(s => s.lessons.map(l => l.id));
            const totalLessons = lessonIds.length;

            const completedCount = lessonIds.filter(id => completionMap[e.user_id]?.has(id)).length;
            const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

            return {
                id: e.user.id,
                fullName: e.user.full_name || e.user.username,
                email: e.user.email,
                avatar: e.user.avatar,
                completedLessons: completedCount,
                totalLessons: totalLessons,
                progressPercent: progressPercent,
                enrolledAt: e.enrolled_at,
                courseId: e.course.id,
                courseTitle: e.course.title,
                categoryId: e.course.category_id,
                categoryName: e.course.category?.name
            };
        });


        return progressData;
    } catch (error) {
        console.error('Error in searchStudentsProgress:', error);
        throw error;
    }
};

module.exports = {
    getStudentsProgressByCourse,
    searchStudentsProgress
};
