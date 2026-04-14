const prisma = require('../src/configs/prisma');
const path = require('path');
const fs = require('fs');

async function sync() {
    const lessons = await prisma.lesson.findMany({
        where: { type: 'VIDEO', video_url: { not: null } }
    });

    console.log(`🔍 Found ${lessons.length} lessons to scan.`);

    for (const lesson of lessons) {
        // Đường dẫn đến file master.m3u8
        const hlsPath = path.join(__dirname, '../', lesson.video_url);

        if (fs.existsSync(hlsPath)) {
            try {
                const content = fs.readFileSync(hlsPath, 'utf8');

                // Regex tìm tất cả các thẻ #EXTINF:duration,
                const regex = /#EXTINF:([\d.]+),/g;
                let match;
                let totalDuration = 0;

                while ((match = regex.exec(content)) !== null) {
                    totalDuration += parseFloat(match[1]);
                }

                if (totalDuration > 0) {
                    const roundedDuration = Math.round(totalDuration);
                    await prisma.lesson.update({
                        where: { id: lesson.id },
                        data: { duration: roundedDuration }
                    });
                    console.log(`✅ Updated Lesson ${lesson.id}: ${roundedDuration}s (from M3U8)`);
                } else {
                    console.warn(`⚠️ No fragments found in ${lesson.video_url}`);
                }
            } catch (err) {
                console.error(`❌ Error parsing ${lesson.video_url}:`, err.message);
            }
        } else {
            console.warn(`⚠️ File not found: ${hlsPath}`);
        }
    }
    console.log('🚀 Sync completed.');
    process.exit(0);
}

sync();
