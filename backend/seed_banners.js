const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const banners = [
        {
            title: "Khóa học đa dạng",
            description: "Học tập không giới hạn với kho nội dung phong phú từ chuyên gia.",
            stat_value: "24+ khóa học",
            color_code: "#C8102E",
            order: 1
        },
        {
            title: "Chứng chỉ hoàn thành",
            description: "Khẳng định năng lực với hệ thống chứng chỉ đào tạo nội bộ uy tín.",
            stat_value: "500+ chứng chỉ",
            color_code: "#185FA5",
            order: 2
        },
        {
            title: "Streak học tập",
            description: "Duy trì thói quen học tập mỗi ngày để đạt hiệu quả cao nhất.",
            stat_value: "30 ngày kỷ lục",
            color_code: "#1D9E75",
            order: 3
        },
        {
            title: "Xếp hạng",
            description: "Cạnh tranh lành mạnh và ghi danh trên bảng vàng học tập công ty.",
            stat_value: "Top 10 học viên",
            color_code: "#BA7517",
            order: 4
        }
    ];

    for (const b of banners) {
        await prisma.heroBanner.create({ data: b });
    }

    console.log('Seed banners completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
