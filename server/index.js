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
// CORS Configuration
const clientUrl = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
  const currentTotalMinutes = currentHour * 60 + currentMinutes;

  // Order time slots:
  // Morning: Before 10:30 AM (0:00 - 10:30)
  // Evening: 3:00 PM - 5:30 PM (15:00 - 17:30)
  const morningEnd = 10 * 60 + 30;    // 10:30 AM = 630 minutes
  const eveningStart = 15 * 60;       // 3:00 PM = 900 minutes
  const eveningEnd = 17 * 60 + 30;    // 5:30 PM = 1050 minutes

  const isMorningSlot = currentTotalMinutes <= morningEnd;
  const isEveningSlot = currentTotalMinutes >= eveningStart && currentTotalMinutes <= eveningEnd;

  if (!isMorningSlot && !isEveningSlot) {
    return res.status(400).json({
      success: false,
      message: "Sorry! Orders are only available before 10:30 AM and between 4:00 PM - 5:30 PM."
    });
  }

  const currentSlot = isMorningSlot ? 'morning' : 'evening';

  // Helper to check if a timestamp falls into the given slot
  // Note: new Date(isoString).getHours() gives LOCAL time hours
  const isInSlot = (timestampStr, slot) => {
    const date = new Date(timestampStr);
    const hours = date.getHours();
    const minutes = hours * 60 + date.getMinutes();
    if (slot === 'morning') return minutes <= morningEnd;
    if (slot === 'evening') return minutes >= eveningStart && minutes <= eveningEnd;
    return false;
  };

  // 2. DATABASE LOGIC: Save to Firestore
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyStatsRef = db.collection('daily_stats').doc(today);

    let message = `${type} ordered!`;

    // Run a Transaction to ensure counts are accurate
    await db.runTransaction(async (t) => {
      const doc = await t.get(dailyStatsRef);

      if (!doc.exists) {
        t.set(dailyStatsRef, {
          tea: type === 'tea' ? 1 : 0,
          coffee: type === 'coffee' ? 1 : 0,
          juice: type === 'juice' ? 1 : 0,
          orders: [{
            userId: uid,
            email,
            userName: displayName || email,
            type,
            timestamp: new Date().toISOString()
          }],
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      const data = doc.data();
      const orders = data.orders || [];

      // Check if user already ordered in this slot
      const existingOrderIndex = orders.findIndex(o => {
        const isUser = o.userId === uid;
        const inSlot = isInSlot(o.timestamp, currentSlot);
        return isUser && inSlot;
      });

      if (existingOrderIndex !== -1) {
        // Update existing order
        const oldType = orders[existingOrderIndex].type;

        // If swapping types (e.g. tea -> coffee)
        if (oldType !== type) {
          t.update(dailyStatsRef, {
            [oldType]: admin.firestore.FieldValue.increment(-1),
            [type]: admin.firestore.FieldValue.increment(1),
            orders: orders.map((o, index) => {
              if (index === existingOrderIndex) {
                return { ...o, type, timestamp: new Date().toISOString() };
              }
              return o;
            }),
            lastUpdated: new Date().toISOString()
          });
          message = `Updated order to ${type}!`; // Signal update to client
        } else {
          // Same type, just update timestamp maybe? Or do nothing. 
          // Let's just update timestamp to show "latest" activity
          t.update(dailyStatsRef, {
            orders: orders.map((o, index) => {
              if (index === existingOrderIndex) {
                return { ...o, timestamp: new Date().toISOString() };
              }
              return o;
            }),
            lastUpdated: new Date().toISOString()
          });
          message = `Order updated!`;
        }
      } else {
        // New order for this slot
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
      }
    });

    res.status(200).json({ success: true, message });

  } catch (error) {
    console.error("Order failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route: Reset Today's Stats (Admin Only)
app.delete('/api/stats/reset', verifyToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('daily_stats').doc(today).set({
      tea: 0,
      coffee: 0,
      juice: 0,
      orders: [],
      lastUpdated: new Date().toISOString()
    });
    res.status(200).json({ success: true, message: "Stats reset to zero!" });
  } catch (error) {
    console.error("Reset failed:", error);
    res.status(500).json({ success: false, message: "Failed to reset stats" });
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
// Route: Get User's Order History (Protected) - Paginated
app.get('/api/orders/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const type = req.query.type || 'all';

    // Users can only view their own orders unless they're admin
    if (req.user.uid !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders"
      });
    }

    // Calculate date 60 days ago for filtering
    const date = new Date();
    date.setDate(date.getDate() - 60);
    const dateString = date.toISOString().split('T')[0];

    // Get all daily stats documents from the last 60 days
    // Using where() > dateString avoids the need for a descending index on __name__
    const statsSnapshot = await db.collection('daily_stats')
      .where(admin.firestore.FieldPath.documentId(), '>=', dateString)
      .get();

    let userOrders = [];
    statsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.orders) {
        let filtered = data.orders.filter(order => order.userId === userId);

        // Filter by type if specified
        if (type !== 'all') {
          filtered = filtered.filter(order => order.type === type);
        }

        userOrders.push(...filtered.map(order => ({
          ...order,
          date: doc.id
        })));
      }
    });

    // Sort by timestamp in descending order (most recent first)
    userOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const totalOrders = userOrders.length;
    const hasMore = offset + limit < totalOrders;

    // Slice for pagination
    const paginatedOrders = userOrders.slice(offset, offset + limit);

    res.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        total: totalOrders,
        limit,
        offset,
        hasMore
      }
    });
  } catch (error) {
    console.error("Order history fetch error:", error);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});

