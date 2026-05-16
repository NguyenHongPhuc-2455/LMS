const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 1; // Giả sử update cho admin
  const posId = 2; // Vị trí 'Nhân viên'
  
  console.log(`Updating user ${userId} to position ${posId}...`);
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      position_id: posId
    },
    include: { position: true }
  });
  
  console.log('Updated User:', {
    id: user.id,
    username: user.username,
    position_id: user.position_id,
    position_name: user.position?.name
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
