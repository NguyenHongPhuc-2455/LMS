const heroBannerService = require('../services/heroBanner.service');

const getBanners = async (req, res) => {
    try {
        const banners = await heroBannerService.getAllActiveBanners();
        res.json(banners);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createBanner = async (req, res) => {
    try {
        const banner = await heroBannerService.createBanner(req.body);
        res.status(201).json(banner);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await heroBannerService.updateBanner(id, req.body);
        res.json(banner);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await heroBannerService.deleteBanner(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner
};
