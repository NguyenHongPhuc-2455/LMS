const programInclude = {
    instructor: { select: { id: true, username: true, full_name: true, avatar: true } },
    courses: {
        where: {
            course: { deleted_at: null }
        },
        orderBy: { order: 'asc' },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    thumbnail: true,
                    level: true,
                    description: true,
                    instructor: { select: { id: true, full_name: true } },
                    _count: { select: { sections: true, enrollments: true } }
                }
            }
        }
    },
    _count: { select: { enrollments: true, courses: true } }
};

const withoutCountInclude = () => {
    const { _count, ...include } = programInclude;
    return include;
};

const normalizeProgramCourseCount = (program) => ({
    ...program,
    _count: {
        ...program._count,
        courses: program.courses.length
    }
});

module.exports = {
    programInclude,
    withoutCountInclude,
    normalizeProgramCourseCount
};
