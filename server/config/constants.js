// server/config/constants.js

const ORDER_TIME_SLOTS = {
    MORNING: {
        END_HOUR: 10,
        END_MINUTE: 30, // 10:30 AM
        TOTAL_MINUTES: 10 * 60 + 30
    },
    EVENING: {
        START_HOUR: 15, // 3:00 PM
        START_MINUTE: 0,
        END_HOUR: 17,   // 5:30 PM
        END_MINUTE: 30,
        START_TOTAL_MINUTES: 15 * 60,
        END_TOTAL_MINUTES: 17 * 60 + 30
    }
};

module.exports = {
    ORDER_TIME_SLOTS
};
