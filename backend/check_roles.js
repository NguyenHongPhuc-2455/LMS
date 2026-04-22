const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.role.findMany();
    console.log('Roles:', roles);

    const admins = await prisma.user.findMany({
        where: {
            user_roles: {
                some: {
                    role: {
                        name: 'admin'
                    }
                }
            }
        }
    });
    console.log('Admins found for broadcast:', admins.map(u => u.id));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
