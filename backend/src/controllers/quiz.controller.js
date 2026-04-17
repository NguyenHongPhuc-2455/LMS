const quizService = require('../services/quiz.service');
const catchAsync = require('../utils/catchAsync');

const createQuiz = catchAsync(async (req, res) => {
    const quiz = await quizService.createQuiz(req.body);
    res.status(201).json({ success: true, data: quiz });
});

const getQuizByLessonId = catchAsync(async (req, res) => {
    const lessonId = req.params.lessonId;
    const userId = req.user ? req.user.id : null;
    const quiz = await quizService.getQuizByLessonId(lessonId, userId);
    res.status(200).json({ success: true, data: quiz });
});

const submitAttempt = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const quizId = req.params.id;
    const { answers } = req.body;

    const result = await quizService.submitAttempt(userId, quizId, answers);
    res.status(200).json({ success: true, data: result });
});

const getAttemptsByUser = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const quizId = req.params.id;
    const attempts = await quizService.getAttemptsByUser(userId, quizId);
    res.status(200).json({ success: true, data: attempts });
});

const updateQuiz = catchAsync(async (req, res) => {
    const quizId = req.params.id;
    const updatedQuiz = await quizService.updateQuiz(quizId, req.body);
    res.status(200).json({ success: true, data: updatedQuiz });
});

const deleteQuiz = catchAsync(async (req, res) => {
    const quizId = req.params.id;
    await quizService.deleteQuiz(quizId);
    res.status(200).json({ success: true, message: 'Deleted successfully' });
});

module.exports = {
    createQuiz,
    getQuizByLessonId,
    submitAttempt,
    getAttemptsByUser,
    updateQuiz,
    deleteQuiz
};
