const webpush = require('web-push');
const cron = require('node-cron');
const pool = require('./db');
require('dotenv').config();

// 1. Configure Keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (!publicVapidKey || !privateVapidKey || !vapidEmail) {
    console.error('VAPID keys are missing in .env file');
} else {
    webpush.setVapidDetails(
        vapidEmail,
        publicVapidKey,
        privateVapidKey
    );
}

// 2. The Cron Job (Runs every minute)
const startNotificationService = () => {
    console.log('Notification Service Started...');
    
    cron.schedule('* * * * *', async () => {
        // console.log('Checking for upcoming classes...');
        
        // Logic: Find classes starting in exactly 10 minutes
        // We check if the day of week matches AND the time matches
        const query = `
            SELECT t.subject, t.location, s.endpoint, s.keys_auth, s.keys_p256dh 
            FROM timetables t
            JOIN notification_subscriptions s ON t.user_id = s.user_id
            WHERE 
            -- Check if same day of week (0-6, Sunday is 0)
            EXTRACT(DOW FROM t.start_time) = EXTRACT(DOW FROM NOW())
            AND 
            -- Check if time matches 10 minutes from now (HH:MM)
            TO_CHAR(t.start_time, 'HH24:MI') = TO_CHAR(NOW() + INTERVAL '10 minutes', 'HH24:MI')
        `;

        try {
            const result = await pool.query(query);
            
            if (result.rows.length > 0) {
                console.log(`Found ${result.rows.length} classes starting soon.`);
            }

            result.rows.forEach(row => {
                const pushSubscription = {
                    endpoint: row.endpoint,
                    keys: {
                        auth: row.keys_auth,
                        p256dh: row.keys_p256dh
                    }
                };

                const payload = JSON.stringify({
                    title: 'Class Reminder! 🎓',
                    body: `Your ${row.subject} class starts in 10 mins${row.location ? ` in ${row.location}` : ''}.`,
                    icon: '/icon.png' // Ensure this exists in public folder or remove
                });

                webpush.sendNotification(pushSubscription, payload)
                    .catch(err => {
                        console.error('Error sending notification:', err);
                        if (err.statusCode === 410) {
                            // Subscription is gone, delete from DB
                            pool.query('DELETE FROM notification_subscriptions WHERE endpoint = $1', [row.endpoint]);
                        }
                    });
            });
        } catch (err) {
            console.error('Error in notification cron:', err);
        }
    });

    // 3. Nightly Summary (Runs every day at 9 PM)
    cron.schedule('0 21 * * *', async () => {
        console.log('Running nightly schedule summary...');
        
        const query = `
            SELECT 
                s.endpoint, s.keys_auth, s.keys_p256dh,
                json_agg(json_build_object('subject', t.subject, 'time', TO_CHAR(t.start_time, 'HH24:MI'))) as classes
            FROM timetables t
            JOIN notification_subscriptions s ON t.user_id = s.user_id
            WHERE 
                EXTRACT(DOW FROM t.start_time) = EXTRACT(DOW FROM NOW() + INTERVAL '1 day')
            GROUP BY s.endpoint, s.keys_auth, s.keys_p256dh
        `;

        try {
            const result = await pool.query(query);
            
            result.rows.forEach(row => {
                const classes = row.classes;
                if (!classes || classes.length === 0) return;

                // Sort by time
                classes.sort((a, b) => a.time.localeCompare(b.time));

                const pushSubscription = {
                    endpoint: row.endpoint,
                    keys: { auth: row.keys_auth, p256dh: row.keys_p256dh }
                };

                // Create a nice summary string
                const classCount = classes.length;
                const classList = classes.map(c => `${c.subject} (${c.time})`).join(', ');
                
                const payload = JSON.stringify({
                    title: '📅 Tomorrow\'s Schedule',
                    body: `You have ${classCount} classes tomorrow: ${classList}`,
                    icon: '/icon.png'
                });

                webpush.sendNotification(pushSubscription, payload)
                    .catch(err => {
                        console.error('Error sending nightly notification:', err);
                        if (err.statusCode === 410) {
                            pool.query('DELETE FROM notification_subscriptions WHERE endpoint = $1', [row.endpoint]);
                        }
                    });
            });
        } catch (err) {
            console.error('Error in nightly summary:', err);
        }
    });
};

module.exports = { startNotificationService };