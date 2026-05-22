const prisma = require('../../configs/prisma');

const enrichProgramCoursesWithProgress = async ({ program, user }) => {
    const userId = user?.id;
    if (!userId) return program;

    const sortedCourses = program.courses.sort((a, b) => a.order - b.order);
    const courseIds = sortedCourses.map((programCourse) => programCourse.course.id);

    const allLessons = await prisma.lesson.findMany({
        where: { section: { course_id: { in: courseIds } } },
        select: { id: true, section: { select: { course_id: true } } }
    });

    const allCompleted = await prisma.lessonCompleted.findMany({
        where: { user_id: userId, lesson_id: { in: allLessons.map((lesson) => lesson.id) } },
        select: { lesson_id: true }
    });

    const completedIds = new Set(allCompleted.map((completion) => completion.lesson_id));
    const courseLessonMap = {};
    allLessons.forEach((lesson) => {
        const courseId = lesson.section.course_id;
        if (!courseLessonMap[courseId]) courseLessonMap[courseId] = [];
        courseLessonMap[courseId].push(lesson.id);
    });

    let previousCourseFinished = true;
    const isAdmin = user?.roles?.includes('admin');
    const isInstructor = program.instructor_id === userId;

    return {
        ...program,
        courses: sortedCourses.map((programCourse) => {
            const courseId = programCourse.course.id;
            const lessonIds = courseLessonMap[courseId] || [];
            const total = lessonIds.length;
            const completed = lessonIds.filter((id) => completedIds.has(id)).length;
            const isFinished = total === 0 || completed === total;
            const isLocked = (isAdmin || isInstructor) ? false : !previousCourseFinished;

            previousCourseFinished = isFinished;

            return {
                ...programCourse,
                isLocked,
                isFinished,
                progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100)
            };
        })
    };
};

const buildCourseStatsMap = (lessons, completedIds) => {
    const courseStatsMap = {};

    lessons.forEach((lesson) => {
        const courseId = lesson.section.course_id;
        if (!courseStatsMap[courseId]) courseStatsMap[courseId] = { total: 0, completed: 0 };
        courseStatsMap[courseId].total += 1;
        if (completedIds.has(lesson.id)) courseStatsMap[courseId].completed += 1;
    });

    return courseStatsMap;
};

module.exports = {
    enrichProgramCoursesWithProgress,
    buildCourseStatsMap
};
