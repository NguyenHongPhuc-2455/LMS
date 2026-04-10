const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.verifyToken, courseController.getCourses);
router.get('/:id', authMiddleware.verifyToken, courseController.getCourseDetail);
router.post('/', authMiddleware.verifyToken, courseController.createCourse);
router.post('/sections', authMiddleware.verifyToken, courseController.createSection);
router.delete('/sections/:id', authMiddleware.verifyToken, courseController.deleteSection);
router.delete('/:id', authMiddleware.verifyToken, courseController.deleteCourse);

module.exports = router;
