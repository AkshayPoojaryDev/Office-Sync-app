// server/controllers/noticeController.js
const admin = require('firebase-admin');
const db = admin.firestore();

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

exports.createNotice = async (req, res) => {
    const { title, message, pollOptions } = req.body;
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
            noticeData.pollOptions = pollOptions.map(option => ({
                text: option,
                votes: 0
            }));
            noticeData.voters = []; // Track who has voted
        }

        await db.collection('notices').add(noticeData);

        res.status(200).json({ success: true, message: "Notice posted!" });
    } catch (error) {
        console.error("Notice post error:", error);
        res.status(500).json({ error: "Failed to post notice" });
    }
};

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

exports.voteOnPoll = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionIndex } = req.body; // optionIndex can be null to remove vote
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

            // votes is now an object: { [uid]: optionIndex }
            const votes = data.votes || {};
            const pollOptions = [...data.pollOptions];
            const previousVote = votes[uid];

            // If user had a previous vote, decrement that option
            if (previousVote !== undefined && previousVote !== null) {
                if (pollOptions[previousVote]) {
                    pollOptions[previousVote].votes = Math.max(0, pollOptions[previousVote].votes - 1);
                }
            }

            // Handle vote removal (optionIndex is null)
            if (optionIndex === null) {
                delete votes[uid];
            } else {
                // Validate new vote
                if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= pollOptions.length) {
                    throw new Error("Invalid option index");
                }

                // Add new vote
                pollOptions[optionIndex].votes += 1;
                votes[uid] = optionIndex;
            }

            transaction.update(noticeRef, {
                pollOptions,
                votes,
                // Keep voters array for backward compatibility
                voters: Object.keys(votes)
            });
        });

        const action = optionIndex === null ? 'removed' : 'recorded';
        res.status(200).json({ success: true, message: `Vote ${action}!` });
    } catch (error) {
        console.error("Vote error:", error);
        res.status(400).json({ error: error.message || "Failed to vote" });
    }
};
