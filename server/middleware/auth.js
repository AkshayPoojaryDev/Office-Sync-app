// server/middleware/auth.js
// Firebase Authentication and Authorization Middleware
// Handles ID token verification, user context attachment, and role-based access control.

const admin = require('firebase-admin');

/**
 * Middleware: Verify Firebase ID Token
 * 
 * 1. Checks for 'Authorization: Bearer <token>' header.
 * 2. Verifies the token using Firebase Admin SDK.
 * 3. Fetches the user's role from Firestore (claims are too often stale, so we check DB).
 * 4. Attaches the user object (uid, email, role) to the request context (req.user).
 * 
 * Used globally or on protected routes.
 */
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
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (authError) {
            console.error('Token verification specific error:', authError);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                error: authError.code
            });
        }

        // Attach basic user info from token to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
        };

        // Fetch user role from Firestore to ensure latest permissions
        // Note: Custom Claims could be faster, but DB is more real-time for role changes
        try {
            const userDoc = await admin.firestore()
                .collection('users')
                .doc(decodedToken.uid)
                .get();

            if (userDoc.exists) {
                req.user.role = userDoc.data().role || 'user';
                req.user.displayName = userDoc.data().displayName;
            } else {
                // Auto-create user document if it doesn't exist (First Login)
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
        } catch (dbError) {
            console.error('Firestore role fetch error:', dbError);
            // Fallback to 'user' role if DB fails, so app doesn't crash entirely
            // This allows basic access even if DB is having issues
            req.user.role = 'user';
        }

        next();
    } catch (error) {
        console.error('Unexpected auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal authentication error'
        });
    }
};

/**
 * Middleware: Require Admin Role
 * Must be used after verifyToken.
 * Rejects request if req.user.role is not 'admin'.
 */
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

/**
 * Middleware: Optional Authentication
 * Attempts to verify a token if present, but does not block the request if missing or invalid.
 * Useful for routes that show more data to logged-in users but work anonymously too.
 */
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
        // Silently fail for optional auth - just don't populate req.user
        console.log('Optional auth failed:', error.message);
    }

    next();
};

module.exports = {
    verifyToken,
    requireAdmin,
    optionalAuth,
};
