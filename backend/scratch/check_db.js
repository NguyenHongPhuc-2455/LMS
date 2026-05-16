const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const positions = await prisma.position.findMany();
  console.log('Positions:', positions);
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, username: true, position_id: true }
  });
  console.log('Sample Users:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
