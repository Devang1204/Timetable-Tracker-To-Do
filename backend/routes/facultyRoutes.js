// routes/facultyRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateFacultyTimetable } = require('../geminiService'); // 👈 Import the new function

// Middleware to check if the logged-in user is a faculty member
const isFaculty = (req, res, next) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to faculty only' });
  }
  next();
};

// 🛡️ All routes in this file are protected and require a faculty role

// ✅ NEW ENDPOINT: AI Faculty/TA Schedule Generation
router.post('/generate-schedule', authMiddleware, isFaculty, async (req, res) => {
  const facultyUserId = req.user.id; // The faculty member making the request
  const constraints = req.body; // Expect constraints in the request body

  // Basic validation (you might add more detailed checks)
  if (!constraints || !constraints.subjects || !constraints.assigneeUserId) {
    return res.status(400).json({ error: 'Missing required constraints (subjects, assigneeUserId).' });
  }

  try {
    // 1. (Optional but recommended) Fetch existing schedule for assignee to avoid clashes
    const existingScheduleResult = await pool.query(
      `SELECT subject, start_time, end_time FROM timetables WHERE user_id = $1`,
      [constraints.assigneeUserId]
    );
    constraints.existingSchedule = existingScheduleResult.rows;

    // 2. Call Gemini to generate the schedule based on constraints
    const generatedSchedule = await generateFacultyTimetable(constraints);

    // 3. Save the generated schedule to the database
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const entry of generatedSchedule) {
        // Use the helper function from timetableRoutes (or recreate it here if needed)
        // For simplicity, assuming direct time strings for now - NEEDS REFINEMENT
         const startTime = new Date(`${entry.day} ${entry.start_time}`); // Needs refinement for correct date
         const endTime = new Date(`${entry.day} ${entry.end_time}`);     // Needs refinement for correct date

        await client.query(
          `INSERT INTO timetables (user_id, role, subject, start_time, end_time, location)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [constraints.assigneeUserId, constraints.targetRole || 'faculty', entry.subject, startTime, endTime, entry.location]
        );
      }
      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

    res.json({ success: true, message: 'Schedule generated and saved successfully!', schedule: generatedSchedule });

  } catch (error) {
    console.error("Error generating faculty schedule:", error);
    res.status(500).json({ error: 'Failed to generate schedule.' });
  }
});


// Create a manual timetable entry (for faculty or a TA they manage)
router.post('/timetable', authMiddleware, isFaculty, async (req, res) => {
  const { user_id, role, subject, start_time, end_time, location } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO timetables (user_id, role, subject, start_time, end_time, location)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, role, subject, start_time, end_time, location]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error creating faculty timetable:", err);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

// --- Other faculty routes (GET, PUT, DELETE for their timetables) would go here ---

module.exports = router;