// server/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/admin/stats', verifyToken, requireAdmin, adminController.getAdminStats);
router.delete('/stats/reset', verifyToken, requireAdmin, adminController.resetStats);
router.get('/stats', adminController.getPublicStats);

module.exports = router;
