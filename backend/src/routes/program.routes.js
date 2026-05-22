const express = require('express');
const router = express.Router();
const c = require('../controllers/program.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const programValidation = require('../validations/program.validation');

router.get('/', auth.verifyToken, c.getPrograms);
router.get('/my-programs', auth.verifyToken, c.getMyPrograms);
router.get('/mandatory', auth.verifyToken, c.getMyMandatoryPrograms);
router.get('/:id', auth.verifyToken, validate(programValidation.getById), c.getProgramDetail);

// Chỉ Instructor hoặc Admin mới có quyền tạo/sửa
router.post('/', auth.verifyToken, auth.isInstructor, validate(programValidation.createProgram), c.createProgram);
router.put('/:id', auth.verifyToken, auth.isInstructor, validate(programValidation.updateProgram), c.updateProgram);

// Quyền Admin cao hơn cho các thao tác cấu trúc
router.delete('/:id', auth.verifyToken, auth.isAdmin, validate(programValidation.getById), c.deleteProgram);
router.post('/:id/courses', auth.verifyToken, auth.isAdmin, validate(programValidation.addCourse), c.addCourseToProgram);
router.put('/:id/courses/reorder', auth.verifyToken, auth.isAdmin, validate(programValidation.getById), c.reorderProgramCourses);
router.delete('/:id/courses/:courseId', auth.verifyToken, auth.isAdmin, c.removeCourseFromProgram);

router.post('/:id/enroll', auth.verifyToken, validate(programValidation.getById), c.enrollProgram);

module.exports = router;
