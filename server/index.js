// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');
const { generalLimiter } = require('./middleware/rateLimit');

// 1. Initialize Firebase (supports both file and env variable)
let db;
let firebaseError = null;

try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Vercel: Parse JSON from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local: Load from file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
    serviceAccount = require(serviceAccountPath);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  db = admin.firestore();
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  firebaseError = error.message;
}

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: firebaseError ? 'error' : 'ok',
    firebase: firebaseError ? 'disconnected' : 'connected',
    startTime: new Date().toISOString(),
    env: {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      nodeEnv: process.env.NODE_ENV
    },
    error: firebaseError
  });
});

// Import Routes
const orderRoutes = require('./routes/orders');
const noticeRoutes = require('./routes/notices');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

// Use Routes
app.use('/api', orderRoutes);
app.use('/api', noticeRoutes);
app.use('/api', userRoutes);
app.use('/api', adminRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Start server (only in non-serverless environment)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;