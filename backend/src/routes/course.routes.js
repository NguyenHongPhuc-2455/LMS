const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const sectionController = require('../controllers/section.controller');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const courseValidation = require('../validations/course.validation');

router.get('/', authMiddleware.verifyToken, courseController.getCourses);
router.get('/my-courses', authMiddleware.verifyToken, enrollmentController.getMyCourses);
router.get('/mandatory', authMiddleware.verifyToken, enrollmentController.getMyMandatoryCourses);
router.get('/mandatory-overdue-report', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, courseController.getMandatoryOverdueReport);
router.get('/:id', authMiddleware.verifyToken, validate(courseValidation.getById), courseController.getCourseDetail);

// Chỉ Instructor hoặc Admin mới có quyền tạo/sửa/xóa khóa học
router.post('/', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.createCourse), courseController.createCourse);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.updateCourse), courseController.updateCourse);
router.post('/:id/restore', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.getById), courseController.restoreCourse);
router.patch('/:id/toggle-active', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.getById), courseController.toggleActiveStatus);
router.delete('/batch', authMiddleware.verifyToken, authMiddleware.isInstructor, courseController.batchDeleteCourses);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.getById), courseController.deleteCourse);

// Quản lý Chương (Section)
router.get('/sections/:id', authMiddleware.verifyToken, validate(courseValidation.getById), sectionController.getSectionDetail);
router.post('/sections', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.createSection), sectionController.createSection);
router.put('/sections/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.updateSection), sectionController.updateSection);
router.delete('/sections/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(courseValidation.getById), sectionController.deleteSection);

router.post('/:id/enroll', authMiddleware.verifyToken, validate(courseValidation.getById), enrollmentController.enrollCourse);

module.exports = router;
