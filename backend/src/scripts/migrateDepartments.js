const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Bắt đầu Migrate dữ liệu Phòng ban...');

    // 1. Lấy tất cả người dùng có thông tin phòng ban (dạng String)
    const users = await prisma.user.findMany({
        where: {
            department: { not: null, not: '' }
        },
        select: { id: true, department: true }
    });

    if (users.length === 0) {
        console.log('ℹ️ Không có dữ liệu phòng ban nào cần migrate.');
        return;
    }

    // 2. Lấy danh sách các tên phòng ban duy nhất
    const uniqueDepartmentNames = [...new Set(users.map(u => u.department.trim()))];
    console.log(`📂 Tìm thấy ${uniqueDepartmentNames.length} phòng ban duy nhất:`, uniqueDepartmentNames);

    // 3. Tạo các phòng ban trong bảng mới (nếu chưa tồn tại)
    const departmentMap = {}; // Để lưu { "Tên": ID }
    for (const name of uniqueDepartmentNames) {
        const dept = await prisma.department.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        departmentMap[name] = dept.id;
    }

    // 4. Cập nhật department_id cho từng người dùng
    let updatedCount = 0;
    for (const user of users) {
        const deptId = departmentMap[user.department.trim()];
        if (deptId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { department_id: deptId }
            });
            updatedCount++;
        }
    }

    console.log(`✅ Hoàn tất! Đã cập nhật ${updatedCount} người dùng.`);
}

main()
    .catch(e => {
        console.error('❌ Lỗi khi migrate:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
