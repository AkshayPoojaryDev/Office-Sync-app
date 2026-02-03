// server/routes/notices.js
// Routes for managing dashboard notices (announcements) and polls.

const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { noticeLimiter } = require('../middleware/rateLimit');
const { validateNotice, validateNoticeUpdate, validateNoticeId } = require('../middleware/validation');

// GET /api/notices
// Retrieves a paginated list of active notices.
// Publicly accessible to display on the dashboard.
router.get('/notices', noticeController.getNotices);

// POST /api/notices
// Creates a new notice or poll.
// Requires: Authentication, Admin privileges, Rate Limiting, and Validation.
router.post('/notices', verifyToken, requireAdmin, noticeLimiter, validateNotice, noticeController.createNotice);

// PUT /api/notices/:id
// Updates an existing notice.
// Requires: Authentication, Admin privileges, and Validation.
router.put('/notices/:id', verifyToken, requireAdmin, validateNoticeUpdate, noticeController.updateNotice);

// DELETE /api/notices/:id
// Deletes a notice.
// Requires: Authentication, Admin privileges, and ID Validation.
router.delete('/notices/:id', verifyToken, requireAdmin, validateNoticeId, noticeController.deleteNotice);

// POST /api/notices/:id/vote
// Records a vote on a poll.
// Requires: Authentication (ensures one vote per user per poll).
router.post('/notices/:id/vote', verifyToken, noticeController.voteOnPoll);

module.exports = router;
