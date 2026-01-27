// server/controllers/userController.js
const admin = require('firebase-admin');
const db = admin.firestore();

exports.getRole = async (req, res) => {
    try {
        const { uid, email } = req.user;
        // Check if user is admin
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
