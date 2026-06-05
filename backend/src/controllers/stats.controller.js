const statsService = require('../services/stats.service');
const prisma = require('../configs/prisma');

const getManagerDepartmentId = async (req) => {
    const userRoles = req.user?.roles || [];
    const roleNames = userRoles.map((r) => (typeof r === 'string' ? r : r.name).toLowerCase());
    const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');
    
    if (!isManagerOnly) return { isManagerOnly: false, departmentId: null };

    // Lấy department_id mới nhất từ DB
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { department_id: true }
    });
    return { isManagerOnly: true, departmentId: user?.department_id || null };
};

const getDashboardStats = async (req, res) => {
    try {
        const { departmentId } = await getManagerDepartmentId(req);
        const stats = await statsService.getDashboardStats(departmentId);
        res.json(stats);
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getPendingRequestsCount = async (req, res) => {
    try {
        const { departmentId } = await getManagerDepartmentId(req);
        const count = await statsService.getPendingRequestsCount(departmentId);
        res.json({ pendingCount: count });
    } catch (error) {
        console.error('Error in getPendingRequestsCount:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { isManagerOnly, departmentId: managerDeptId } = await getManagerDepartmentId(req);
        const departmentId = isManagerOnly ? managerDeptId : (req.query.departmentId ? parseInt(req.query.departmentId) : null);
        const progress = await statsService.getStudentsProgressByCourse(courseId, departmentId);
        res.json(progress);
    } catch (error) {
        console.error('Error in getCourseProgress:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const trackLearningTime = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId, lessonId, duration } = req.body;

        if (!duration) {
            return res.status(400).json({ error: 'Duration is required' });
        }

        const session = await statsService.trackLearningTime(userId, courseId, lessonId, duration);
        res.json(session);
    } catch (error) {
        console.error('Error in trackLearningTime controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getMyLearningStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days } = req.query;
        const stats = await statsService.getUserLearningStats(userId, days ? parseInt(days) : 7);
        res.json(stats);
    } catch (error) {
        console.error('Error in getMyLearningStats controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getMyLearningSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const summary = await statsService.getUserLearningSummary(userId);
        res.json(summary);
    } catch (error) {
        console.error('Error in getMyLearningSummary controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getGlobalLearningTrends = async (req, res) => {
    try {
        const { days } = req.query;
        const trends = await statsService.getGlobalLearningTrends(days ? parseInt(days) : 7);
        res.json(trends);
    } catch (error) {
        console.error('Error in getGlobalLearningTrends controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getTopLearners = async (req, res) => {
    try {
        const top = await statsService.getTopLearners();
        res.json(top);
    } catch (error) {
        console.error('Error in getTopLearners controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const searchProgress = async (req, res) => {
    try {
        const { q, courseId, departmentId: queryDeptId } = req.query;
        const { isManagerOnly, departmentId: managerDeptId } = await getManagerDepartmentId(req);
        const departmentId = isManagerOnly ? managerDeptId : (queryDeptId ? parseInt(queryDeptId) : null);
        const progress = await statsService.searchStudentsProgress(q, courseId, departmentId);
        res.json(progress);
    } catch (error) {
        console.error('Error in searchProgress controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getLearningReportData = async (req, res) => {
    try {
        const { groupBy, period, startDate, endDate, courseId } = req.query;
        const { isManagerOnly, departmentId: managerDeptId } = await getManagerDepartmentId(req);
        
        const departmentId = isManagerOnly ? managerDeptId : (req.query.departmentId || null);

        const report = await statsService.getLearningReportData({
            groupBy,
            period,
            startDate,
            endDate,
            departmentId,
            courseId: courseId ? parseInt(courseId) : null
        });
        
        res.json(report);
    } catch (error) {
        console.error('Error in getLearningReportData controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getDashboardStats,
    getPendingRequestsCount,
    getCourseProgress,
    searchProgress,
    trackLearningTime,
    getMyLearningStats,
    getMyLearningSummary,
    getGlobalLearningTrends,
    getTopLearners,
    getLearningReportData
};
