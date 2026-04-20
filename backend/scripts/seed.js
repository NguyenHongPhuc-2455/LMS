const prisma = require('./src/configs/prisma');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

async function main() {
    console.log('--- BẮT ĐẦU SEED DỮ LIỆU MỚI ---');

    // 1. Tạo các Vai trò (Roles)
    const rolesData = [
        { name: 'admin', description: 'Quản trị viên hệ thống' },
        { name: 'instructor', description: 'Giảng viên' },
        { name: 'student', description: 'Học viên' }
    ];

    for (const role of rolesData) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role
        });
    }
    console.log('✅ Khởi tạo Roles xong.');

    // 2. Tạo Danh mục (Categories)
    const categories = ['Lập trình', 'Marketing', 'Thiết kế', 'Ngoại ngữ'];
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat },
            update: {},
            create: { name: cat, description: `Khóa học về ${cat}` }
        });
    }
    console.log('✅ Khởi tạo Categories xong.');

    // 3. Tạo tài khoản Admin mặc định
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@system.com',
            password_hash: hashPassword('123456'),
            full_name: 'Hệ thống Quản trị',
        }
    });

    // Gán quyền Admin cho user admin (M-N)
    await prisma.userRole.upsert({
        where: {
            user_id_role_id: {
                user_id: adminUser.id,
                role_id: adminRole.id
            }
        },
        update: {},
        create: {
            user_id: adminUser.id,
            role_id: adminRole.id
        }
    });

    console.log('✅ Khởi tạo tài khoản Admin tối cao thành công! (admin/123456)');
    console.log('--- SEED HOÀN TẤT ---');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi Seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
