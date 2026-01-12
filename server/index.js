// server/index.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// Route: Place an Order
app.post('/api/order', async (req, res) => {
  const { userId, type, email } = req.body; // type = 'tea' or 'coffee'

  // 1. BUSINESS LOGIC: Check the Time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Rule: Close orders at 10:30 AM
  // (If hour is > 10 OR if hour is 10 and minutes > 30)
  if (currentHour > 10 || (currentHour === 10 && currentMinutes > 30)) {
    return res.status(400).json({ 
      success: false, 
      message: "Sorry! Orders closed at 10:30 AM." 
    });
  }

  // 2. DATABASE LOGIC: Save to Firestore
  try {
    // We group orders by Date (e.g., "2023-10-27")
    const today = new Date().toISOString().split('T')[0]; 
    const dailyStatsRef = db.collection('daily_stats').doc(today);

    // Run a "Transaction" to ensure counts are accurate even if 100 people click at once
    await db.runTransaction(async (t) => {
      const doc = await t.get(dailyStatsRef);
      
      // If today's document doesn't exist, create it
      if (!doc.exists) {
        t.set(dailyStatsRef, { tea: 0, coffee: 0, orders: [] });
      }

      // Increment the counter for the specific type (tea or coffee)
      t.update(dailyStatsRef, {
        [type]: admin.firestore.FieldValue.increment(1),
        orders: admin.firestore.FieldValue.arrayUnion({
          userId,
          email,
          type,
          timestamp: new Date().toISOString()
        })
      });
    });

    res.status(200).json({ success: true, message: `${type} ordered!` });

  } catch (error) {
    console.error("Order failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route: Get Today's Counts (For the Dashboard to display)
app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const doc = await db.collection('daily_stats').doc(today).get();

    if (!doc.exists) {
      res.json({ tea: 0, coffee: 0 });
    } else {
      const data = doc.data();
      res.json({ tea: data.tea || 0, coffee: data.coffee || 0 });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// Route: Get All Notices
app.get('/api/notices', async (req, res) => {
  try {
    const snapshot = await db.collection('notices')
      .orderBy('timestamp', 'desc') // Show newest first
      .limit(5)                     // Only show last 5
      .get();
      
    const notices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

// Route: Post a New Notice (Admin only)
app.post('/api/notices', async (req, res) => {
  const { title, message, author } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  try {
    await db.collection('notices').add({
      title,
      message,
      author: author || "Admin",
      timestamp: new Date().toISOString(),
      type: "general" // You can change this to 'urgent', 'holiday', etc. later
    });

    res.status(200).json({ success: true, message: "Notice posted!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to post notice" });
  }
});