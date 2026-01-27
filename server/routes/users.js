// server/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

router.get('/user/role', verifyToken, userController.getRole);

module.exports = router;
