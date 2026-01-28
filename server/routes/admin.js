// server/routes/admin.js
// Routes for administrative actions and analytics.

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/admin/stats
// Retrieves privileged statistics (daily breakdown) for the Admin Dashboard.
// Requires: User must be logged in and have 'admin' role.
router.get('/admin/stats', verifyToken, requireAdmin, adminController.getAdminStats);

// DELETE /api/stats/reset
// Resets the daily order counts. Destructive action.
// Requires: User must be logged in and have 'admin' role.
router.delete('/stats/reset', verifyToken, requireAdmin, adminController.resetStats);

// GET /api/stats
// Retrieves public statistics (today's total counts) for the general Dashboard.
// Accessible to all users (public).
router.get('/stats', adminController.getPublicStats);

module.exports = router;
