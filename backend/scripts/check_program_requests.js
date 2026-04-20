const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const requests = await prisma.programRequest.findMany({
        include: {
            user: { select: { username: true } },
            program: { select: { title: true } }
        }
    });
    console.log(JSON.stringify(requests, null, 2));
    await prisma.$disconnect();
}
check();
