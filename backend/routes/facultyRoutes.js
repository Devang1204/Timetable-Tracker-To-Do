// routes/facultyRoutes.js
// Full routes including schedule generation, manual create/update, TA utilities, and analysis/report prompts.
// Adds afternoon time normalization so schedule generation & manual edits stay consistent.

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateFacultyTimetable, generateText } = require('../geminiService');

function normalizeAfternoonHHMM(timeString) {
  if (!timeString) return null;
  const m = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = m[2];
  if (h >= 1 && h <= 5) h += 12; // 1–5 => 13–17
  return `${String(h).padStart(2, '0')}:${mm}`;
}

function getNextDateForDayAndTime(dayIndex, timeString) {
  if (dayIndex === undefined || dayIndex < 0 || dayIndex > 6 || !timeString) return null;
  const fixed = normalizeAfternoonHHMM(timeString) || timeString;
  const parts = fixed.match(/(\d+):(\d+)/);
  if (!parts) return null;
  const hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const mapDay = [1, 2, 3, 4, 5]; // Mon..Fri
  const jsTargetDay = mapDay[dayIndex];
  if (jsTargetDay === undefined) return null;
  const now = new Date();
  let offset = jsTargetDay - now.getDay();
  if (offset < 0) offset += 7;
  const d = new Date(now);
  d.setDate(now.getDate() + offset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const isFaculty = (req, res, next) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to faculty only' });
  }
  next();
};

