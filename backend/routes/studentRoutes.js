// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateText } = require('../geminiService'); // Use the generic text generation

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
    const timetableResult = await pool.query(
      `SELECT subject, start_time, end_time FROM timetables WHERE user_id = $1 ORDER BY start_time`,
      [userId]
    );
    if (timetableResult.rows.length === 0) {
      return res.status(404).json({ error: 'No timetable found for this student.' });
    }

    let timetableString = "Student's Weekly Schedule:\n";
    timetableResult.rows.forEach(entry => {
      const startTime = new Date(entry.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endTime = new Date(entry.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const day = new Date(entry.start_time).toLocaleDateString('en-US', { weekday: 'long' });
      timetableString += `- ${day}: ${entry.subject} from ${startTime} to ${endTime}\n`;
    });

    // ============================================
    // ✅ --- UPDATED PROMPT: Ask for Suggestions ---
    // ============================================
    const prompt = `
      Analyze the following student timetable and provide brief, constructive feedback (2-3 sentences max).
      Focus on workload balance, potential stress points, and offer one simple study tip.
      AFTER the feedback, provide exactly 2 actionable, specific suggestions related to the analysis,
      each on a new line starting with "* ".

      Example Output Format:
      This schedule looks busy... (your analysis here).
      * Suggestion 1 text here.
      * Suggestion 2 text here.

      Timetable:
      ---
      ${timetableString}
      ---
    `;
    // ============================================


    // Call the Gemini API
    const fullResponse = await generateText(prompt);

    // ============================================
    // ✅ --- Parse Feedback and Suggestions ---
    // ============================================
    let feedbackText = fullResponse; // Default to full response
    let suggestionsList = []; // Standard JavaScript array initialization

    const suggestionMarker = "\n* "; // Look for lines starting with "* " after a newline
    const firstSuggestionIndex = fullResponse.indexOf(suggestionMarker);

    if (firstSuggestionIndex !== -1) {
        feedbackText = fullResponse.substring(0, firstSuggestionIndex).trim(); // Text before suggestions
        // Extract lines starting with "* "
        suggestionsList = fullResponse.substring(firstSuggestionIndex)
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('* '))
            .map(line => line.substring(2).trim()); // Remove "* " prefix
    }
    // ============================================


    // Send feedback AND suggestions back
    res.json({ success: true, feedback: feedbackText, suggestions: suggestionsList });

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    res.status(500).json({ error: 'Failed to generate AI feedback.' });
  }
});

// Generate Study Plan route (keep as is)
router.post('/generate-plan', authMiddleware, isStudent, async (req, res) => {
  // ... (keep existing code)
  const { prompt } = req.body;
  if (!prompt) { return res.status(400).json({ error: 'A prompt is required to generate a plan.' }); }
  try {
    const plan = await generateText( /* ... study plan prompt ... */ `Create a simple, step-by-step study plan... Request: "${prompt}"`);
    res.json({ success: true, plan: plan });
  } catch (error) { console.error('Error generating AI study plan:', error); res.status(500).json({ error: 'Failed to generate study plan.' }); }
});


module.exports = router;