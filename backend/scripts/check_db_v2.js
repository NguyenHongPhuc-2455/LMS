const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const courses = await prisma.course.findMany({ include: { videos: true } });
    const orphanVideos = await prisma.video.findMany({ where: { course_id: null } });

    console.log("=== COURSES ===");
    courses.forEach(c => {
        console.log(`Course: ${c.title} (ID: ${c.id})`);
        c.videos.forEach(v => console.log(`  - [Video ID: ${v.id}] ${v.title}`));
    });

    console.log("\n=== ORPHAN VIDEOS (No Course) ===");
    orphanVideos.forEach(v => console.log(`- [Video ID: ${v.id}] ${v.title}`));

    await prisma.$disconnect();
}
check();
