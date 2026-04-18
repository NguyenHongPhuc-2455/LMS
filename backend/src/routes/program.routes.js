const express = require('express');
const router = express.Router();
const c = require('../controllers/program.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth.verifyToken, c.getPrograms);
router.get('/my-programs', auth.verifyToken, c.getMyPrograms);
router.get('/:id', auth.verifyToken, c.getProgramDetail);
router.post('/', auth.verifyToken, c.createProgram);
router.put('/:id', auth.verifyToken, c.updateProgram);
router.delete('/:id', auth.verifyToken, auth.isAdmin, c.deleteProgram);
router.post('/:id/courses', auth.verifyToken, auth.isAdmin, c.addCourseToProgram);
router.delete('/:id/courses/:courseId', auth.verifyToken, auth.isAdmin, c.removeCourseFromProgram);
router.post('/:id/enroll', auth.verifyToken, c.enrollProgram);

module.exports = router;
