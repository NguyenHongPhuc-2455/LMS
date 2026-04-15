const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.verifyToken, courseController.getCourses);
router.get('/my-courses', authMiddleware.verifyToken, courseController.getMyCourses);
router.get('/:id', authMiddleware.verifyToken, courseController.getCourseDetail);
router.post('/', authMiddleware.verifyToken, courseController.createCourse);
router.put('/:id', authMiddleware.verifyToken, courseController.updateCourse);
router.post('/sections', authMiddleware.verifyToken, courseController.createSection);
router.put('/sections/:id', authMiddleware.verifyToken, courseController.updateSection);
router.delete('/sections/:id', authMiddleware.verifyToken, courseController.deleteSection);
router.delete('/:id', authMiddleware.verifyToken, courseController.deleteCourse);
router.post('/:id/enroll', authMiddleware.verifyToken, courseController.enrollCourse);

module.exports = router;
