// server/controllers/noticeController.js
// Controller for handling Notices (Announcements) and Polls
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Fetches a paginated list of notices.
 * Ordered by timestamp descending (newest first).
 */
exports.getNotices = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const offset = parseInt(req.query.offset) || 0;

        const snapshot = await db.collection('notices')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .offset(offset)
            .get();

        const notices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(notices);
    } catch (error) {
        console.error("Notices fetch error:", error);
        res.status(500).json({ error: "Failed to fetch notices" });
    }
};

/**
 * Creates a new notice or poll.
 * If 'pollOptions' are provided, initializes poll data structures.
 */
exports.createNotice = async (req, res) => {
    const { title, message, pollOptions, allowMultiple } = req.body;
    const { email, displayName } = req.user;

    try {
        const noticeData = {
            title,
            message,
            author: email,
            authorName: displayName || email,
            timestamp: new Date().toISOString(),
            type: req.body.type || "general",
            isPinned: false,
            updatedAt: new Date().toISOString()
        };

        // Add poll data if pollOptions are provided
        if (pollOptions && Array.isArray(pollOptions) && pollOptions.length >= 2) {
            noticeData.isPoll = true;
            noticeData.allowMultiple = !!allowMultiple; // Store flag
            noticeData.pollOptions = pollOptions.map(option => ({
                text: option,
                votes: 0
            }));
            noticeData.voters = []; // Legacy support
            noticeData.votes = {}; // Initialize votes map (stores user choices)
        }

        await db.collection('notices').add(noticeData);

        res.status(200).json({ success: true, message: "Notice posted!" });
    } catch (error) {
        console.error("Notice post error:", error);
        res.status(500).json({ error: "Failed to post notice" });
    }
};

/**
 * Updates an existing notice.
 */
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        await db.collection('notices').doc(id).update(updates);
        res.status(200).json({ success: true, message: "Notice updated!" });
    } catch (error) {
        console.error("Notice update error:", error);
        res.status(500).json({ error: "Failed to update notice" });
    }
};

/**
 * Deletes a notice by ID.
 */
exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('notices').doc(id).delete();
        res.status(200).json({ success: true, message: "Notice deleted!" });
    } catch (error) {
        console.error("Notice delete error:", error);
        res.status(500).json({ error: "Failed to delete notice" });
    }
};

/**
 * Handles voting on a poll.
 * Uses a transaction to ensure vote consistency and prevent race conditions.
 * Supports both single-choice and multi-choice polls.
 */
exports.voteOnPoll = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionIndex } = req.body; // optionIndex can be null (not used much anymore)
        const { uid } = req.user;

        const noticeRef = db.collection('notices').doc(id);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(noticeRef);

            if (!doc.exists) {
                throw new Error("Notice not found");
            }

            const data = doc.data();

            if (!data.isPoll || !data.pollOptions) {
                throw new Error("This notice is not a poll");
            }

            // votes is now an object: { [uid]: optionIndex (number) OR [index1, index2] (array) }
            const votes = data.votes || {};
            const pollOptions = [...data.pollOptions];
            const allowMultiple = !!data.allowMultiple;

            let previousVote = votes[uid];

            if (allowMultiple) {
                // --- Multi-select Logic ---
                if (typeof optionIndex !== 'number') throw new Error("Invalid option index");

                let userVotes = [];
                // Normalize legacy storage or fetch current array
                if (Array.isArray(previousVote)) {
                    userVotes = [...previousVote];
                } else if (typeof previousVote === 'number') {
                    userVotes = [previousVote]; // Migrate old single vote to array
                }

                const voteIdx = userVotes.indexOf(optionIndex);

                if (voteIdx > -1) {
                    // Action: Remove vote (Toggle Off)
                    userVotes.splice(voteIdx, 1);
                    pollOptions[optionIndex].votes = Math.max(0, pollOptions[optionIndex].votes - 1);
                } else {
                    // Action: Add vote (Toggle On)
                    userVotes.push(optionIndex);
                    pollOptions[optionIndex].votes += 1;
                }

                votes[uid] = userVotes;

            } else {
                // --- Single-select Logic (Legacy + Default) ---

                // 1. Remove previous vote if it exists (decrement old option count)
                if (typeof previousVote === 'number') {
                    if (pollOptions[previousVote]) {
                        pollOptions[previousVote].votes = Math.max(0, pollOptions[previousVote].votes - 1);
                    }
                } else if (Array.isArray(previousVote)) {
                    // Should not happen in single mode, but clear them just in case
                    previousVote.forEach(idx => {
                        if (pollOptions[idx]) pollOptions[idx].votes = Math.max(0, pollOptions[idx].votes - 1);
                    });
                }

                // 2. Handle new vote
                if (optionIndex === null) {
                    // Explicit removal request
                    delete votes[uid];
                } else {
                    // Validate new vote index
                    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= pollOptions.length) {
                        throw new Error("Invalid option index");
                    }

                    // If clicking the same option again, treat as deselect
                    if (previousVote === optionIndex) {
                        delete votes[uid];
                    } else {
                        // Apply new vote
                        pollOptions[optionIndex].votes += 1;
                        votes[uid] = optionIndex;
                    }
                }
            }

            // Commit transaction
            transaction.update(noticeRef, {
                pollOptions,
                votes,
                // Keep 'voters' array synced for backward compatibility (list of UIDs who voted)
                voters: Object.keys(votes)
            });
        });

        res.status(200).json({ success: true, message: "Vote updated!" });
    } catch (error) {
        console.error("Vote error:", error);
        res.status(400).json({ error: error.message || "Failed to vote" });
    }
};
