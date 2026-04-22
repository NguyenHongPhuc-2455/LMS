const prisma = require('./src/configs/prisma');
async function main() {
    const lessons = await prisma.lesson.findMany();
    lessons.forEach(l => {
        console.log(`ID: ${l.id}, Title: "${l.title}", URL: ${l.video_url}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
