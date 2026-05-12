const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const lessons = await prisma.lesson.findMany({
        where: { title: 'TN2' },
        include: { quiz: { include: { questions: { include: { options: true } } } } }
    });
    console.log(JSON.stringify(lessons, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
