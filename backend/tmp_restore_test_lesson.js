const prisma = require('./src/configs/prisma');
async function main() {
    const lesson = await prisma.lesson.updateMany({
        where: { title: 'Bài test' },
        data: {
            source_url: null,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        }
    });
    console.log('Restored lessons:', JSON.stringify(lesson, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
