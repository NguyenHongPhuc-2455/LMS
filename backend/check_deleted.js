const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        where: {
            username: { in: ['phucnguyen', 'phucnguyen2'] }
        },
        select: {
            id: true,
            username: true,
            deleted_at: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

checkUsers();
