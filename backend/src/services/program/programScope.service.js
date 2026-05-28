const prisma = require('../../configs/prisma');
const { isUserInScope } = require('../../utils/scope');

const isPrivilegedProgramUser = (user) => {
    return user?.roles?.includes('admin') || user?.roles?.includes('instructor');
};

const getDepartmentMap = async () => {
    const departments = await prisma.department.findMany({ select: { id: true, parent_id: true } });
    return new Map(departments.map((department) => [department.id, department.parent_id]));
};

const getUserScopeData = async (userId) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, department_id: true, position_id: true, join_date: true }
    });
};

const filterProgramsForUserScope = async (programs, user) => {
    if (!user || isPrivilegedProgramUser(user)) return programs;

    const userData = await getUserScopeData(user.id);
    if (!userData) return programs;

    const [enrolledPrograms, departmentMap] = await Promise.all([
        prisma.programEnrollment.findMany({
            where: { user_id: user.id },
            select: { program_id: true }
        }),
        getDepartmentMap()
    ]);

    const enrolledProgramIds = new Set(enrolledPrograms.map((enrollment) => enrollment.program_id));

    return programs.filter((program) => {
        const isEnrolled = enrolledProgramIds.has(program.id);
        return isUserInScope(userData, program, isEnrolled, departmentMap);
    });
};

const assertProgramVisibleToUser = async ({ program, user, isEnrolled, ApiError }) => {
    const userId = user?.id;
    if (!userId) return;

    const isAdmin = isPrivilegedProgramUser(user);
    const isOwner = program.instructor_id === userId;
    if (isAdmin || isOwner) return;

    const [userData, departmentMap] = await Promise.all([
        getUserScopeData(userId),
        getDepartmentMap()
    ]);

    if (!userData) return;

    const inScope = isUserInScope(userData, program, isEnrolled, departmentMap);
    if (!inScope) {
        throw new ApiError(403, 'Báº¡n khÃ´ng thuá»™c Ä‘á»‘i tÆ°á»£ng Ä‘Æ°á»£c phÃ¢n phá»‘i lá»™ trÃ¬nh há»c nÃ y.');
    }
};

module.exports = {
    filterProgramsForUserScope,
    assertProgramVisibleToUser,
    getDepartmentMap
};
