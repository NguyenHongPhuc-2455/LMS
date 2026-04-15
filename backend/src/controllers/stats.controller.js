const statsService = require('../services/stats.service');

const getDashboardStats = async (req, res) => {
    try {
        const stats = await statsService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getDashboardStats
};
