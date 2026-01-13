// server/middleware/rateLimit.js
// Rate limiting middleware to prevent abuse

const rateLimit = require('express-rate-limit');

// Rate limiter for order endpoints (5 requests per minute per IP)
const orderLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: {
        success: false,
        message: 'Too many order requests. Please try again in a minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for notice creation (10 requests per hour per IP)
const noticeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: {
        success: false,
        message: 'Too many notice posts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter (100 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    orderLimiter,
    noticeLimiter,
    generalLimiter,
};
