// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateText } = require('../geminiService'); // Use the generic text generation for now

// Middleware to check if the user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to students only' });
  }
  next();
};

// 🛡️ All routes in this file are protected and require a student role

// Endpoint for AI Study Feedback
router.post('/ai-feedback', authMiddleware, isStudent, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch the student's timetable from the database
    const timetableResult = await pool.query(
      `SELECT subject, start_time, end_time FROM timetables WHERE user_id = $1 ORDER BY start_time`,
      [userId]
    );

    if (timetableResult.rows.length === 0) {
      return res.status(404).json({ error: 'No timetable found for this student.' });
    }

    // 2. Format the timetable data into a readable string for the AI
    let timetableString = "Student's Weekly Schedule:\n";
    timetableResult.rows.forEach(entry => {
      // Format start and end times nicely (you might adjust this formatting)
      const startTime = new Date(entry.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endTime = new Date(entry.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const day = new Date(entry.start_time).toLocaleDateString('en-US', { weekday: 'long' }); // Get day name

      timetableString += `- ${day}: ${entry.subject} from ${startTime} to ${endTime}\n`;
    });

    // 3. Create the prompt for Gemini
    const prompt = `
      Analyze the following student timetable and provide brief, constructive feedback (2-3 sentences max).
      Focus on workload balance, potential stress points (like too many difficult subjects together),
      and offer one simple study tip related to managing this schedule.

      Timetable:
      ---
      ${timetableString}
      ---
    `;

    // 4. Call the Gemini API
    const feedback = await generateText(prompt);

    // 5. Send the feedback back to the client
    res.json({ success: true, feedback: feedback });

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    res.status(500).json({ error: 'Failed to generate AI feedback.' });
  }
});

module.exports = router;