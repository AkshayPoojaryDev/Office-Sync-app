// server/index.js
// Main entry point for the backend server.
// Handles Firebase initialization, middleware configuration, and route setup.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');
const { generalLimiter } = require('./middleware/rateLimit');

// --- 1. Initialize Firebase Admin SDK ---
// Supports two modes:
// A. 'process.env.FIREBASE_SERVICE_ACCOUNT': For Vercel/Production (JSON string)
// B. Local file ('serviceAccountKey.json'): For development
let db;
let firebaseError = null;

try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production/Vercel: Parse JSON from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local Development: Load from file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
    serviceAccount = require(serviceAccountPath);
  }

  // Prevent multiple initializations (relevant for hot reloading)
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

// --- 2. Security & Global Middleware ---
app.use(helmet()); // Adds various HTTP headers for security
// CORS Configuration to allow requests from the client
const clientUrl = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON request bodies
app.use(generalLimiter); // Apply global rate limiting to all requests

// --- 3. API Routes ---

// Health Check Endpoint
// Used to verify server status and Firebase connection
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

// Import Route Modules
const orderRoutes = require('./routes/orders');
const noticeRoutes = require('./routes/notices');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

// Mount Routes
app.use('/api', orderRoutes);
app.use('/api', noticeRoutes);
app.use('/api', userRoutes);
app.use('/api', adminRoutes);


// --- 4. Global Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    // Only expose error details in development
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// --- 5. Server Startup ---
// Only listen on port if not running in a serverless environment (like Vercel)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export app for Vercel/Serverless usage
module.exports = app;