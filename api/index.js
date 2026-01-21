// api/index.js - Vercel serverless entry point
const path = require('path');

// Set up environment for serverless
process.env.VERCEL = '1';

let app;
try {
    app = require('../server/index.js');
} catch (error) {
    // If require fails, create a simple express app to show the error
    const express = require('express');
    app = express();
    app.use((req, res) => {
        res.status(500).json({
            error: 'Server initialization failed',
            message: error.message,
            stack: error.stack
        });
    });
}

module.exports = app;
