// server/middleware/auth.js
// Firebase authentication and authorization middleware

const admin = require('firebase-admin');

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify the token with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
        };

        // Fetch user role from Firestore
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(decodedToken.uid)
            .get();

        if (userDoc.exists) {
            req.user.role = userDoc.data().role || 'user';
            req.user.displayName = userDoc.data().displayName;
        } else {
            // Create user document if it doesn't exist
            await admin.firestore()
                .collection('users')
                .doc(decodedToken.uid)
                .set({
                    email: decodedToken.email,
                    role: 'user',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                });
            req.user.role = 'user';
        }

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }

    next();
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(token);

            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
            };
        }
    } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error.message);
    }

    next();
};

module.exports = {
    verifyToken,
    requireAdmin,
    optionalAuth,
};
