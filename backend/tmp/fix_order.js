const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Updating sections order ---');
    const sections = await prisma.section.findMany();

    for (const s of sections) {
        let order = s.order;
        if (s.title.includes('Chương 1')) order = 1;
        else if (s.title.includes('Chương 2')) order = 2;
        else if (s.title.includes('Chương 3')) order = 3;
        else if (s.title.includes('Chương 4')) order = 4;
        else if (s.title.includes('Chương 5')) order = 5;

        await prisma.section.update({
            where: { id: s.id },
            data: { order }
        });
        console.log(`Updated ${s.title} to order ${order}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
