// server/config/constants.js
// Configuration constants for the application

/**
 * Time slots for ordering beverages.
 * Defines the window during which orders are accepted for the morning and evening batches.
 */
const ORDER_TIME_SLOTS = {
    MORNING: {
        END_HOUR: 10,
        END_MINUTE: 30, // Orders close at 10:30 AM
        TOTAL_MINUTES: 10 * 60 + 30 // Minute of day for easier comparison
    },
    EVENING: {
        START_HOUR: 15, // Orders open at 3:00 PM
        START_MINUTE: 0,
        END_HOUR: 17,   // Orders close at 5:30 PM
        END_MINUTE: 30,
        START_TOTAL_MINUTES: 15 * 60,
        END_TOTAL_MINUTES: 17 * 60 + 30
    }
};

module.exports = {
    ORDER_TIME_SLOTS
};
