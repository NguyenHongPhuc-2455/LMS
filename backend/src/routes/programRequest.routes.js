const express = require('express');
const router = express.Router();
const programRequestController = require('../controllers/programRequest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const programRequestValidation = require('../validations/programRequest.validation');

// User routes
router.post('/', authMiddleware.verifyToken, validate(programRequestValidation.requestAccess), programRequestController.requestAccess);

// Admin routes
router.get('/pending', authMiddleware.verifyToken, authMiddleware.isAdmin, programRequestController.getPendingRequests);
router.post('/approve-bulk', authMiddleware.verifyToken, authMiddleware.isAdmin, validate(programRequestValidation.bulkAction), programRequestController.approveBulk);
router.post('/reject-bulk', authMiddleware.verifyToken, authMiddleware.isAdmin, validate(programRequestValidation.bulkAction), programRequestController.rejectBulk);
router.patch('/:id/approve', authMiddleware.verifyToken, authMiddleware.isAdmin, programRequestController.approveRequest);
router.patch('/:id/reject', authMiddleware.verifyToken, authMiddleware.isAdmin, programRequestController.rejectRequest);


module.exports = router;
