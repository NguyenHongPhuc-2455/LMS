const prisma = require('./src/configs/prisma');

async function main() {
    const lesson = await prisma.lesson.update({
        where: { id: 7 },
        data: {
            source_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            video_url: '/api/videos/manifest/7'
        }
    });
    console.log('Updated lesson 7:', JSON.stringify(lesson, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
