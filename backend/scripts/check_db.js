const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const courseCount = await prisma.course.count();
    const videoCount = await prisma.video.count();
    const videos = await prisma.video.findMany();

    console.log(`Courses: ${courseCount}`);
    console.log(`Videos: ${videoCount}`);
    console.log(JSON.stringify(videos, null, 2));
    await prisma.$disconnect();
}
check();
