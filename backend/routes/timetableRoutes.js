// routes/timetableRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const { PdfReader } = require('pdfreader');
const { generateTimetableFromText } = require('../geminiService');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to create a full date object from a day and time
function getNextDateForDay(dayOfWeek, time) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = days.indexOf(dayOfWeek?.toLowerCase()); // Added safe navigation ?.
    if (targetDay === -1 || !time) return null;
    const today = new Date();
    const currentDay = today.getDay();
    let dateOffset = targetDay - currentDay;
    if (dateOffset <= 0) dateOffset += 7;
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + dateOffset);
    const timeParts = time.match(/(\d+):(\d+)/);
    if (!timeParts) return null;
    const hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    nextDate.setHours(hours, minutes, 0, 0);
    return nextDate;
}

// Helper to extract text from PDF using pdfreader
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

// --- All routes are protected ---

// AI Timetable Generation from PDF Upload
router.post('/upload', authMiddleware, upload.single('timetableFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    try {
        const extractedText = await extractTextFromPdf(req.file.buffer);
        if (!extractedText) return res.status(400).json({ error: 'Could not extract text from PDF.' });
        console.log("--- Extracted Text ---"); console.log(extractedText); console.log("--------------------");
        const timetableData = await generateTimetableFromText(extractedText);
        if (!Array.isArray(timetableData)) return res.status(500).json({ error: 'AI failed to generate structured timetable data.' });
        const userId = req.user.id;
        const client = await pool.connect();
        let insertedCount = 0;
        try {
            await client.query('BEGIN');
            for (const entry of timetableData) {
                if (!entry || !entry.day || !entry.start_time || !entry.end_time || !entry.subject) continue;
                const startTime = getNextDateForDay(entry.day, entry.start_time);
                const endTime = getNextDateForDay(entry.day, entry.end_time);
                if (!startTime || !endTime) continue;
                await client.query(`INSERT INTO timetables (user_id, role, subject, start_time, end_time, location) VALUES ($1, 'student', $2, $3, $4, $5)`, [userId, entry.subject, startTime, endTime, entry.location]);
                insertedCount++;
            }
            await client.query('COMMIT');
        } catch (dbError) {
            await client.query('ROLLBACK'); throw dbError;
        } finally { client.release(); }
        if (insertedCount === 0 && timetableData.length > 0) return res.status(400).json({ success: false, message: 'AI generated data, but failed to insert valid entries.' });
        res.json({ success: true, message: `Timetable generated. ${insertedCount} entries saved!` });
    } catch (error) {
        console.error('Error processing timetable upload:', error);
        res.status(500).json({ error: 'Failed to process uploaded timetable.' });
    }
}); // <--- Make sure this closing bracket and parenthesis are here

// Create new manual timetable entry
router.post('/', authMiddleware, async (req, res) => {
    console.log('--- ENTERED POST /api/timetable (Manual) ---');
    const user_id = req.user.id;
    const { role = 'student', subject, start_time, end_time, location, is_recurring = false, recurring_pattern = null, recurring_end_date = null } = req.body;
    console.log('User ID:', user_id);
    console.log('Request Body:', req.body);
    try {
        if (!subject || !start_time || !end_time) return res.status(400).json({ error: "Subject, start_time, end_time required." });
        console.log('Attempting manual database insert...');
        const result = await pool.query(`INSERT INTO timetables (user_id, role, subject, start_time, end_time, location, is_recurring, recurring_pattern, recurring_end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [user_id, role, subject, start_time, end_time, location, is_recurring, recurring_pattern, recurring_end_date]);
        console.log('Manual database insert successful:', result.rows[0]);
        res.status(201).json({ success: true, data: result.rows[0] });
        console.log('--- MANUAL RESPONSE SENT SUCCESSFULLY ---');
    } catch (err) {
        console.error('--- ERROR in POST /api/timetable (Manual) ---:', err);
        res.status(500).json({ error: 'Error adding timetable entry' });
    }
}); // <--- Make sure this closing bracket and parenthesis are here

// Fetch timetable for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    console.log('--- ENTERED GET /api/timetable ---');
    const userId = req.user.id;
    console.log('Fetching timetable for User ID:', userId);
    try {
        console.log('Attempting database query...');
        const result = await pool.query(
          `SELECT id, subject, start_time, end_time, location, is_recurring, recurring_pattern, recurring_end_date
           FROM timetables
           WHERE user_id = $1
           ORDER BY start_time`, // <-- This is where the error might be if backtick is missing
          [userId]
        ); // <-- Make sure this closing parenthesis is here
        console.log('Database query successful. Rows found:', result.rows.length);

        res.json(result.rows);
        console.log('--- GET RESPONSE SENT SUCCESSFULLY ---');
    } catch (err) { // <-- Make sure this closing bracket for try and opening for catch are here
        console.error('--- ERROR in GET /api/timetable ---:', err);
        res.status(500).json({ error: 'Error fetching timetable' });
    } // <-- Make sure this closing bracket for catch is here
}); // <--- Make sure this closing bracket and parenthesis for the route handler are here

// Update timetable entry
router.put('/:id', authMiddleware, async (req, res) => {
    const { subject, start_time, end_time, location, is_recurring, recurring_pattern, recurring_end_date } = req.body;
    const entryId = req.params.id; const userId = req.user.id;
    try {
        if (!subject || !start_time || !end_time) return res.status(400).json({ error: "Subject, start_time, end_time required." });
        const result = await pool.query(`UPDATE timetables SET subject = $1, start_time = $2, end_time = $3, location = $4, is_recurring = $5, recurring_pattern = $6, recurring_end_date = $7 WHERE id = $8 AND user_id = $9 RETURNING *`, [subject, start_time, end_time, location, is_recurring, recurring_pattern, recurring_end_date, entryId, userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Entry not found or user not authorized" });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) { console.error('Error updating timetable entry:', err); res.status(500).json({ error: 'Error updating timetable entry' }); }
}); // <--- Make sure this closing bracket and parenthesis are here

// Delete timetable entry
router.delete('/:id', authMiddleware, async (req, res) => {
    const entryId = req.params.id; const userId = req.user.id;
    try {
        const result = await pool.query(`DELETE FROM timetables WHERE id = $1 AND user_id = $2`, [entryId, userId]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Entry not found or user not authorized" });
        res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (err) { console.error('Error deleting timetable entry:', err); res.status(500).json({ error: 'Error deleting timetable entry' }); }
}); // <--- Make sure this closing bracket and parenthesis are here

module.exports = router; // Make sure this is the last line