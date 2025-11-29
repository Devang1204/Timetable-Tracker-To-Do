// routes/studentRoutes.js
// Optimized AI study feedback: caching + instant heuristic + timing info.

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateStudyFeedback, computeStableHash } = require('../geminiService');

const STUDY_FEEDBACK_CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to students only' });
  }
  next();
};

function cleanupCache() {
  const now = Date.now();
  for (const [key, val] of STUDY_FEEDBACK_CACHE.entries()) {
    if (now - val.timestamp > CACHE_TTL_MS) STUDY_FEEDBACK_CACHE.delete(key);
  }
}

function localHeuristicSummary(rows) {
  if (!rows.length) return { feedback: 'No classes found.', suggestions: [] };
  const dailyCounts = {};
  rows.forEach(r => {
    const day = new Date(r.start_time).toLocaleDateString('en-US', { weekday: 'long' });
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const busiestDay = Object.entries(dailyCounts).sort((a, b) => b[1] - a[1])[0];
  const feedback = `You have ${rows.length} upcoming sessions; busiest day appears to be ${busiestDay[0]} (${busiestDay[1]} sessions).`;
  const suggestions = [
    'Prioritize review the evening before your busiest day.',
    'Group short tasks between classes to stay ahead.'
  ];
  return { feedback, suggestions };
}

// Study Feedback
router.post('/ai-feedback', authMiddleware, isStudent, async (req, res) => {
  cleanupCache();
  const userId = req.user.id;
  const startTotal = Date.now();
  try {
    const dbStart = Date.now();
    const timetableResult = await pool.query(
      `SELECT subject, start_time, end_time
       FROM timetables
       WHERE user_id = $1
       ORDER BY start_time
       LIMIT 100`,
      [userId]
    );
    const dbMs = Date.now() - dbStart;

    if (timetableResult.rows.length === 0) {
      return res.status(404).json({ error: 'No timetable found for this student.' });
    }

    // Construct a representative week (ignoring specific dates to handle past/future data robustly)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyMap = {}; 

    timetableResult.rows.forEach(row => {
        const d = new Date(row.start_time);
        const dayName = days[d.getDay()];
        const start = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const end = new Date(row.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        if (!weeklyMap[dayName]) weeklyMap[dayName] = [];
        const entryStr = `${row.subject} (${start} - ${end})`;
        // Simple dedup in case of multiple weeks
        if (!weeklyMap[dayName].includes(entryStr)) {
            weeklyMap[dayName].push(entryStr);
        }
    });

    const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let promptLines = "";
    orderedDays.forEach(day => {
        if (weeklyMap[day] && weeklyMap[day].length > 0) {
            promptLines += `${day}:\n`;
            weeklyMap[day].forEach(c => promptLines += `  - ${c}\n`);
        }
    });

    // Use the promptLines for hash to ensure cache validity matches the new logic
    const hash = computeStableHash(timetableResult.rows); // Keep using rows for hash or use promptLines? Rows is safer for now.
    const cached = STUDY_FEEDBACK_CACHE.get(hash);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        success: true,
        feedback: cached.feedback,
        suggestions: cached.suggestions,
        cached: true,
        timings: { totalMs: Date.now() - startTotal, dbMs, aiMs: 0 }
      });
    }

    console.log("Generated AI Prompt Schedule:\n", promptLines); // Debug log

    const aiPrompt = `
You are an expert academic advisor. Your task is to analyze a student's weekly class schedule and provide personalized study feedback.

SCHEDULE:
${promptLines}

INSTRUCTIONS:
1. Analyze the distribution of classes and identify potential stress points or free blocks.
2. Provide a concise 1-2 sentence assessment of the overall workload.
3. Provide EXACTLY 2 specific, actionable study tips tailored to this schedule.

OUTPUT FORMAT:
You must return ONLY a valid JSON object. Do not include any markdown formatting or extra text.
{
  "feedback": "Your assessment here.",
  "suggestions": [
    "Tip 1",
    "Tip 2"
  ]
}
`;

    const aiStart = Date.now();
    let fullResponse = await generateStudyFeedback(aiPrompt);
    const aiMs = Date.now() - aiStart;

    console.log("AI Full Response:", fullResponse); // Debug log

    // Clean up potential markdown code blocks if the model ignores "no markdown"
    if (fullResponse) {
        fullResponse = fullResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    }

    let feedbackData;
    try {
        if (!fullResponse) throw new Error("Empty response");
        feedbackData = JSON.parse(fullResponse);
    } catch (e) {
        console.warn("AI response parsing failed or empty. Falling back to local heuristic.", e);
        const fallback = localHeuristicSummary(timetableResult.rows);
        feedbackData = {
            feedback: fallback.feedback + " (Note: AI service was temporarily unavailable, so this is a basic summary.)",
            suggestions: fallback.suggestions
        };
    }

    const { feedback, suggestions } = feedbackData;

    STUDY_FEEDBACK_CACHE.set(hash, { feedback, suggestions, timestamp: Date.now() });

    res.json({
      success: true,
      feedback,
      suggestions,
      cached: false,
      timings: { totalMs: Date.now() - startTotal, dbMs, aiMs, sessionsUsed: timetableResult.rows.length }
    });
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    res.status(500).json({ error: 'Failed to generate AI feedback.' });
  }
});

// Study Plan
router.post('/generate-plan', authMiddleware, isStudent, async (req, res) => {
  const { prompt, goal, duration, topics } = req.body;
  
  // Support both legacy 'prompt' and new structured fields
  const userGoal = goal || prompt;
  const userDuration = duration || '1 day';
  const userTopics = topics || 'General review';

  if (!userGoal) return res.status(400).json({ error: 'A goal or prompt is required to generate a plan.' });

  try {
    const planPrompt = `
REQUEST: Create a study plan for "${userGoal}".
DURATION: ${userDuration}
TOPICS/FOCUS: ${userTopics}

TASK:
Create a structured study plan spanning the requested duration.
- Break it down by Day (Day 1, Day 2, etc.) if multiple days.
- For each day, provide numbered blocks: Time Range | Task | Outcome.
- Ensure realistic breaks.
- If specific topics are listed, ensure they are covered.

OUTPUT FORMAT:
You must return ONLY a valid JSON object. Do not include any markdown formatting or extra text.
{
  "plan": [
    {
      "day": "Day 1",
      "focus": "Main focus of the day",
      "tasks": [
        { "time": "08:00-09:00", "activity": "Review [Topic]", "outcome": "Understanding of [Concept]" },
        { "time": "09:00-09:15", "activity": "Break", "outcome": "Rest" }
      ]
    }
  ],
  "note": "Motivational closing"
}
`;
    let fullResponse = await generateStudyFeedback(planPrompt);
    
    // Clean up potential markdown code blocks
    if (fullResponse) {
        fullResponse = fullResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    }

    let planData;
    try {
        planData = JSON.parse(fullResponse);
    } catch (e) {
        console.warn("AI plan parsing failed. Returning raw text.", e);
        // Fallback to raw text if JSON parsing fails, wrapped in a structure the frontend can handle (or fail gracefully)
        planData = { plan: [], note: fullResponse }; 
    }

    res.json({ success: true, plan: planData });
  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({ error: 'Failed to generate study plan.' });
  }
});

module.exports = router;