// Generate schedule (AI)
router.post('/generate-schedule', authMiddleware, isFaculty, async (req, res) => {
  const constraints = req.body;
  if (!constraints?.subjects || !constraints?.assigneeUserId) {
    return res.status(400).json({ error: 'Missing required constraints (subjects, assigneeUserId).' });
  }
  try {
    const existing = await pool.query(
      `SELECT subject, start_time, end_time FROM timetables WHERE user_id = $1`,
      [constraints.assigneeUserId]
    );
    constraints.existingSchedule = existing.rows;
    const generated = await generateFacultyTimetable(constraints);

    if (!Array.isArray(generated)) {
      return res.json({ success: true, message: 'AI returned empty schedule.', schedule: [] });
    }

    const client = await pool.connect();
    let insertedCount = 0;
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM timetables WHERE user_id = $1', [constraints.assigneeUserId]);

      const daysMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4 };
      for (const entry of generated) {
        if (!entry?.day || !entry?.start_time || !entry?.end_time || !entry?.subject) continue;
        const dayIndex = daysMap[String(entry.day).toLowerCase()];
        if (dayIndex === undefined) continue;
        const startTime = getNextDateForDayAndTime(dayIndex, entry.start_time);
        const endTime = getNextDateForDayAndTime(dayIndex, entry.end_time);
        if (!startTime || !endTime) continue;
        if (endTime <= startTime) endTime.setDate(endTime.getDate() + 1);

        await client.query(
          `INSERT INTO timetables (user_id, role, subject, start_time, end_time, location)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [constraints.assigneeUserId, constraints.targetRole || 'faculty', entry.subject, startTime, endTime, entry.location || null]
        );
        insertedCount++;
      }
      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('Faculty transaction error:', dbErr);
      throw dbErr;
    } finally {
      client.release();
    }

    const success = insertedCount > 0;
    res.status(success ? 200 : 400).json({
      success,
      message: success
        ? `Schedule generated. ${insertedCount} entries saved.`
        : (generated.length > 0 ? 'AI generated schedule but no valid entries saved.' : 'AI returned empty schedule.'),
      schedule: generated
    });
  } catch (error) {
    console.error('gen-schedule error:', error);
    res.status(500).json({ error: `Failed to generate schedule: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Get faculty timetable (includes self + TAs)
router.get('/timetable', authMiddleware, isFaculty, async (req, res) => {
  const facultyUserId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, user_id, role, subject, start_time, end_time, location,
              is_recurring, recurring_pattern, recurring_end_date
       FROM timetables
       WHERE user_id = $1 OR user_id IN (SELECT id FROM users WHERE role = 'ta')
       ORDER BY start_time ASC`,
      [facultyUserId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch faculty timetable error:', err);
    res.status(500).json({ error: 'Error fetching faculty timetable' });
  }
});

// Manual timetable entry
router.post('/timetable', authMiddleware, isFaculty, async (req, res) => {
  const { user_id, role, subject, dayOfWeek, startTime: startRaw, endTime: endRaw, location } = req.body;
  if ([user_id, role, subject, dayOfWeek, startRaw, endRaw].some(v => v === undefined)) {
    return res.status(400).json({ error: 'Subject, dayOfWeek, startTime, endTime, user_id, and role required.' });
  }
  try {
    const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startRaw);
    const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endRaw);
    if (!startTimestamp || !endTimestamp) return res.status(400).json({ error: 'Invalid day/time format.' });
    if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);

    const result = await pool.query(
      `INSERT INTO timetables (user_id, role, subject, start_time, end_time, location)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_id, role, subject, startTimestamp, endTimestamp, location || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Faculty manual insert error:', err);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

// Update / assign class
router.put('/timetable/:id', authMiddleware, isFaculty, async (req, res) => {
  const entryId = req.params.id;
  const { subject, dayOfWeek, startTime: startRaw, endTime: endRaw, location, user_id, role } = req.body;
  if ([subject, dayOfWeek, startRaw, endRaw, user_id, role].some(v => v === undefined)) {
    return res.status(400).json({ error: "Subject, dayOfWeek, startTime, endTime, user_id, and role are required for update." });
  }
  try {
    const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startRaw);
    const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endRaw);
    if (!startTimestamp || !endTimestamp) return res.status(400).json({ error: 'Invalid day/time for update.' });
    if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);

    const result = await pool.query(
      `UPDATE timetables SET subject = $1, start_time = $2, end_time = $3, location = $4, user_id = $5, role = $6
       WHERE id = $7 RETURNING *`,
      [subject, startTimestamp, endTimestamp, location || null, user_id, role, entryId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Entry not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Faculty update error:', err);
    res.status(500).json({ error: 'Error updating timetable entry' });
  }
});

// Get all TAs
router.get('/tas', authMiddleware, isFaculty, async (_req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, email, role FROM users WHERE role = 'ta' ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    console.error('ERROR fetching TAs:', err);
    res.status(500).json({ error: 'Failed to fetch teaching assistants' });
  }
});

// Analyze Workload (AI)
router.post('/analyze-workload', authMiddleware, isFaculty, async (req, res) => {
  const facultyUserId = req.user.id;
  try {
    const timetableResult = await pool.query(
      `SELECT tt.subject, tt.start_time, tt.end_time, u.role, u.name as assignee_name, u.id as user_id
       FROM timetables tt
       JOIN users u ON tt.user_id = u.id
       WHERE tt.user_id = $1 OR tt.user_id IN (SELECT id FROM users WHERE role = 'ta')`,
      [facultyUserId]
    );
    if (timetableResult.rows.length === 0) {
      return res.status(404).json({ error: 'No timetable found for this faculty member or their TAs.' });
    }
    const lines = timetableResult.rows.map(entry => {
      return `- ${entry.assignee_name} (${entry.role}): ${entry.subject} | ${new Date(entry.start_time).toLocaleString()} → ${new Date(entry.end_time).toLocaleString()}`;
    }).join('\n');

    const prompt = `
Workload Summary Input:
${lines}

TASK:
1) A concise workload overview (max 3 sentences).
2) EXACTLY 3 actionable recommendations (each starting with "* " on its own line).

FORMAT:
Overview text...
* Recommendation 1
* Recommendation 2
* Recommendation 3
`;
    const fullResponse = await generateText(prompt);
    const marker = '\n* ';
    const firstIndex = fullResponse.indexOf(marker);
    let overview = fullResponse.trim();
    let recommendations = [];
    if (firstIndex !== -1) {
      overview = fullResponse.substring(0, firstIndex).trim();
      recommendations = fullResponse.substring(firstIndex)
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('* '))
        .map(l => l.substring(2).trim());
    }
    res.json({ success: true, analysis: overview, recommendations });
  } catch (error) {
    console.error('ERROR workload analysis:', error);
    res.status(500).json({ error: `Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Teaching Report (AI)
router.post('/teaching-report', authMiddleware, isFaculty, async (req, res) => {
  const facultyUserId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT subject, start_time, end_time, location FROM timetables WHERE user_id = $1 ORDER BY start_time`,
      [facultyUserId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No timetable found.' });

    const lines = result.rows.map(entry => {
      return `- ${entry.subject} @ ${entry.location || 'N/A'} | ${new Date(entry.start_time).toLocaleString()} → ${new Date(entry.end_time).toLocaleString()}`;
    }).join('\n');

    const prompt = `
Teaching Sessions:
${lines}

TASK:
1) A concise weekly teaching summary (max 4 sentences).
2) EXACTLY 3 improvement suggestions (preface each with "* ").
3) Avoid repeating session listings; focus on insights.

FORMAT:
Summary...
* Suggestion 1
* Suggestion 2
* Suggestion 3
`;
    const fullResponse = await generateText(prompt);
    const marker = '\n* ';
    const firstIndex = fullResponse.indexOf(marker);
    let summary = fullResponse.trim();
    let recommendations = [];
    if (firstIndex !== -1) {
      summary = fullResponse.substring(0, firstIndex).trim();
      recommendations = fullResponse.substring(firstIndex)
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('* '))
        .map(l => l.substring(2).trim());
    }
    res.json({ success: true, report: summary, recommendations });
  } catch (error) {
    console.error('ERROR teaching report:', error);
    res.status(500).json({ error: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Suggest TA Assignments (AI)
router.post('/suggest-ta-assignments', authMiddleware, isFaculty, async (req, res) => {
  const facultyUserId = req.user.id;
  try {
    const taResult = await pool.query(`SELECT id, name, role FROM users WHERE role = 'ta'`);
    const tas = taResult.rows;
    if (tas.length === 0) return res.status(404).json({ error: 'No TAs found.' });

    const classesResult = await pool.query(
      `SELECT tt.id, tt.subject, tt.start_time, tt.end_time, u.name as owner_name, u.role
       FROM timetables tt
       JOIN users u ON tt.user_id = u.id
       WHERE tt.user_id = $1
       ORDER BY tt.start_time`,
      [facultyUserId]
    );
    const classes = classesResult.rows;

    const prompt = `
We have classes and available TAs.

TAs:
${JSON.stringify(tas, null, 2)}

Classes:
${JSON.stringify(classes, null, 2)}

TASK:
Assign suitable TA(s) to classes based on balancing workload and subject diversity.

OUTPUT FORMAT:
1) Short overview (max 3 sentences).
2) EXACTLY 5 bullet assignments (each starts with "* " and includes Class ID → TA Name).

FORMAT:
Overview...
* Class 12 → TA Priya
* Class 18 → TA Arjun
* ...
`;
    const fullResponse = await generateText(prompt);
    const marker = '\n* ';
    const firstIndex = fullResponse.indexOf(marker);
    let overview = fullResponse.trim();
    let recommendations = [];
    if (firstIndex !== -1) {
      overview = fullResponse.substring(0, firstIndex).trim();
      recommendations = fullResponse.substring(firstIndex)
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('* '))
        .map(l => l.substring(2).trim());
    }
    res.json({ success: true, analysis: overview, recommendations });
  } catch (error) {
    console.error('ERROR TA suggestions:', error);
    res.status(500).json({ error: `Failed to generate TA suggestions: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Delete TA and reassign classes
router.delete('/tas/:id', authMiddleware, isFaculty, async (req, res) => {
  const taIdToDelete = req.params.id;
  const facultyUserId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const taCheck = await pool.query('SELECT role FROM users WHERE id = $1', [taIdToDelete]);
    if (taCheck.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'TA user not found.' }); }
    if (taCheck.rows[0].role !== 'ta') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'User is not a TA.' }); }

    const updateResult = await pool.query(`UPDATE timetables SET user_id = $1, role = 'faculty' WHERE user_id = $2`, [facultyUserId, taIdToDelete]);
    const deleteResult = await client.query('DELETE FROM users WHERE id = $1', [taIdToDelete]);
    if (deleteResult.rowCount === 0) throw new Error('Failed deletion after reassignment.');
    await client.query('COMMIT');
    res.status(200).json({ success: true, message: `TA deleted and ${updateResult.rowCount} classes reassigned.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR delete TA:', err);
    res.status(500).json({ error: 'Failed to delete TA or reassign classes.' });
  } finally {
    client.release();
  }
});

// Delete a timetable entry (faculty)
router.delete('/timetable/:id', authMiddleware, isFaculty, async (req, res) => {
  const entryId = req.params.id;
  try {
    const result = await pool.query(`DELETE FROM timetables WHERE id = $1 RETURNING id`, [entryId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Timetable entry not found.' });
    res.status(200).json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('ERROR delete timetable entry:', err);
    res.status(500).json({ error: 'Error deleting timetable entry.' });
  }
});

module.exports = router;