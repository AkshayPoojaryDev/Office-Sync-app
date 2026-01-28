// server/controllers/userController.js
// Controller for user management and permission checks
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Retrieves the current user's role.
 * Used by the client to determine UI state (e.g., show Admin Dashboard link).
 */
exports.getRole = async (req, res) => {
    try {
        const { uid, email } = req.user;
        // Check if user is admin exists in 'users' collection with role 'admin'
        const userDoc = await db.collection('users').doc(uid).get();
        const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';

        res.json({
            success: true,
            role: isAdmin ? 'admin' : 'user',
            email
        });
    } catch (error) {
        res.status(500).json({ success: false, role: 'user' });
    }
};
