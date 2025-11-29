// routes/timetableRoutes.js
// Handles PDF upload + AI parsing + afternoon time normalization.

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const { PdfReader } = require('pdfreader');
const { generateTimetableFromText } = require('../geminiService');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Convert ambiguous afternoon HH:MM (01:00–05:59) to PM (13:00–17:59).
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
  const mapDay = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun mapping
  const jsTargetDay = mapDay[dayIndex];
  if (jsTargetDay === undefined) return null;
  const today = new Date();
  const currentDay = today.getDay();
  let offset = jsTargetDay - currentDay;
  if (offset < 0) offset += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function extractTextFromPdf(buffer) {
  return new Promise((resolve, reject) => {
    let allText = '';
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) reject(err);
      else if (!item) resolve(allText.trim());
      else if (item.text) allText += item.text + ' ';
    });
  });
}

// Upload + AI parse
router.post('/upload', authMiddleware, upload.single('timetableFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const userId = req.user.id;

  try {
    const extractedText = await extractTextFromPdf(req.file.buffer);
    if (!extractedText) return res.status(400).json({ error: 'Could not extract text from PDF.' });

    const aiData = await generateTimetableFromText(extractedText);
    if (!Array.isArray(aiData)) return res.status(500).json({ error: 'AI failed to generate structured timetable data.' });

    const client = await pool.connect();
    let inserted = 0;
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM timetables WHERE user_id = $1', [userId]);

      const daysMap = {
        monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6
      };

      for (const entry of aiData) {
        if (!entry?.day || !entry?.start_time || !entry?.end_time || !entry?.subject) continue;

        const dayIndex = daysMap[String(entry.day).toLowerCase()];
        if (dayIndex === undefined) continue;

        const startNorm = normalizeAfternoonHHMM(entry.start_time) || entry.start_time;
        const endNorm = normalizeAfternoonHHMM(entry.end_time) || entry.end_time;

        const startTime = getNextDateForDayAndTime(dayIndex, startNorm);
        const endTime = getNextDateForDayAndTime(dayIndex, endNorm);
        if (!startTime || !endTime) continue;
        if (endTime <= startTime) endTime.setDate(endTime.getDate() + 1);

        await client.query(
          `INSERT INTO timetables (user_id, role, subject, start_time, end_time, location)
           VALUES ($1, 'student', $2, $3, $4, $5)`,
          [userId, entry.subject, startTime, endTime, entry.location || null]
        );
        inserted++;
      }
      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('Transaction failed:', dbErr);
      throw dbErr;
    } finally {
      client.release();
    }

    if (inserted === 0 && aiData.length > 0) {
      return res.status(400).json({ success: false, message: 'AI generated data, but no valid rows were saved.' });
    }
    res.json({ success: true, message: `Timetable processed. ${inserted} entries saved!` });
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: 'Failed to process uploaded timetable.' });
  }
});

// Manual create
router.post('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  const {
    role = 'student',
    subject,
    dayOfWeek,
    startTime: startRaw,
    endTime: endRaw,
    location,
    is_recurring = false,
    recurring_pattern = null,
    recurring_end_date = null
  } = req.body;

  if ([subject, dayOfWeek, startRaw, endRaw].some(v => v === undefined)) {
    return res.status(400).json({ error: 'Subject, dayOfWeek, startTime and endTime required.' });
  }

  try {
    const startNorm = normalizeAfternoonHHMM(startRaw) || startRaw;
    const endNorm = normalizeAfternoonHHMM(endRaw) || endRaw;
    const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startNorm);
    const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endNorm);
    if (!startTimestamp || !endTimestamp) return res.status(400).json({ error: 'Invalid day/time format.' });
    if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);

    const result = await pool.query(
      `INSERT INTO timetables (user_id, role, subject, start_time, end_time, location,
                               is_recurring, recurring_pattern, recurring_end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id,user_id,role,subject,start_time,end_time,location,is_recurring,recurring_pattern,recurring_end_date`,
      [user_id, role, subject, startTimestamp, endTimestamp, location || null,
       is_recurring, recurring_pattern, recurring_end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Manual insert error:', err);
    res.status(500).json({ error: 'Error adding timetable entry' });
  }
});

// Get timetable
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, user_id, role, subject, start_time, end_time, location,
              is_recurring, recurring_pattern, recurring_end_date
       FROM timetables
       WHERE user_id = $1
       ORDER BY start_time ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Error fetching timetable' });
  }
});

// Update
router.put('/:id', authMiddleware, async (req, res) => {
  const entryId = req.params.id;
  const userId = req.user.id;
  const {
    subject,
    dayOfWeek,
    startTime: startRaw,
    endTime: endRaw,
    location,
    is_recurring,
    recurring_pattern,
    recurring_end_date
  } = req.body;

  if ([subject, dayOfWeek, startRaw, endRaw].some(v => v === undefined)) {
    return res.status(400).json({ error: 'Subject, dayOfWeek, startTime and endTime required.' });
  }

  try {
    const startNorm = normalizeAfternoonHHMM(startRaw) || startRaw;
    const endNorm = normalizeAfternoonHHMM(endRaw) || endRaw;
    const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startNorm);
    const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endNorm);
    if (!startTimestamp || !endTimestamp) return res.status(400).json({ error: 'Invalid day/time format.' });
    if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);

    const result = await pool.query(
      `UPDATE timetables
       SET subject=$1, start_time=$2, end_time=$3, location=$4,
           is_recurring=$5, recurring_pattern=$6, recurring_end_date=$7
       WHERE id=$8 AND user_id=$9
       RETURNING id, user_id, role, subject, start_time, end_time, location,
                 is_recurring, recurring_pattern, recurring_end_date`,
      [subject, startTimestamp, endTimestamp, location || null,
       is_recurring, recurring_pattern, recurring_end_date, entryId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found or unauthorized.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Error updating timetable entry' });
  }
});

// Delete
router.delete('/:id', authMiddleware, async (req, res) => {
  const entryId = req.params.id;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `DELETE FROM timetables WHERE id = $1 AND user_id = $2`,
      [entryId, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Entry not found or unauthorized.' });
    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Error deleting timetable entry' });
  }
});

module.exports = router;