// Route: Get User Stats (Protected) - Optimized for Profile
app.get('/api/users/:uid/stats', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;

    if (req.user.uid !== uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Calculate date 60 days ago
    const date = new Date();
    date.setDate(date.getDate() - 60);
    const dateString = date.toISOString().split('T')[0];

    // Fetch last 60 days of data for stats
    const statsSnapshot = await db.collection('daily_stats')
      .where(admin.firestore.FieldPath.documentId(), '>=', dateString)
      .get();

    let totalOrders = 0;
    const typeCounts = { tea: 0, coffee: 0, juice: 0 };

    statsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.orders) {
        const userOrders = data.orders.filter(o => o.userId === uid);
        totalOrders += userOrders.length;
        userOrders.forEach(o => {
          if (typeCounts[o.type] !== undefined) {
            typeCounts[o.type]++;
          }
        });
      }
    });

    // Determine favorite
    let favorite = 'None';
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favorite = type.charAt(0).toUpperCase() + type.slice(1);
      }
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        favoriteBeverage: favorite,
        typeCounts
      }
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
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
  const { title, message, pollOptions } = req.body;
  const { email, displayName } = req.user;

  try {
    const noticeData = {
      title,
      message,
      author: email,
      authorName: displayName || email,
      timestamp: new Date().toISOString(),
      type: req.body.type || "general",
      isPinned: false,
      updatedAt: new Date().toISOString()
    };

    // Add poll data if pollOptions are provided
    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length >= 2) {
      noticeData.isPoll = true;
      noticeData.pollOptions = pollOptions.map(option => ({
        text: option,
        votes: 0
      }));
      noticeData.voters = []; // Track who has voted
    }

    await db.collection('notices').add(noticeData);

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

// Route: Vote on a Poll (Protected) - supports vote change/removal
app.post('/api/notices/:id/vote', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body; // optionIndex can be null to remove vote
    const { uid } = req.user;

    const noticeRef = db.collection('notices').doc(id);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(noticeRef);

      if (!doc.exists) {
        throw new Error("Notice not found");
      }

      const data = doc.data();

      if (!data.isPoll || !data.pollOptions) {
        throw new Error("This notice is not a poll");
      }

      // votes is now an object: { [uid]: optionIndex }
      const votes = data.votes || {};
      const pollOptions = [...data.pollOptions];
      const previousVote = votes[uid];

      // If user had a previous vote, decrement that option
      if (previousVote !== undefined && previousVote !== null) {
        if (pollOptions[previousVote]) {
          pollOptions[previousVote].votes = Math.max(0, pollOptions[previousVote].votes - 1);
        }
      }

      // Handle vote removal (optionIndex is null)
      if (optionIndex === null) {
        delete votes[uid];
      } else {
        // Validate new vote
        if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= pollOptions.length) {
          throw new Error("Invalid option index");
        }

        // Add new vote
        pollOptions[optionIndex].votes += 1;
        votes[uid] = optionIndex;
      }

      transaction.update(noticeRef, {
        pollOptions,
        votes,
        // Keep voters array for backward compatibility
        voters: Object.keys(votes)
      });
    });

    const action = optionIndex === null ? 'removed' : 'recorded';
    res.status(200).json({ success: true, message: `Vote ${action}!` });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(400).json({ error: error.message || "Failed to vote" });
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});