// server/middleware/rateLimit.js
// Rate Limiting Middleware using 'express-rate-limit'
// Prevents API abuse and DoS attacks by limiting request frequency from IP addresses.

const rateLimit = require('express-rate-limit');

/**
 * Order Endpoint Limiter
 * Strict limit for placing orders to prevent flooding the database or gaming the system.
 * Limit: 5 requests per minute per IP.
 */
const orderLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: {
        success: false,
        message: 'Too many order requests. Please try again in a minute.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Notice Creation Limiter
 * Limits how often notices/polls can be created to prevent spam.
 * Limit: 10 requests per hour per IP.
 */
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

/**
 * General API Limiter
 * Baseline protection for all other API endpoints.
 * Limit: 100 requests per 15 minutes per IP.
 */
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
