// server/routes/orders.js
// Routes for placing and retrieving beverage orders.

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimit');
const { validateOrder } = require('../middleware/validation');
const admin = require('firebase-admin');

// Middleware: Check Database Connection
// Ensures Firebase is fully initialized before processing authenticated requests that rely on it.
const requireDb = (req, res, next) => {
    if (!admin.apps.length) {
        return res.status(500).json({
            success: false,
            message: 'Server configuration error: Database not connected'
        });
    }
    next();
};

// POST /api/order
// Places a new beverage order.
// Requires: Authentication, Rate Limiting, and Payload Validation.
router.post('/order', verifyToken, orderLimiter, validateOrder, orderController.placeOrder);

// GET /api/user/orders
// Retrieves the authenticated user's orders (today's orders primarily).
// Requires: Authentication and DB connection.
router.get('/user/orders', verifyToken, requireDb, orderController.getMyOrders);

// GET /api/orders/user/:userId
// Retrieves the full order history for a specific user (paginated).
// Requires: Authentication.
router.get('/orders/user/:userId', verifyToken, orderController.getUserOrderHistory);

// GET /api/users/:uid/stats
// Retrieves aggregated order statistics (counts by type) for a specific user.
// Requires: Authentication.
router.get('/users/:uid/stats', verifyToken, orderController.getUserStats);

module.exports = router;
