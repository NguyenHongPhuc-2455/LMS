const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const courseValidation = require('../validations/course.validation');

router.get('/', authMiddleware.verifyToken, courseController.getCourses);
router.get('/my-courses', authMiddleware.verifyToken, courseController.getMyCourses);
router.get('/mandatory', authMiddleware.verifyToken, courseController.getMyMandatoryCourses);
router.get('/mandatory-overdue-report', authMiddleware.verifyToken, authMiddleware.isAdmin, courseController.getMandatoryOverdueReport);
router.get('/:id', authMiddleware.verifyToken, validate(courseValidation.getById), courseController.getCourseDetail);

// Chỉ Instructor hoặc Admin mới có quyền tạo/sửa/xóa khóa học
router.post('/', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.createCourse), courseController.createCourse);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.updateCourse), courseController.updateCourse);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.getById), courseController.deleteCourse);

// Quản lý Chương (Section)
router.get('/sections/:id', authMiddleware.verifyToken, validate(courseValidation.getById), courseController.getSectionDetail);
router.post('/sections', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.createSection), courseController.createSection);
router.put('/sections/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.updateSection), courseController.updateSection);
router.delete('/sections/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.getById), courseController.deleteSection);

router.post('/:id/enroll', authMiddleware.verifyToken, validate(courseValidation.getById), courseController.enrollCourse);

module.exports = router;
