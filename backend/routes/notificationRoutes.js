const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Subscribe Route
router.post('/subscribe', authMiddleware, async (req, res) => {
    const user_id = req.user.id;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Invalid subscription object' });
    }

    try {
        await pool.query(
            `INSERT INTO notification_subscriptions (user_id, endpoint, keys_auth, keys_p256dh)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, endpoint) DO NOTHING`,
            [user_id, subscription.endpoint, subscription.keys.auth, subscription.keys.p256dh]
        );
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error('Error saving subscription:', err);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

module.exports = router;
