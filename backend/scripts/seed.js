const prisma = require('../src/configs/prisma');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

async function main() {
    console.log('--- BẮT ĐẦU SEED DỮ LIỆU MỚI ---');

    // 1. Tạo các Vai trò (Roles)
    const rolesData = [
        { name: 'admin', description: 'Quản trị viên hệ thống' },
        { name: 'instructor', description: 'Giảng viên' },
        { name: 'student', description: 'Học viên' },
        { name: 'manager', description: 'Quản lý phòng ban' }
    ];

    const seededRoles = {};
    for (const role of rolesData) {
        seededRoles[role.name] = await prisma.role.upsert({
            where: { name: role.name },
            update: { description: role.description },
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

    // 3. Tạo các Phòng ban (Departments)
    const departmentsData = [
        { name: 'Công nghệ thông tin', description: 'Phòng ban kỹ thuật và CNTT' },
        { name: 'Nhân sự', description: 'Phòng ban tuyển dụng và đào tạo' },
        { name: 'Kinh doanh', description: 'Phòng ban kinh doanh và bán hàng' }
    ];

    const seededDepts = {};
    for (const dept of departmentsData) {
        const existingDept = await prisma.department.findFirst({
            where: {
                name: dept.name,
                parent_id: null
            }
        });
        if (existingDept) {
            seededDepts[dept.name] = await prisma.department.update({
                where: { id: existingDept.id },
                data: { description: dept.description }
            });
        } else {
            seededDepts[dept.name] = await prisma.department.create({
                data: dept
            });
        }
    }
    console.log('✅ Khởi tạo Departments xong.');

    // 4. Tạo các Chức vụ (Positions)
    const positionsData = [
        { name: 'Trưởng phòng', description: 'Quản lý trực tiếp phòng ban' },
        { name: 'Phó phòng', description: 'Phó quản lý phòng ban' },
        { name: 'Nhân viên', description: 'Nhân sự chính thức' },
        { name: 'Thực tập sinh', description: 'Học việc và thực tập' }
    ];

    const seededPositions = {};
    for (const pos of positionsData) {
        seededPositions[pos.name] = await prisma.position.upsert({
            where: { name: pos.name },
            update: { description: pos.description },
            create: pos
        });
    }
    console.log('✅ Khởi tạo Positions xong.');

    // 5. Tạo các tài khoản mặc định để kiểm thử

    // 5.1. Tài khoản Admin tối cao
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@system.com',
            password_hash: hashPassword('Admin@123'),
            full_name: 'Hệ thống Quản trị',
            join_date: new Date()
        }
    });
    await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: adminUser.id, role_id: seededRoles['admin'].id } },
        update: {},
        create: { user_id: adminUser.id, role_id: seededRoles['admin'].id }
    });

    // 5.2. Tài khoản Quản lý IT (manager1)
    const managerUser = await prisma.user.upsert({
        where: { username: 'manager1' },
        update: {
            department_id: seededDepts['Công nghệ thông tin'].id,
            position_id: seededPositions['Trưởng phòng'].id
        },
        create: {
            username: 'manager1',
            email: 'manager1@system.com',
            password_hash: hashPassword('Man@123'),
            full_name: 'Quản lý IT',
            employee_id: 'MGR001',
            department_id: seededDepts['Công nghệ thông tin'].id,
            position_id: seededPositions['Trưởng phòng'].id,
            join_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Vào làm 30 ngày trước
        }
    });
    await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: managerUser.id, role_id: seededRoles['manager'].id } },
        update: {},
        create: { user_id: managerUser.id, role_id: seededRoles['manager'].id }
    });

    // 5.3. Tài khoản Học viên kiểm thử 1 (trihuynh)
    const triHuynhUser = await prisma.user.upsert({
        where: { username: 'trihuynh' },
        update: {
            department_id: seededDepts['Công nghệ thông tin'].id,
            position_id: seededPositions['Thực tập sinh'].id
        },
        create: {
            username: 'trihuynh',
            email: 'trihuynh@system.com',
            password_hash: hashPassword('Tri@12345'),
            full_name: 'Huỳnh Minh Trí',
            employee_id: 'RN016',
            department_id: seededDepts['Công nghệ thông tin'].id,
            position_id: seededPositions['Thực tập sinh'].id,
            join_date: new Date() // Mới vào hôm nay
        }
    });
    await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: triHuynhUser.id, role_id: seededRoles['student'].id } },
        update: {},
        create: { user_id: triHuynhUser.id, role_id: seededRoles['student'].id }
    });

    // 5.4. Tài khoản Học viên kiểm thử 2 (student1)
    const student1User = await prisma.user.upsert({
        where: { username: 'student1' },
        update: {
            department_id: seededDepts['Công nghệ thông tin'].id,
            position_id: seededPositions['Nhân viên'].id
        },
        create: {
            username: 'student1',
            email: 'student1@system.com',
            password_hash: hashPassword('Stud@123'),
            full_name: 'Nguyễn Văn A',
            employee_id: 'RN017',
            department_id: seededDepts['Công nghệ thông tin'].id,
            position_id: seededPositions['Nhân viên'].id,
            join_date: new Date()
        }
    });
    await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: student1User.id, role_id: seededRoles['student'].id } },
        update: {},
        create: { user_id: student1User.id, role_id: seededRoles['student'].id }
    });

    console.log('✅ Khởi tạo danh sách tài khoản mặc định thành công:');
    console.log('   - Admin: admin / Admin@123');
    console.log('   - Manager IT: manager1 / Man@123');
    console.log('   - Student 1: trihuynh / Tri@12345');
    console.log('   - Student 2: student1 / Stud@123');
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
