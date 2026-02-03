// server/routes/users.js
// Routes for user-related data and role management.

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// GET /api/user/role
// Retrieves the role (e.g., 'admin', 'user') of the currently authenticated user.
// Used by the client to determine access permissions.
router.get('/user/role', verifyToken, userController.getRole);

module.exports = router;
