// server/controllers/adminController.js
// Controller for Admin Dashboard analytics and management
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Retrieves statistics for the last 7 days.
 * Used for populating the charts on the Admin Dashboard.
 * 
 * Strategy:
 * 1. Generate an array of date strings for the last 7 days.
 * 2. Fetch all corresponding 'daily_stats' documents in parallel using an 'in' query.
 * 3. Map the results to the date array, filling in zeros for missing days.
 */
exports.getAdminStats = async (req, res) => {
    try {
        // Get stats for the last 7 days
        const dates = [];
        const today = new Date();

        // Generate last 7 dates
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        // Use 'in' query to fetch all 7 days in parallel with projection
        const snapshot = await db.collection('daily_stats')
            .where(admin.firestore.FieldPath.documentId(), 'in', dates)
            .select('tea', 'coffee', 'juice')
            .get();

        // Map results by ID for O(1) lookup
        const docsMap = {};
        snapshot.forEach(doc => {
            docsMap[doc.id] = doc.data();
        });

        const stats = dates.map(dateStr => {
            const data = docsMap[dateStr] || {};
            const tea = data.tea || 0;
            const coffee = data.coffee || 0;
            const juice = data.juice || 0;

            return {
                date: dateStr,
                tea,
                coffee,
                juice,
                total: tea + coffee + juice
            };
        });

        res.json({ success: true, stats });
    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
};

/**
 * Hard resets all stats for the current day.
 * Destructive action: Wipes counts and the orders array for today's doc.
 */
exports.resetStats = async (req, res) => {
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
};

/**
 * Retrieves today's total stats for public display.
 * Used by the main Client Dashboard.
 */
exports.getPublicStats = async (req, res) => {
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
};
