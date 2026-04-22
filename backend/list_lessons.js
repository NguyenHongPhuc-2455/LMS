const prisma = require('./src/configs/prisma');
async function main() {
    const lessons = await prisma.lesson.findMany();
    console.log(JSON.stringify(lessons, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
