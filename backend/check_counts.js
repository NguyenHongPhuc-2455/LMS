const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const coursePending = await prisma.courseRequest.count({
        where: { status: 'PENDING' }
    });
    const programPending = await prisma.programRequest.count({
        where: { status: 'PENDING' }
    });

    console.log('Course Pending:', coursePending);
    console.log('Program Pending:', programPending);

    const courseReqs = await prisma.courseRequest.findMany({
        where: { status: 'PENDING' },
        select: { id: true, user_id: true, course_id: true }
    });
    console.log('Course Reqs:', courseReqs);

    const programReqs = await prisma.programRequest.findMany({
        where: { status: 'PENDING' },
        select: { id: true, user_id: true, program_id: true }
    });
    console.log('Program Reqs:', programReqs);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
