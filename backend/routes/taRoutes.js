// routes/taRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateText } = require('../geminiService');

const isTa = (req, res, next) => {
  if (req.user.role !== 'ta') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to TAs only' });
  }
  next();
};

// Analyze TA schedule (PROMPT REWRITTEN)
router.post('/analyze-schedule', authMiddleware, isTa, async (req, res) => {
  const userId = req.user.id;
  try {
    const timetableResult = await pool.query(
      `SELECT subject, start_time, end_time FROM timetables WHERE user_id = $1 ORDER BY start_time`,
      [userId]
    );
    
    // Even if empty, we can give general advice
    const lines = timetableResult.rows.length > 0 
        ? timetableResult.rows.map(entry => `- ${entry.subject} | ${new Date(entry.start_time).toLocaleString()} → ${new Date(entry.end_time).toLocaleString()}`).join('\n')
        : "No classes scheduled yet.";

    const prompt = `
TA Teaching Sessions:
${lines}

TASK:
1) Provide a workload summary (max 2 sentences).
2) Provide EXACTLY 3 specific balance tips (each starts with "* ").

FORMAT:
Summary...
* Tip 1
* Tip 2
* Tip 3
`;
    const fullResponse = await generateText(prompt);
    
    // Parse response
    const marker = '\n* ';
    const firstIndex = fullResponse.indexOf(marker);
    let analysis = fullResponse.trim();
    let tips = [];
    
    if (firstIndex !== -1) {
      analysis = fullResponse.substring(0, firstIndex).trim();
      tips = fullResponse.substring(firstIndex)
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('* '))
        .map(l => l.substring(2).trim());
    }

    res.json({ success: true, analysis, tips });
  } catch (error) {
    console.error('ERROR TA analyze-schedule:', error);
    res.status(500).json({ error: `Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Preparation Tips (AI)
router.post('/preparation-tips', authMiddleware, isTa, async (req, res) => {
    const userId = req.user.id;
    try {
        // Get schedule context
        const timetableResult = await pool.query(
            `SELECT subject, start_time FROM timetables WHERE user_id = $1 ORDER BY start_time LIMIT 5`,
            [userId]
        );
        const subjects = [...new Set(timetableResult.rows.map(r => r.subject))].join(', ') || "general subjects";

        const prompt = `
        I am a TA for: ${subjects}.
        Give me 3-4 concise, actionable preparation tips for my upcoming tutorials/labs.
        
        FORMAT:
        Overview sentence.
        * Tip 1
        * Tip 2
        * Tip 3
        `;
        
        const fullResponse = await generateText(prompt);
        
        // Parse response
        const marker = '\n* ';
        const firstIndex = fullResponse.indexOf(marker);
        let analysis = fullResponse.trim();
        let tips = [];
        
        if (firstIndex !== -1) {
            analysis = fullResponse.substring(0, firstIndex).trim();
            tips = fullResponse.substring(firstIndex)
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('* '))
                .map(l => l.substring(2).trim());
        }
        
        res.json({ success: true, analysis, tips });
    } catch (error) {
        console.error('ERROR TA prep tips:', error);
        res.status(500).json({ error: 'Failed to generate tips' });
    }
});

// Time Management (AI)
router.post('/time-management', authMiddleware, isTa, async (req, res) => {
    try {
        const prompt = `
        Give me 3 concise time management strategies specifically for a University Teaching Assistant who is also a student.
        Focus on balancing grading, teaching, and personal study.
        
        FORMAT:
        Overview sentence.
        * Strategy 1
        * Strategy 2
        * Strategy 3
        `;
        
        const fullResponse = await generateText(prompt);
        
        // Parse response
        const marker = '\n* ';
        const firstIndex = fullResponse.indexOf(marker);
        let analysis = fullResponse.trim();
        let tips = [];
        
        if (firstIndex !== -1) {
            analysis = fullResponse.substring(0, firstIndex).trim();
            tips = fullResponse.substring(firstIndex)
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('* '))
                .map(l => l.substring(2).trim());
        }
        
        res.json({ success: true, analysis, tips });
    } catch (error) {
        console.error('ERROR TA time management:', error);
        res.status(500).json({ error: 'Failed to generate strategies' });
    }
});

// Career Guidance (AI)
router.post('/career-guidance', authMiddleware, isTa, async (req, res) => {
    try {
        const prompt = `
        Give me 3 concise career development tips for a Teaching Assistant looking to become a Professor or Industry Professional.
        
        FORMAT:
        Overview sentence.
        * Tip 1
        * Tip 2
        * Tip 3
        `;
        
        const fullResponse = await generateText(prompt);
        
        // Parse response
        const marker = '\n* ';
        const firstIndex = fullResponse.indexOf(marker);
        let analysis = fullResponse.trim();
        let tips = [];
        
        if (firstIndex !== -1) {
            analysis = fullResponse.substring(0, firstIndex).trim();
            tips = fullResponse.substring(firstIndex)
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('* '))
                .map(l => l.substring(2).trim());
        }
        
        res.json({ success: true, analysis, tips });
    } catch (error) {
        console.error('ERROR TA career guidance:', error);
        res.status(500).json({ error: 'Failed to generate guidance' });
    }
});

// Availability routes (unchanged except clarity in logs)
router.get('/availability', authMiddleware, isTa, async (req, res) => {
  const userId = req.user.id;
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
        END, start_time`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('ERROR get availability:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

router.post('/availability', authMiddleware, isTa, async (req, res) => {
  const userId = req.user.id;
  const { day_of_week, start_time, end_time, reason } = req.body;
  if (!day_of_week || !start_time || !end_time) {
    return res.status(400).json({ error: 'Day, start time, and end time are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO availability (user_id, day_of_week, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, day_of_week, start_time, end_time, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('ERROR post availability:', err);
    res.status(500).json({ error: 'Failed to add availability' });
  }
});

router.delete('/availability/:id', authMiddleware, isTa, async (req, res) => {
  const userId = req.user.id;
  const availabilityId = req.params.id;
  try {
    const result = await pool.query(
      `DELETE FROM availability WHERE id = $1 AND user_id = $2 RETURNING id`,
      [availabilityId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entry not found or user not authorized" });
    }
    res.status(200).json({ success: true, message: 'Availability entry deleted' });
  } catch (err) {
    console.error('ERROR delete availability:', err);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
});

module.exports = router;