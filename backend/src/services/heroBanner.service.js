const prisma = require('../configs/prisma');

exports.getAllActiveBanners = async () => {
    return await prisma.heroBanner.findMany({
        where: { is_active: true },
        orderBy: { order: 'asc' }
    });
};

exports.getAllBanners = async () => {
    return await prisma.heroBanner.findMany({
        orderBy: { order: 'asc' }
    });
};

exports.createBanner = async (data) => {
    return await prisma.heroBanner.create({
        data
    });
};

exports.updateBanner = async (id, data) => {
    return await prisma.heroBanner.update({
        where: { id: parseInt(id) },
        data
    });
};

exports.deleteBanner = async (id) => {
    return await prisma.heroBanner.delete({
        where: { id: parseInt(id) }
    });
};

