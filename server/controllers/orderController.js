// server/controllers/orderController.js
// Controller for Order processing and history management.
const admin = require('firebase-admin');
const { ORDER_TIME_SLOTS } = require('../config/constants');
const db = admin.firestore();

/**
 * Helper: Checks if a given timestamp falls within a specific ordering slot (morning/evening).
 * @param {string} timestampStr 
 * @param {string} slot - 'morning' or 'evening'
 */
const isInSlot = (timestampStr, slot) => {
    const date = new Date(timestampStr);
    const hours = date.getHours();
    const minutes = hours * 60 + date.getMinutes();

    if (slot === 'morning') return minutes <= ORDER_TIME_SLOTS.MORNING.TOTAL_MINUTES;
    if (slot === 'evening') return minutes >= ORDER_TIME_SLOTS.EVENING.START_TOTAL_MINUTES && minutes <= ORDER_TIME_SLOTS.EVENING.END_TOTAL_MINUTES;
    return false;
};

/**
 * Places a new order.
 * 
 * Logic Flow:
 * 1. Validate Time: Check if the current time matches an allowed window.
 * 2. Transaction Start:
 * 3.   Check for duplicates (user already ordered in this slot?).
 * 4.   Update 'daily_stats' (counters for Admin Dashboard).
 * 5.   Create normalized 'orders' document (for scalable history).
 * 6. Transaction Commit.
 */
exports.placeOrder = async (req, res) => {
    const { type } = req.body;
    const { uid, email, displayName } = req.user;

    // 1. BUSINESS LOGIC: Check the Time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinutes;

    const isMorningSlot = currentTotalMinutes <= ORDER_TIME_SLOTS.MORNING.TOTAL_MINUTES;
    const isEveningSlot = currentTotalMinutes >= ORDER_TIME_SLOTS.EVENING.START_TOTAL_MINUTES && currentTotalMinutes <= ORDER_TIME_SLOTS.EVENING.END_TOTAL_MINUTES;

    if (!isMorningSlot && !isEveningSlot) {
        return res.status(400).json({
            success: false,
            message: "Sorry! Orders are only available before 10:30 AM and between 3:00 PM - 5:30 PM."
        });
    }

    const currentSlot = isMorningSlot ? 'morning' : 'evening';

    // 2. DATABASE LOGIC: Save to Firestore (Normalized)
    try {
        const today = new Date().toISOString().split('T')[0];
        const dailyStatsRef = db.collection('daily_stats').doc(today);
        const ordersRef = db.collection('orders');

        let message = `${type} ordered!`;

        // Run a Transaction to ensure counts are accurate and enforce limits
        await db.runTransaction(async (t) => {
            const doc = await t.get(dailyStatsRef);

            let duplicate = false;
            // Check for existing orders in the current slot
            if (doc.exists) {
                const data = doc.data();
                const orders = data.orders || [];
                const existingOrderIndex = orders.findIndex(o => {
                    const isUser = o.userId === uid;
                    const inSlot = isInSlot(o.timestamp, currentSlot);
                    return isUser && inSlot;
                });
                if (existingOrderIndex !== -1) duplicate = true;
            }

            if (duplicate) {
                throw new Error("ALREADY_ORDERED");
            }

            const orderData = {
                userId: uid,
                email,
                userName: displayName || email,
                type,
                timestamp: new Date().toISOString()
            };

            // Perform Updates
            if (!doc.exists) {
                // Initialize daily doc if first order of the day
                t.set(dailyStatsRef, {
                    tea: type === 'tea' ? 1 : 0,
                    coffee: type === 'coffee' ? 1 : 0,
                    juice: type === 'juice' ? 1 : 0,
                    orders: [orderData],
                    lastUpdated: new Date().toISOString()
                });
            } else {
                // Increment counters using atomic operations
                t.update(dailyStatsRef, {
                    [type]: admin.firestore.FieldValue.increment(1),
                    // We keep updating this array for Admin Dashboard (so we don't break it)
                    orders: admin.firestore.FieldValue.arrayUnion(orderData),
                    lastUpdated: new Date().toISOString()
                });
            }

            // WRITE TO NEW COLLECTION (Normalized)
            const newOrderDoc = ordersRef.doc(); // Auto-ID
            t.set(newOrderDoc, {
                ...orderData,
                date: today // Helper field
            });
        });

        res.status(200).json({ success: true, message });

    } catch (error) {
        if (error.message === "ALREADY_ORDERED") {
            return res.status(400).json({
                success: false,
                message: "You have already placed an order for this slot."
            });
        }
        console.error("Order failed:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Retrieves the current user's orders for Today.
 * Used for the 'You ordered X' feedback on the Dashboard.
 */
exports.getMyOrders = async (req, res) => {
    const { uid } = req.user;
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Optimized query on the normalized collection
        const snapshot = await db.collection('orders')
            .where('userId', '==', uid)
            .where('timestamp', '>=', todayISO)
            .orderBy('timestamp', 'desc')
            .get();

        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ orders: userOrders });
    } catch (error) {
        console.error("Fetch user orders error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

/**
 * Retrieves full order history for a user with pagination.
 * Used for the Order History page.
 */
exports.getUserOrderHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const type = req.query.type || 'all';

        // Auth check: Only allow users to view their own data (unless admin)
        if (req.user.uid !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        let query = db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc');

        if (type !== 'all') {
            query = query.where('type', '==', type);
        }

        // Note: Firestore offset can be expensive. For very large datasets, cursor-based pagination is better.
        const snapshot = await query.limit(limit + offset).get();

        const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const paginatedOrders = allDocs.slice(offset, offset + limit);
        const totalOrders = allDocs.length;
        const hasMore = allDocs.length > offset + limit;

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
};

/**
 * Calculates aggregated stats (total counts, favorite drink) for a user.
 */
exports.getUserStats = async (req, res) => {
    try {
        const { uid } = req.params;

        if (req.user.uid !== uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Only select the 'type' field to save bandwidth
        const snapshot = await db.collection('orders')
            .where('userId', '==', uid)
            .select('type')
            .get();

        let totalOrders = 0;
        const typeCounts = { tea: 0, coffee: 0, juice: 0 };

        snapshot.docs.forEach(doc => {
            const type = doc.data().type;
            totalOrders++;
            if (typeCounts[type] !== undefined) {
                typeCounts[type]++;
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
};
