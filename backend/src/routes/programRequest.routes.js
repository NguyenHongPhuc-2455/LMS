const express = require('express');
const router = express.Router();
const c = require('../controllers/programRequest.controller');
const auth = require('../middlewares/auth.middleware');

// Gửi yêu cầu truy cập lộ trình
router.post('/request', auth.verifyToken, c.requestAccess);

// Cho Admin
router.get('/pending', auth.verifyToken, auth.isAdmin, c.getPendingRequests);
router.post('/approve-bulk', auth.verifyToken, auth.isAdmin, c.approveBulk);
router.post('/reject-bulk', auth.verifyToken, auth.isAdmin, c.rejectBulk);
router.post('/:id/approve', auth.verifyToken, auth.isAdmin, c.approveRequest);
router.post('/:id/reject', auth.verifyToken, auth.isAdmin, c.rejectRequest);


module.exports = router;
