// server/middleware/validation.js
// Input Validation Middleware
// Uses 'express-validator' to sanitize and validate request bodies and params.
// Ensures data integrity before it reaches the controllers.

const { body, param, validationResult } = require('express-validator');

/**
 * Validation Result Handler
 * Checks if previous validation rules in the chain generated any errors.
 * Returns 400 Bad Request with error details if validation fails.
 * Otherwise, passes control to the next middleware/controller.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validation Rules: Place Order
 * Checks: userId, email, and order type ('tea', 'coffee', 'juice').
 */
const validateOrder = [
    body('userId')
        .trim()
        .notEmpty().withMessage('User ID is required')
        .isLength({ min: 1, max: 128 }).withMessage('Invalid user ID'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('type')
        .trim()
        .notEmpty().withMessage('Order type is required')
        .isIn(['tea', 'coffee', 'juice']).withMessage('Type must be "tea", "coffee", or "juice"'),

    validate
];

/**
 * Validation Rules: Create Notice
 * Checks: title, message content, author email, type, and poll options (if applicable).
 * Sanctuary: escape() used to prevent XSS.
 */
const validateNotice = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
        .escape(), // Prevent XSS

    body('message')
        .trim()
        .optional({ checkFalsy: true })
        .isLength({ max: 1000 }).withMessage('Message must be at most 1000 characters')
        .escape(), // Prevent XSS

    body('author')
        .optional()
        .trim()
        .isEmail().withMessage('Author must be a valid email')
        .normalizeEmail(),

    body('type')
        .optional()
        .trim()
        .isIn(['general', 'important', 'urgent', 'holiday', 'poll']).withMessage('Type must be general, important, urgent, holiday, or poll'),

    body('pollOptions')
        .optional()
        .isArray({ min: 2, max: 6 }).withMessage('Poll must have 2-6 options'),

    body('pollOptions.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('Poll option must be between 1 and 100 characters'),

    validate
];

/**
 * Validation Rules: Update Notice
 * Ensures 'id' param exists and validates optional update fields.
 */
const validateNoticeUpdate = [
    param('id')
        .trim()
        .notEmpty().withMessage('Notice ID is required'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
        .escape(),

    body('message')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters')
        .escape(),

    validate
];

/**
 * Validation Rules: Delete Notice
 * Simply ensures the 'id' parameter is present.
 */
const validateNoticeId = [
    param('id')
        .trim()
        .notEmpty().withMessage('Notice ID is required'),

    validate
];

module.exports = {
    validateOrder,
    validateNotice,
    validateNoticeUpdate,
    validateNoticeId,
};
