const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware.verifyToken, quizController.createQuiz);
router.get('/lesson/:lessonId', authMiddleware.verifyToken, quizController.getQuizByLessonId);
router.post('/:id/submit', authMiddleware.verifyToken, quizController.submitAttempt);
router.get('/:id/attempts', authMiddleware.verifyToken, quizController.getAttemptsByUser);
router.put('/:id', authMiddleware.verifyToken, quizController.updateQuiz);
router.delete('/:id', authMiddleware.verifyToken, quizController.deleteQuiz);

module.exports = router;
