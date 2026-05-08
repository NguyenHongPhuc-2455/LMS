const statsService = require('../services/stats.service');

const getDashboardStats = async (req, res) => {
    try {
        const stats = await statsService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const progress = await statsService.getStudentsProgressByCourse(courseId);
        res.json(progress);
    } catch (error) {
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
        const { q, courseId } = req.query;
        const progress = await statsService.searchStudentsProgress(q, courseId);
        res.json(progress);
    } catch (error) {
        console.error('Error in searchProgress controller:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getDashboardStats,
    getCourseProgress,
    searchProgress,
    trackLearningTime,
    getMyLearningStats,
    getMyLearningSummary,
    getGlobalLearningTrends,
    getTopLearners
};
