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

// Helper function to create a full date object from a day index (0=Mon...4=Fri) and time
function getNextDateForDayAndTime(dayIndex, timeString) {
    if (dayIndex === undefined || dayIndex < 0 || dayIndex > 6 || !timeString) return null;
    const timeParts = timeString.match(/(\d+):(\d+)/);
    if (!timeParts) return null;
    const hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const frontendDayToJsDay = [1, 2, 3, 4, 5];
    const jsTargetDay = frontendDayToJsDay[dayIndex];
    if (jsTargetDay === undefined) return null;
    const today = new Date();
    const currentDay = today.getDay();
    let dateOffset = jsTargetDay - currentDay;
    if (dateOffset < 0) { dateOffset += 7; }
    else if (dateOffset === 0) {
        if (today.getHours() > hours || (today.getHours() === hours && today.getMinutes() >= minutes)) {
             // dateOffset += 7; // Keep today for editing/viewing for now
        }
    }
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + dateOffset);
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

    const userId = req.user.id; // Get user ID from token

    try {
        const extractedText = await extractTextFromPdf(req.file.buffer);
        if (!extractedText) return res.status(400).json({ error: 'Could not extract text from PDF.' });
        console.log("--- Extracted Text ---"); console.log(extractedText); console.log("--------------------");

        const timetableData = await generateTimetableFromText(extractedText);
        if (!Array.isArray(timetableData)) return res.status(500).json({ error: 'AI failed to generate structured timetable data.' });

        const client = await pool.connect();
        let insertedCount = 0;
        try {
            await client.query('BEGIN');

            // ============================================
            // ✅ --- FIX: Delete existing entries FIRST ---
            // ============================================
            console.log(`Deleting existing timetable entries for user ${userId}...`);
            await client.query('DELETE FROM timetables WHERE user_id = $1', [userId]);
            console.log('Existing entries deleted.');
            // ============================================

            const daysMap = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6};
            console.log('Inserting new entries...');
            for (const entry of timetableData) {
                if (!entry || !entry.day || !entry.start_time || !entry.end_time || !entry.subject) continue;
                const dayIndex = daysMap[entry.day.toLowerCase()];
                if(dayIndex === undefined) continue;
                const startTime = getNextDateForDayAndTime(dayIndex, entry.start_time);
                const endTime = getNextDateForDayAndTime(dayIndex, entry.end_time);
                if (!startTime || !endTime) continue;
                if (endTime <= startTime) endTime.setDate(endTime.getDate() + 1);
                await client.query(`INSERT INTO timetables (user_id, role, subject, start_time, end_time, location) VALUES ($1, 'student', $2, $3, $4, $5)`, [userId, entry.subject, startTime, endTime, entry.location]);
                insertedCount++;
            }
            await client.query('COMMIT');
            console.log(`Committed ${insertedCount} new entries.`);
        } catch (dbError) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed, rolled back:', dbError);
            throw dbError; // Re-throw the error to be caught by the outer catch block
        } finally {
            client.release();
        }

        if (insertedCount === 0 && timetableData.length > 0) return res.status(400).json({ success: false, message: 'AI generated data, but failed to insert valid entries.' });
        res.json({ success: true, message: `Timetable processed. ${insertedCount} entries saved!` }); // Updated message

    } catch (error) {
        console.error('Error processing timetable upload:', error);
        // Provide more specific error message if it's a known type
        const errorMessage = (error instanceof Error && error.message.includes('generate timetable'))
            ? 'Failed to generate timetable structure from PDF.'
            : 'Failed to process uploaded timetable.';
        res.status(500).json({ error: errorMessage });
    }
});

