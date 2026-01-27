// server/routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimit');
const { validateOrder } = require('../middleware/validation');

// Middleware to check if Firebase is initialized (can be imported if needed, or kept simple here)
const admin = require('firebase-admin');
const requireDb = (req, res, next) => {
    if (!admin.apps.length) {
        return res.status(500).json({
            success: false,
            message: 'Server configuration error: Database not connected'
        });
    }
    next();
};

// Routes
router.post('/order', verifyToken, orderLimiter, validateOrder, orderController.placeOrder);
router.get('/user/orders', verifyToken, requireDb, orderController.getMyOrders);
router.get('/orders/user/:userId', verifyToken, orderController.getUserOrderHistory);
router.get('/users/:uid/stats', verifyToken, orderController.getUserStats);

module.exports = router;
