const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const programs = await prisma.learningProgram.findMany();
    console.log(JSON.stringify(programs, null, 2));
    await prisma.$disconnect();
}
check();
