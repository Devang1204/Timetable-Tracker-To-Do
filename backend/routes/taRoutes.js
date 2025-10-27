// routes/taRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateText } = require('../geminiService');

// Middleware to check if the user is a TA
const isTa = (req, res, next) => {
  if (req.user.role !== 'ta') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to TAs only' });
  }
  next();
};

// 🛡️ All routes in this file are protected and require a TA role

// Analyze Schedule (for TAs) - AI Feature
router.post('/analyze-schedule', authMiddleware, isTa, async (req, res) => {
  console.log('--- ENTERED POST /api/ta/analyze-schedule ---');
  const userId = req.user.id;
  try {
    console.log(`Fetching schedule for TA analysis (User ${userId})...`);
    const timetableResult = await pool.query(
      `SELECT subject, start_time, end_time FROM timetables WHERE user_id = $1 ORDER BY start_time`,
      [userId]
    );
    if (timetableResult.rows.length === 0) {
      return res.status(404).json({ error: 'No schedule found for this TA.' });
    }
    let timetableString = "Teaching Assistant's Weekly Schedule:\n";
    timetableResult.rows.forEach(entry => {
      timetableString += `- ${entry.subject} (from ${new Date(entry.start_time).toLocaleString()} to ${new Date(entry.end_time).toLocaleString()})\n`;
    });
    const prompt = `
      Analyze the following Teaching Assistant's schedule.
      Provide brief, constructive feedback (2-3 sentences) on their workload,
      focusing on balancing teaching duties and their own studies.

      Schedule:
      ---
      ${timetableString}
      ---
    `;
    console.log('Calling Gemini for TA schedule analysis...');
    const analysis = await generateText(prompt);
    console.log('TA schedule analysis received.');
    res.json({ success: true, analysis: analysis });
  } catch (error) {
    console.error('--- ERROR in POST /api/ta/analyze-schedule ---:', error);
    res.status(500).json({ error: `Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});


// --- Availability Management Routes ---

// GET all unavailable slots for the logged-in TA
router.get('/availability', authMiddleware, isTa, async (req, res) => {
  console.log('--- ENTERED GET /api/ta/availability ---');
  const userId = req.user.id;
  console.log(`Fetching availability for TA ${userId}...`);
  try {
    const result = await pool.query(
      `SELECT id, day_of_week, start_time, end_time, reason FROM availability WHERE user_id = $1 ORDER BY
       CASE day_of_week
         WHEN 'Monday' THEN 1
         WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5
         WHEN 'Saturday' THEN 6
         WHEN 'Sunday' THEN 7
         ELSE 8
       END, start_time`, // Sort by day then time
      [userId]
    );
    console.log(`Found ${result.rows.length} availability slots.`);
    res.json(result.rows);
  } catch (err) {
    console.error("--- ERROR in GET /api/ta/availability ---:", err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST a new unavailable slot
router.post('/availability', authMiddleware, isTa, async (req, res) => {
  const userId = req.user.id;
  // Frontend sends day_of_week (string), start_time (HH:MM), end_time (HH:MM)
  const { day_of_week, start_time, end_time, reason } = req.body;
  console.log('--- ENTERED POST /api/ta/availability ---');
  console.log('Request Body:', req.body);

  // Basic Validation
  if (!day_of_week || !start_time || !end_time) {
     return res.status(400).json({ error: 'Day, start time, and end time are required.'});
  }
  // Optional: Add regex validation for time format /^([01]\d|2[0-3]):([0-5]\d)$/

  try {
    console.log('Attempting TA availability insert...');
    // The database 'TIME' type should accept "HH:MM" string directly
    const result = await pool.query(
      `INSERT INTO availability (user_id, day_of_week, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, day_of_week, start_time, end_time, reason]
    );
    console.log('TA availability insert successful:', result.rows[0]);
    res.status(201).json(result.rows[0]); // Send back created object
  } catch (err) {
    console.error("--- ERROR in POST /api/ta/availability ---:", err);
    res.status(500).json({ error: 'Failed to add availability' });
  }
});

// DELETE an unavailable slot
router.delete('/availability/:id', authMiddleware, isTa, async (req, res) => {
  console.log('--- ENTERED DELETE /api/ta/availability/:id ---');
  const userId = req.user.id;
  const availabilityId = req.params.id;
  console.log(`Attempting to delete availability ${availabilityId} for TA ${userId}`);

  try {
    const result = await pool.query(
      `DELETE FROM availability WHERE id = $1 AND user_id = $2 RETURNING id`,
      [availabilityId, userId]
    );
    if (result.rowCount === 0) {
      console.log(`Availability ${availabilityId} not found or user ${userId} not authorized.`);
      return res.status(404).json({ error: "Entry not found or user not authorized" });
    }
    console.log(`Availability ${availabilityId} deleted successfully.`);
    res.status(200).json({ success: true, message: 'Availability entry deleted' });
  } catch (err) {
    console.error(`--- ERROR in DELETE /api/ta/availability/${availabilityId} ---:`, err);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
});

module.exports = router;