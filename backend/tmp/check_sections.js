const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sections = await prisma.section.findMany({
        orderBy: [
            { order: 'asc' },
            { title: 'asc' }
        ]
    });
    console.log(JSON.stringify(sections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
