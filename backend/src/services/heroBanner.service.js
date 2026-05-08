const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllActiveBanners = async () => {
    return await prisma.heroBanner.findMany({
        where: { is_active: true },
        orderBy: { order: 'asc' }
    });
};

const getAllBanners = async () => {
    return await prisma.heroBanner.findMany({
        orderBy: { order: 'asc' }
    });
};

const createBanner = async (data) => {
    return await prisma.heroBanner.create({
        data
    });
};

const updateBanner = async (id, data) => {
    return await prisma.heroBanner.update({
        where: { id: parseInt(id) },
        data
    });
};

const deleteBanner = async (id) => {
    return await prisma.heroBanner.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    getAllActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
};
