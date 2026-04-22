const prisma = require('./src/configs/prisma');

async function main() {
    const lesson = await prisma.lesson.findUnique({
        where: { id: 7 },
        include: { section: true }
    });
    console.log(JSON.stringify(lesson, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
