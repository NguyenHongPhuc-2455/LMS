const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Quản lý Quiz (Chỉ Instructor/Admin)
router.post('/', authMiddleware.verifyToken, authMiddleware.isInstructor, quizController.createQuiz);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, quizController.updateQuiz);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, quizController.deleteQuiz);

// Học viên tương tác
router.get('/lesson/:lessonId', authMiddleware.verifyToken, quizController.getQuizByLessonId);
router.post('/:id/submit', authMiddleware.verifyToken, quizController.submitAttempt);
router.get('/:id/attempts', authMiddleware.verifyToken, quizController.getAttemptsByUser);

module.exports = router;
