const express = require('express');
const router = express.Router();
const positionController = require('../controllers/position.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.verifyToken, positionController.getPositions);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, positionController.createPosition);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, positionController.updatePosition);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, positionController.deletePosition);

module.exports = router;
