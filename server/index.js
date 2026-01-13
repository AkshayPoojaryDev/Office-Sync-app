// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');

// Import middleware
const { verifyToken, requireAdmin, optionalAuth } = require('./middleware/auth');
const { validateOrder, validateNotice, validateNoticeUpdate, validateNoticeId } = require('./middleware/validation');
const { orderLimiter, noticeLimiter, generalLimiter } = require('./middleware/rateLimit');

// 1. Initialize Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

// 2. Security & Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(express.json()); // Parse JSON
app.use(generalLimiter); // General rate limiting

// --- API ROUTES ---

// Route: Place an Order (Protected + Rate Limited + Validated)
app.post('/api/order', verifyToken, orderLimiter, validateOrder, async (req, res) => {
  const { type } = req.body;
  const { uid, email, displayName } = req.user;

  // 1. BUSINESS LOGIC: Check the Time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Rule: Close orders at 10:30 AM
  if (currentHour > 10 || (currentHour === 10 && currentMinutes > 30)) {
    return res.status(400).json({
      success: false,
      message: "Sorry! Orders closed at 10:30 AM."
    });
  }

  // 2. DATABASE LOGIC: Save to Firestore
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyStatsRef = db.collection('daily_stats').doc(today);

    // Run a Transaction to ensure counts are accurate
    await db.runTransaction(async (t) => {
      const doc = await t.get(dailyStatsRef);

      if (!doc.exists) {
        t.set(dailyStatsRef, {
          tea: 0,
          coffee: 0,
          juice: 0,
          orders: [],
          lastUpdated: new Date().toISOString()
        });
      }

      // Increment the counter and add order
      t.update(dailyStatsRef, {
        [type]: admin.firestore.FieldValue.increment(1),
        orders: admin.firestore.FieldValue.arrayUnion({
          userId: uid,
          email,
          userName: displayName || email,
          type,
          timestamp: new Date().toISOString()
        }),
        lastUpdated: new Date().toISOString()
      });
    });

    res.status(200).json({ success: true, message: `${type} ordered!` });

  } catch (error) {
    console.error("Order failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route: Get Today's Counts (Public)
app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const doc = await db.collection('daily_stats').doc(today).get();

    if (!doc.exists) {
      res.json({ tea: 0, coffee: 0, juice: 0 });
    } else {
      const data = doc.data();
      res.json({ tea: data.tea || 0, coffee: data.coffee || 0, juice: data.juice || 0 });
    }
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Route: Get User's Order History (Protected)
app.get('/api/orders/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only view their own orders unless they're admin
    if (req.user.uid !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders"
      });
    }

    // Get all daily stats documents (last 30 days)
    const statsSnapshot = await db.collection('daily_stats')
      .limit(30)
      .get();

    const userOrders = [];
    statsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.orders) {
        const filtered = data.orders.filter(order => order.userId === userId);
        userOrders.push(...filtered.map(order => ({
          ...order,
          date: doc.id
        })));
      }
    });

    // Sort by timestamp in descending order (most recent first)
    userOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, orders: userOrders });
  } catch (error) {
    console.error("Order history fetch error:", error);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});

// Route: Get All Notices (Public)
app.get('/api/notices', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const offset = parseInt(req.query.offset) || 0;

    const snapshot = await db.collection('notices')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const notices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(notices);
  } catch (error) {
    console.error("Notices fetch error:", error);
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

// Route: Post a New Notice (Admin Only + Rate Limited + Validated)
app.post('/api/notices', verifyToken, requireAdmin, noticeLimiter, validateNotice, async (req, res) => {
  const { title, message } = req.body;
  const { email, displayName } = req.user;

  try {
    await db.collection('notices').add({
      title,
      message,
      author: email,
      authorName: displayName || email,
      timestamp: new Date().toISOString(),
      type: req.body.type || "general",
      isPinned: false,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: "Notice posted!" });
  } catch (error) {
    console.error("Notice post error:", error);
    res.status(500).json({ error: "Failed to post notice" });
  }
});

// Route: Update Notice (Admin Only + Validated)
app.put('/api/notices/:id', verifyToken, requireAdmin, validateNoticeUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await db.collection('notices').doc(id).update(updates);
    res.status(200).json({ success: true, message: "Notice updated!" });
  } catch (error) {
    console.error("Notice update error:", error);
    res.status(500).json({ error: "Failed to update notice" });
  }
});

// Route: Delete Notice (Admin Only)
app.delete('/api/notices/:id', verifyToken, requireAdmin, validateNoticeId, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('notices').doc(id).delete();
    res.status(200).json({ success: true, message: "Notice deleted!" });
  } catch (error) {
    console.error("Notice delete error:", error);
    res.status(500).json({ error: "Failed to delete notice" });
  }
});

// Route: Admin Stats Dashboard (Admin Only)
app.get('/api/admin/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Get stats for the last 7 days
    const stats = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const doc = await db.collection('daily_stats').doc(dateStr).get();

      if (doc.exists) {
        const data = doc.data();
        stats.push({
          date: dateStr,
          tea: data.tea || 0,
          coffee: data.coffee || 0,
          juice: data.juice || 0,
          total: (data.tea || 0) + (data.coffee || 0) + (data.juice || 0)
        });
      } else {
        stats.push({
          date: dateStr,
          tea: 0,
          coffee: 0,
          juice: 0,
          total: 0
        });
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});