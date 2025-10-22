// notificationService.js
const cron = require('node-cron');
const pool = require('./db'); // Use the shared database pool

// Schedule a task to run every minute
// Cron syntax: * * * * * * (second, minute, hour, day of month, month, day of week)
// '*' means 'every'
cron.schedule('* * * * *', async () => {
  console.log('⏰ Checking for upcoming classes...');

  try {
    // 1. Get the current time and time 10 minutes from now
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes * 60 seconds * 1000 ms

    // 2. Query the database for classes starting between now and 10 minutes later
    const result = await pool.query(
      `SELECT tt.id, tt.subject, tt.start_time, u.email
       FROM timetables tt
       JOIN users u ON tt.user_id = u.id
       WHERE tt.start_time > $1 AND tt.start_time <= $2`,
      [now, tenMinutesLater]
    );

    if (result.rows.length > 0) {
      console.log(`🔔 Found ${result.rows.length} classes starting soon:`);
      result.rows.forEach(entry => {
        const startTime = new Date(entry.start_time).toLocaleTimeString('en-US');
        console.log(`   - User: ${entry.email}, Subject: ${entry.subject}, Starts at: ${startTime}`);

        // --- TODO: Add Push Notification Logic Here ---
        // This is where you would integrate with a service like Firebase Cloud Messaging (FCM)
        // or Web Push API to send a real notification to the user's device.
        // For now, we just log to the console.
      });
    } else {
      console.log('   -> No classes starting in the next 10 minutes.');
    }

  } catch (err) {
    console.error('❌ Error checking for notifications:', err);
  }
});

console.log('✅ Notification service started. Will check for classes every minute.');

// Export something (even empty) so the file can be required
module.exports = {};