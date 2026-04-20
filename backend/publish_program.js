const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    await prisma.learningProgram.update({
        where: { id: 1 },
        data: { status: 'PUBLISHED' }
    });
    console.log('Updated program 1 to PUBLISHED');
    await prisma.$disconnect();
}
check();
