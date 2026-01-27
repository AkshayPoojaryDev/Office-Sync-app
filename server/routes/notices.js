// server/routes/notices.js
const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { noticeLimiter } = require('../middleware/rateLimit');
const { validateNotice, validateNoticeUpdate, validateNoticeId } = require('../middleware/validation');

router.get('/notices', noticeController.getNotices);
router.post('/notices', verifyToken, requireAdmin, noticeLimiter, validateNotice, noticeController.createNotice);
router.put('/notices/:id', verifyToken, requireAdmin, validateNoticeUpdate, noticeController.updateNotice);
router.delete('/notices/:id', verifyToken, requireAdmin, validateNoticeId, noticeController.deleteNotice);
router.post('/notices/:id/vote', verifyToken, noticeController.voteOnPoll);

module.exports = router;