// Create new manual timetable entry
router.post('/', authMiddleware, async (req, res) => {
    // ... (rest of the code for POST '/')
    console.log('--- ENTERED POST /api/timetable (Manual) ---');
    const user_id = req.user.id;
    const { role = 'student', subject, dayOfWeek, startTime: startTimeString, endTime: endTimeString, location, is_recurring = false, recurring_pattern = null, recurring_end_date = null } = req.body;
    console.log('User ID:', user_id);
    console.log('Request Body:', req.body);
    try {
        if (subject === undefined || startTimeString === undefined || endTimeString === undefined || dayOfWeek === undefined) {
             return res.status(400).json({ error: "Subject, dayOfWeek, startTime, and endTime are required." });
        }
        const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startTimeString);
        const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endTimeString);
        if (!startTimestamp || !endTimestamp) {
            return res.status(400).json({ error: "Invalid day of week or time format provided." });
        }
        if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);
        console.log('Attempting manual database insert with calculated timestamps...');
        const result = await pool.query(`INSERT INTO timetables (user_id, role, subject, start_time, end_time, location, is_recurring, recurring_pattern, recurring_end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [user_id, role, subject, startTimestamp, endTimestamp, location, is_recurring, recurring_pattern, recurring_end_date]);
        console.log('Manual database insert successful:', result.rows[0]);
        res.status(201).json(result.rows[0]);
        console.log('--- MANUAL RESPONSE SENT SUCCESSFULLY ---');
    } catch (err) {
        console.error('--- ERROR in POST /api/timetable (Manual) ---:', err);
        res.status(500).json({ error: 'Error adding timetable entry' });
    }
});

// Fetch timetable for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    // ... (rest of the code for GET '/')
    console.log('--- ENTERED GET /api/timetable ---');
    const userId = req.user.id;
    console.log('Fetching timetable for User ID:', userId);
    try {
        console.log('Attempting database query...');
        const result = await pool.query(`SELECT id, user_id, role, subject, start_time, end_time, location, is_recurring, recurring_pattern, recurring_end_date FROM timetables WHERE user_id = $1 ORDER BY start_time`, [userId]);
        console.log('Database query successful. Rows found:', result.rows.length);
        res.json(result.rows);
        console.log('--- GET RESPONSE SENT SUCCESSFULLY ---');
    } catch (err) {
        console.error('--- ERROR in GET /api/timetable ---:', err);
        res.status(500).json({ error: 'Error fetching timetable' });
    }
});

// Update timetable entry
router.put('/:id', authMiddleware, async (req, res) => {
    // ... (rest of the code for PUT '/:id')
    console.log('--- ENTERED PUT /api/timetable/:id ---');
    const entryId = req.params.id;
    const userId = req.user.id;
    const { subject, dayOfWeek, startTime: startTimeString, endTime: endTimeString, location, is_recurring, recurring_pattern, recurring_end_date } = req.body;
    console.log('Updating Entry ID:', entryId, 'for User ID:', userId);
    console.log('Request Body:', req.body);
    try {
        if (subject === undefined || startTimeString === undefined || endTimeString === undefined || dayOfWeek === undefined) {
             return res.status(400).json({ error: "Subject, dayOfWeek, startTime, and endTime are required for update." });
        }
        const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startTimeString);
        const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endTimeString);
        if (!startTimestamp || !endTimestamp) {
            return res.status(400).json({ error: "Invalid day of week or time format provided for update." });
        }
        if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);
        console.log('Attempting database update...');
        const result = await pool.query(`UPDATE timetables SET subject = $1, start_time = $2, end_time = $3, location = $4, is_recurring = $5, recurring_pattern = $6, recurring_end_date = $7 WHERE id = $8 AND user_id = $9 RETURNING *`, [subject, startTimestamp, endTimestamp, location, is_recurring, recurring_pattern, recurring_end_date, entryId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found or user not authorized" });
        }
        console.log('Database update successful:', result.rows[0]);
        res.json(result.rows[0]);
        console.log('--- UPDATE RESPONSE SENT SUCCESSFULLY ---');
    } catch (err) {
        console.error('--- ERROR in PUT /api/timetable/:id ---:', err);
        res.status(500).json({ error: 'Error updating timetable entry' });
    }
});

// Delete timetable entry
router.delete('/:id', authMiddleware, async (req, res) => {
    // ... (rest of the code for DELETE '/:id')
     console.log('--- ENTERED DELETE /api/timetable/:id ---');
    const entryId = req.params.id;
    const userId = req.user.id;
    console.log('Deleting Entry ID:', entryId, 'for User ID:', userId);
    try {
        const result = await pool.query(`DELETE FROM timetables WHERE id = $1 AND user_id = $2`, [entryId, userId]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Entry not found or user not authorized" });
        console.log('Database delete successful.');
        res.json({ success: true, message: 'Entry deleted successfully' });
        console.log('--- DELETE RESPONSE SENT SUCCESSFULLY ---');
    } catch (err) {
        console.error('--- ERROR in DELETE /api/timetable/:id ---:', err);
        res.status(500).json({ error: 'Error deleting timetable entry' });
    }
});

module.exports = router;