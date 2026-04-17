const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');

const createQuiz = async (data) => {
    // Validate
    if (!data.title || !data.section_id) throw new ApiError(400, "Missing title or section_id");

    return await prisma.$transaction(async (tx) => {
        // 1. Create Lesson with type QUIZ
        const lesson = await tx.lesson.create({
            data: {
                title: data.title,
                section_id: parseInt(data.section_id),
                type: 'QUIZ',
                order: data.order || 0
            }
        });

        // 2. Create Quiz
        const quiz = await tx.quiz.create({
            data: {
                lesson_id: lesson.id,
                description: data.description || '',
                pass_score: data.pass_score ? parseInt(data.pass_score) : 80,
                time_limit: data.time_limit ? parseInt(data.time_limit) : null,
            }
        });

        // 3. Create Questions and Options
        if (data.questions && data.questions.length > 0) {
            for (let i = 0; i < data.questions.length; i++) {
                const q = data.questions[i];
                const createdQ = await tx.question.create({
                    data: {
                        quiz_id: quiz.id,
                        content: q.content,
                        explanation: q.explanation || '',
                        order: i
                    }
                });

                if (q.options && q.options.length > 0) {
                    await tx.option.createMany({
                        data: q.options.map(opt => ({
                            question_id: createdQ.id,
                            content: opt.content,
                            is_correct: opt.is_correct === true || opt.is_correct === 'true'
                        }))
                    });
                }
            }
        }

        return await tx.quiz.findUnique({
            where: { id: quiz.id },
            include: {
                lesson: true,
                questions: {
                    include: { options: true }
                }
            }
        });
    });
};

const getQuizByLessonId = async (lessonId, userId = null) => {
    const parsedLessonId = parseInt(lessonId);
    if (isNaN(parsedLessonId)) throw new ApiError(400, "Invalid lessonId");

    const quiz = await prisma.quiz.findUnique({
        where: { lesson_id: parsedLessonId },
        include: {
            lesson: true,
            questions: {
                orderBy: { order: 'asc' },
                include: {
                    options: true
                }
            }
        }
    });

    if (!quiz) throw new ApiError(404, "Quiz not found");

    let lastAttempt = null;
    if (userId) {
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
            lastAttempt = await prisma.quizAttempt.findFirst({
                where: {
                    user_id: parsedUserId,
                    quiz_id: quiz.id
                },
                orderBy: { started_at: 'desc' }, // Dùng started_at cho chắc chắn có
                include: {
                    answers: true
                }
            });
        }
    }

    // Trả về object thuần túy để tránh lỗi Prisma spread
    return {
        id: quiz.id,
        lesson_id: quiz.lesson_id,
        description: quiz.description,
        pass_score: quiz.pass_score,
        time_limit: quiz.time_limit,
        lesson: quiz.lesson,
        questions: quiz.questions,
        lastAttempt: lastAttempt || null
    };
};

const submitAttempt = async (userId, quizId, answers) => {
    const parsedQuizId = parseInt(quizId);

    const quiz = await prisma.quiz.findUnique({
        where: { id: parsedQuizId },
        include: {
            lesson: true,
            questions: {
                include: { options: true }
            }
        }
    });

    if (!quiz) throw new ApiError(404, "Quiz not found");

    let score = 0;
    const totalQuestions = quiz.questions.length;
    const correctAnswerMap = {};

    quiz.questions.forEach(q => {
        const correctOpt = q.options.find(o => o.is_correct);
        if (correctOpt) correctAnswerMap[q.id] = correctOpt.id;
    });

    const parsedAnswers = answers || [];
    let correctCount = 0;

    parsedAnswers.forEach(ans => {
        if (correctAnswerMap[ans.question_id] === parseInt(ans.option_id)) {
            correctCount++;
        }
    });

    if (totalQuestions > 0) {
        score = Math.round((correctCount / totalQuestions) * 100);
    } else {
        score = 100;
    }

    const status = score >= quiz.pass_score ? "PASSED" : "FAILED";

    const attempt = await prisma.quizAttempt.create({
        data: {
            user_id: parseInt(userId),
            quiz_id: parsedQuizId,
            score: score,
            status: status,
            completed_at: new Date(),
            answers: {
                create: parsedAnswers.map(ans => ({
                    question_id: parseInt(ans.question_id),
                    option_id: parseInt(ans.option_id)
                }))
            }
        }
    });

    if (status === "PASSED") {
        await prisma.lessonCompleted.upsert({
            where: {
                user_id_lesson_id: {
                    user_id: parseInt(userId),
                    lesson_id: quiz.lesson_id
                }
            },
            update: {},
            create: {
                user_id: parseInt(userId),
                lesson_id: quiz.lesson_id
            }
        });
    }

    return {
        attempt,
        score,
        status,
        correctCount,
        totalQuestions
    };
};

const getAttemptsByUser = async (userId, quizId) => {
    return await prisma.quizAttempt.findMany({
        where: { user_id: parseInt(userId), quiz_id: parseInt(quizId) },
        orderBy: { created_at: 'desc' }
    });
};

const updateQuiz = async (quizId, data) => {
    const quiz = await prisma.quiz.findUnique({ where: { id: parseInt(quizId) }, include: { lesson: true } });
    if (!quiz) throw new ApiError(404, "Quiz not found");

    return await prisma.$transaction(async (tx) => {
        if (data.title !== undefined || data.order !== undefined || data.section_id !== undefined) {
            await tx.lesson.update({
                where: { id: quiz.lesson_id },
                data: {
                    title: data.title !== undefined ? data.title : quiz.lesson.title,
                    order: data.order !== undefined ? parseInt(data.order) : quiz.lesson.order,
                    section_id: data.section_id ? parseInt(data.section_id) : quiz.lesson.section_id
                }
            });
        }

        const updatedQuiz = await tx.quiz.update({
            where: { id: parseInt(quizId) },
            data: {
                description: data.description !== undefined ? data.description : quiz.description,
                pass_score: data.pass_score ? parseInt(data.pass_score) : quiz.pass_score,
                time_limit: data.time_limit !== undefined ? (data.time_limit ? parseInt(data.time_limit) : null) : quiz.time_limit
            }
        });

        if (data.questions && data.questions.length > 0) {
            await tx.question.deleteMany({ where: { quiz_id: parseInt(quizId) } });

            for (let i = 0; i < data.questions.length; i++) {
                const q = data.questions[i];
                const createdQ = await tx.question.create({
                    data: {
                        quiz_id: parseInt(quizId),
                        content: q.content,
                        explanation: q.explanation || '',
                        order: i
                    }
                });

                if (q.options && q.options.length > 0) {
                    await tx.option.createMany({
                        data: q.options.map(opt => ({
                            question_id: createdQ.id,
                            content: opt.content,
                            is_correct: opt.is_correct === true || opt.is_correct === 'true'
                        }))
                    });
                }
            }
        }

        return updatedQuiz;
    });
};

const deleteQuiz = async (quizId) => {
    const quiz = await prisma.quiz.findUnique({ where: { id: parseInt(quizId) } });
    if (!quiz) throw new ApiError(404, "Quiz not found");
    return await prisma.lesson.delete({
        where: { id: quiz.lesson_id }
    });
};

module.exports = {
    createQuiz,
    getQuizByLessonId,
    submitAttempt,
    getAttemptsByUser,
    updateQuiz,
    deleteQuiz
};
