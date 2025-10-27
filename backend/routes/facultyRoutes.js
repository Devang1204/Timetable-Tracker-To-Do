// routes/facultyRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
// Import helpers and AI functions
const { generateFacultyTimetable, generateText } = require('../geminiService');

// --- Helper Function for Time Conversion ---
// (Consider moving this to a separate routes/routeHelpers.js file and importing)
function getNextDateForDayAndTime(dayIndex, timeString) {
    if (dayIndex === undefined || dayIndex < 0 || dayIndex > 6 || !timeString) return null;
    const timeParts = timeString.match(/(\d+):(\d+)/);
    if (!timeParts) return null;
    const hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    // Assuming frontend sends 0=Monday, 1=Tuesday, ..., 4=Friday
    const frontendDayToJsDay = [1, 2, 3, 4, 5]; // Map frontend index to JS Date day index (1=Mon, 5=Fri)
    const jsTargetDay = frontendDayToJsDay[dayIndex];
    if (jsTargetDay === undefined) return null; // Handle invalid day index
    const today = new Date();
    const currentDay = today.getDay(); // JS Date uses 0=Sunday, 1=Monday... 6=Saturday
    let dateOffset = jsTargetDay - currentDay;
    if (dateOffset < 0) { dateOffset += 7; }
    else if (dateOffset === 0) {
        // If it's today BUT the time has passed, schedule for next week (for POST)
        // For PUT, we might allow updating today's past events, adjust if needed
        if (today.getHours() > hours || (today.getHours() === hours && today.getMinutes() >= minutes)) {
             // For POST route, uncomment below to force future dates
             // dateOffset += 7;
        }
    }
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + dateOffset);
    nextDate.setHours(hours, minutes, 0, 0);
    // console.log(`Input DayIndex: ${dayIndex}, Time: ${timeString} => Calculated Date: ${nextDate.toISOString()}`); // Debug log
    return nextDate;
}
// --- End Helper Function ---


// Middleware to check if the logged-in user is a faculty member
const isFaculty = (req, res, next) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to faculty only' });
  }
  next();
};

// 🛡️ All routes protected and require faculty role

// AI Faculty/TA Schedule Generation ("Generate Optimal Schedule")
router.post('/generate-schedule', authMiddleware, isFaculty, async (req, res) => {
  console.log('--- ENTERED POST /api/faculty/generate-schedule ---');
  const facultyUserId = req.user.id;
  const constraints = req.body;
  console.log('Received Constraints:', constraints);
  if (!constraints || !constraints.subjects || !constraints.assigneeUserId) {
    return res.status(400).json({ error: 'Missing required constraints (subjects, assigneeUserId).' });
  }
  try {
    console.log(`Fetching existing schedule for assignee ${constraints.assigneeUserId}...`);
    const existingScheduleResult = await pool.query(
      `SELECT subject, start_time, end_time FROM timetables WHERE user_id = $1`,
      [constraints.assigneeUserId]
    );
    constraints.existingSchedule = existingScheduleResult.rows;
    console.log('Calling Gemini for schedule generation...');
    const generatedSchedule = await generateFacultyTimetable(constraints);
    console.log('Gemini generated schedule:', generatedSchedule);

    if (!Array.isArray(generatedSchedule)) { // Allow empty array
        console.warn('AI did not return a valid schedule array.');
        return res.json({ success: true, message: 'AI generated an empty schedule. No changes made.', schedule: [] });
    }

    const client = await pool.connect();
    let insertedCount = 0;
    try {
      await client.query('BEGIN');
      console.log(`Deleting existing timetable entries for user ${constraints.assigneeUserId}...`);
      await client.query('DELETE FROM timetables WHERE user_id = $1', [constraints.assigneeUserId]);
      console.log('Existing entries deleted.');
      console.log('Inserting new generated entries...');
      const daysMap = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4};
      for (const entry of generatedSchedule) {
         if (!entry || !entry.day || !entry.start_time || !entry.end_time || !entry.subject) { console.warn('Skipping invalid entry from AI:', entry); continue; }
         const dayIndex = daysMap[entry.day.toLowerCase()];
         if (dayIndex === undefined) { console.warn(`Skipping entry with invalid day: ${entry.day}`); continue; }
         const startTime = getNextDateForDayAndTime(dayIndex, entry.start_time);
         const endTime = getNextDateForDayAndTime(dayIndex, entry.end_time);
         if (!startTime || !endTime) { console.warn(`Skipping entry with invalid time format: ${entry.start_time}-${entry.end_time}`); continue; }
         if (endTime <= startTime) endTime.setDate(endTime.getDate() + 1);
        await client.query(`INSERT INTO timetables (user_id, role, subject, start_time, end_time, location) VALUES ($1, $2, $3, $4, $5, $6)`, [constraints.assigneeUserId, constraints.targetRole || 'faculty', entry.subject, startTime, endTime, entry.location || 'N/A']);
        insertedCount++;
      }
      await client.query('COMMIT');
      console.log(`Committed ${insertedCount} generated schedule entries.`);
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database transaction failed during schedule generation:', dbError);
      throw dbError;
    } finally {
      client.release();
    }
     const message = insertedCount > 0 ? `Schedule generated. ${insertedCount} entries saved!` : (generatedSchedule.length > 0 ? 'AI generated schedule, but failed to save valid entries.' : 'AI generated an empty schedule.');
     const status = insertedCount > 0 ? 200 : (generatedSchedule.length > 0 ? 400 : 200);
    res.status(status).json({ success: insertedCount > 0, message: message, schedule: generatedSchedule });
  } catch (error) {
    console.error("--- ERROR in POST /api/faculty/generate-schedule ---:", error);
    res.status(500).json({ error: `Failed to generate schedule: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});


// ============================================
// ✅ --- FIX: Create manual entry (Time Conversion) ---
// ============================================
router.post('/timetable', authMiddleware, isFaculty, async (req, res) => {
  // Expect dayOfWeek, startTime (HH:MM), endTime (HH:MM) from frontend
  const { user_id, role, subject, dayOfWeek, startTime: startTimeString, endTime: endTimeString, location } = req.body;
  console.log('--- ENTERED POST /api/faculty/timetable ---');
  console.log('Request Body:', req.body);
  try {
    // Validation
    if (subject === undefined || startTimeString === undefined || endTimeString === undefined || dayOfWeek === undefined || user_id === undefined || role === undefined) {
      return res.status(400).json({ error: "Subject, dayOfWeek, startTime, endTime, user_id, and role are required." });
    }

    // Convert day/time to timestamps
    const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startTimeString);
    const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endTimeString);
    if (!startTimestamp || !endTimestamp) {
      return res.status(400).json({ error: "Invalid day of week or time format provided." });
    }
    if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);

    console.log('Attempting faculty manual insert...');
    // Insert using calculated timestamps
    const result = await pool.query(
      `INSERT INTO timetables (user_id, role, subject, start_time, end_time, location)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, role, subject, startTimestamp, endTimestamp, location]
    );
    console.log('Faculty manual insert successful:', result.rows[0]);
    res.status(201).json(result.rows[0]); // Send back full object
  } catch (err) {
    console.error("--- ERROR in POST /api/faculty/timetable ---:", err);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

// Get all TAs
router.get('/tas', authMiddleware, isFaculty, async (req, res) => {
  console.log('--- ENTERED GET /api/faculty/tas ---');
  try {
    const result = await pool.query(`SELECT id, name, email, role FROM users WHERE role = 'ta' ORDER BY name`);
    console.log(`Found ${result.rows.length} TAs.`);
    res.json(result.rows);
  } catch (err) {
    console.error("--- ERROR in GET /api/faculty/tas ---:", err);
    res.status(500).json({ error: 'Failed to fetch teaching assistants' });
  }
});

// ============================================
// ✅ --- FIX: Update/Assign Class (Time Conversion) ---
// ============================================
router.put('/timetable/:id', authMiddleware, isFaculty, async (req, res) => {
  // Expect dayOfWeek, startTime (HH:MM), endTime (HH:MM) from frontend
  const { subject, dayOfWeek, startTime: startTimeString, endTime: endTimeString, location, user_id, role } = req.body;
  const entryId = req.params.id;
  console.log('--- ENTERED PUT /api/faculty/timetable/:id ---');
  console.log('Request Body:', req.body);
  try {
    // Validation
    if (subject === undefined || startTimeString === undefined || endTimeString === undefined || dayOfWeek === undefined || user_id === undefined || role === undefined) {
      return res.status(400).json({ error: "Subject, dayOfWeek, startTime, endTime, user_id, and role are required for update." });
    }

    // Convert day/time to timestamps
    const startTimestamp = getNextDateForDayAndTime(dayOfWeek, startTimeString);
    const endTimestamp = getNextDateForDayAndTime(dayOfWeek, endTimeString);
    if (!startTimestamp || !endTimestamp) {
      return res.status(400).json({ error: "Invalid day of week or time format provided for update." });
    }
    if (endTimestamp <= startTimestamp) endTimestamp.setDate(endTimestamp.getDate() + 1);

    console.log('Attempting faculty update...');
    // Update using calculated timestamps
    const result = await pool.query(
      `UPDATE timetables SET subject = $1, start_time = $2, end_time = $3, location = $4, user_id = $5, role = $6
       WHERE id = $7 RETURNING *`,
      [subject, startTimestamp, endTimestamp, location, user_id, role, entryId]
    );
    if (result.rows.length === 0) { return res.status(404).json({ error: "Entry not found" }); }
    console.log('Faculty update successful:', result.rows[0]);
    res.json(result.rows[0]); // Send back updated object
  } catch (err) {
    console.error('--- ERROR in PUT /api/faculty/timetable/:id ---:', err);
    res.status(500).json({ error: 'Error updating timetable entry' });
  }
});

// Analyze Workload
router.post('/analyze-workload', authMiddleware, isFaculty, async (req, res) => {
  console.log('--- ENTERED POST /api/faculty/analyze-workload ---');
  const facultyUserId = req.user.id;
  try {
    console.log(`Fetching timetable for workload analysis (User ${facultyUserId})...`);
    // Fetch faculty's AND their TAs' schedules
    const timetableResult = await pool.query(
        `SELECT tt.subject, tt.start_time, tt.end_time, u.role, u.name as assignee_name, u.id as user_id
         FROM timetables tt
         JOIN users u ON tt.user_id = u.id
         WHERE tt.user_id = $1 OR tt.user_id IN (SELECT id FROM users WHERE role = 'ta')`, // Simplified for now
        [facultyUserId]
    );
    if (timetableResult.rows.length === 0) { return res.status(404).json({ error: 'No timetable found for this faculty member or their TAs.' }); }
    let timetableString = "Faculty & TA Weekly Schedule:\n";
    timetableResult.rows.forEach(entry => { timetableString += `- ${entry.assignee_name} (${entry.role}): ${entry.subject} (from ${new Date(entry.start_time).toLocaleString()} to ${new Date(entry.end_time).toLocaleString()})\n`; });
    const prompt = `Analyze the following university faculty and TA teaching workload... AFTER the analysis, provide exactly 3 actionable, specific recommendations... Workload:\n---\n${timetableString}\n---`;
    console.log('Calling Gemini for workload analysis...');
    const fullResponse = await generateText(prompt);
    console.log('Workload analysis received.');
    let analysisText = fullResponse; let recommendationsList = []; const recommendationMarker = "\n* "; const firstRecommendationIndex = fullResponse.indexOf(recommendationMarker);
    if (firstRecommendationIndex !== -1) { analysisText = fullResponse.substring(0, firstRecommendationIndex).trim(); recommendationsList = fullResponse.substring(firstRecommendationIndex).split('\n').map(line => line.trim()).filter(line => line.startsWith('* ')).map(line => line.substring(2).trim()); }
    res.json({ success: true, analysis: analysisText, recommendations: recommendationsList });
  } catch (error) {
    console.error('--- ERROR in POST /api/faculty/analyze-workload ---:', error);
    res.status(500).json({ error: `Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Generate Teaching Report
router.post('/teaching-report', authMiddleware, isFaculty, async (req, res) => {
  console.log('--- ENTERED POST /api/faculty/teaching-report ---');
  const facultyUserId = req.user.id;
  try {
    console.log(`Fetching timetable for teaching report (User ${facultyUserId})...`);
    const timetableResult = await pool.query(`SELECT subject, start_time, end_time, location FROM timetables WHERE user_id = $1 ORDER BY start_time`, [facultyUserId]);
    if (timetableResult.rows.length === 0) { return res.status(404).json({ error: 'No timetable found for this faculty member.' }); }
    let timetableString = "Faculty Weekly Schedule:\n";
    timetableResult.rows.forEach(entry => { timetableString += `- ${entry.subject} at ${entry.location} (from ${new Date(entry.start_time).toLocaleString()} to ${new Date(entry.end_time).toLocaleString()})\n`; });
    const prompt = `Generate a comprehensive weekly teaching summary... AFTER the summary, provide exactly 3 actionable, specific recommendations... Schedule:\n---\n${timetableString}\n---`;
    console.log('Calling Gemini for teaching report...');
    const fullResponse = await generateText(prompt);
    console.log('Teaching report received.');
    let reportText = fullResponse; let recommendationsList = []; const recommendationMarker = "\n* "; const firstRecommendationIndex = fullResponse.indexOf(recommendationMarker);
    if (firstRecommendationIndex !== -1) { reportText = fullResponse.substring(0, firstRecommendationIndex).trim(); recommendationsList = fullResponse.substring(firstRecommendationIndex).split('\n').map(line => line.trim()).filter(line => line.startsWith('* ')).map(line => line.substring(2).trim()); }
    res.json({ success: true, report: reportText, recommendations: recommendationsList });
  } catch (error) {
    console.error('--- ERROR in POST /api/faculty/teaching-report ---:', error);
    res.status(500).json({ error: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Suggest TA Assignments
router.post('/suggest-ta-assignments', authMiddleware, isFaculty, async (req, res) => {
    console.log('--- ENTERED POST /api/faculty/suggest-ta-assignments ---');
    const facultyUserId = req.user.id;
    try {
        const taResult = await pool.query(`SELECT id, name, role FROM users WHERE role = 'ta'`); const tas = taResult.rows;
        if (tas.length === 0) { return res.status(404).json({ error: 'No TAs found to assign.' }); }
        const timetableResult = await pool.query( `SELECT id, subject, start_time, user_id, role, name as assignee_name FROM timetables tt JOIN users u ON tt.user_id = u.id WHERE tt.user_id = $1 OR tt.user_id IN (SELECT id FROM users WHERE role = 'ta')`, [facultyUserId] ); const classes = timetableResult.rows;
        const prompt = `You are an AI assistant helping a faculty member assign TAs... Available TAs:\n${JSON.stringify(tas, null, 2)}\n\nClasses:\n${JSON.stringify(classes, null, 2)}\n\nTask: Provide 3-4 specific recommendations... base suggestions on **balancing the workload**... Each recommendation... starting with "* ".`;
        console.log('Calling Gemini for TA assignment suggestions...');
        const fullResponse = await generateText(prompt);
        console.log('TA assignment suggestions received.');
        let analysisText = fullResponse; let recommendationsList = []; const recommendationMarker = "\n* "; const firstRecommendationIndex = fullResponse.indexOf(recommendationMarker);
        if (firstRecommendationIndex !== -1) { analysisText = fullResponse.substring(0, firstRecommendationIndex).trim(); recommendationsList = fullResponse.substring(firstRecommendationIndex).split('\n').map(line => line.trim()).filter(line => line.startsWith('* ')).map(line => line.substring(2).trim()); }
        res.json({ success: true, analysis: analysisText, recommendations: recommendationsList });
    } catch (error) {
        console.error('--- ERROR in POST /api/faculty/suggest-ta-assignments ---:', error);
        res.status(500).json({ error: `Failed to generate TA suggestions: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
});

// Delete TA and Reassign Classes
router.delete('/tas/:id', authMiddleware, isFaculty, async (req, res) => {
  const taIdToDelete = req.params.id;
  const facultyUserId = req.user.id;
  console.log(`--- ENTERED DELETE /api/faculty/tas/${taIdToDelete} ---`);
  console.log(`Faculty ID: ${facultyUserId}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const taCheck = await pool.query('SELECT role FROM users WHERE id = $1', [taIdToDelete]);
    if (taCheck.rows.length === 0) { await client.query('ROLLBACK'); console.log(`TA Delete Failed: User ${taIdToDelete} not found.`); return res.status(404).json({ error: 'TA user not found.' }); }
    if (taCheck.rows[0].role !== 'ta') { await client.query('ROLLBACK'); console.log(`TA Delete Failed: User ${taIdToDelete} is not a TA.`); return res.status(400).json({ error: 'User is not a Teaching Assistant.' }); }
    console.log(`Reassigning classes from TA ${taIdToDelete} to Faculty ${facultyUserId}...`);
    const updateResult = await pool.query(`UPDATE timetables SET user_id = $1, role = 'faculty' WHERE user_id = $2`, [facultyUserId, taIdToDelete]);
    console.log(`Reassigned ${updateResult.rowCount} classes.`);
    console.log(`Deleting TA user ${taIdToDelete}...`);
    const deleteResult = await client.query('DELETE FROM users WHERE id = $1', [taIdToDelete]);
    if (deleteResult.rowCount === 0) { throw new Error(`Failed to delete TA user ${taIdToDelete} after reassignment.`); }
    console.log(`TA user ${taIdToDelete} deleted successfully.`);
    await client.query('COMMIT');
    res.status(200).json({ success: true, message: `TA deleted and ${updateResult.rowCount} classes reassigned.` });
    console.log('--- DELETE TA RESPONSE SENT ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`--- ERROR in DELETE /api/faculty/tas/${taIdToDelete} ---:`, err);
    res.status(500).json({ error: 'Failed to delete TA or reassign classes.' });
  } finally {
    client.release();
  }
});

// Faculty Delete Timetable Entry
router.delete('/timetable/:id', authMiddleware, isFaculty, async (req, res) => {
  const entryId = req.params.id;
  const facultyUserId = req.user.id; // Get faculty ID from token
  console.log(`--- ENTERED DELETE /api/faculty/timetable/${entryId} ---`);
  console.log(`Faculty ID: ${facultyUserId}`);
  try {
    console.log(`Attempting to delete timetable entry ${entryId}...`);
    // Faculty can delete any entry (their own or their TAs, potentially)
    // Add more specific authorization check here if needed (e.g., check if faculty "owns" the TA)
    const result = await pool.query(`DELETE FROM timetables WHERE id = $1 RETURNING id, user_id`, [entryId]);

    if (result.rowCount === 0) {
        console.log(`Delete Failed: Timetable entry ${entryId} not found.`);
        return res.status(404).json({ error: 'Timetable entry not found.' });
    }

    console.log(`Timetable entry ${entryId} (belonging to user ${result.rows[0].user_id}) deleted successfully by faculty ${facultyUserId}.`);
    res.status(200).json({ success: true, message: 'Entry deleted successfully' });
    console.log('--- FACULTY DELETE TIMETABLE RESPONSE SENT ---');
  } catch (err) {
    console.error(`--- ERROR in DELETE /api/faculty/timetable/${entryId} ---:`, err);
    res.status(500).json({ error: 'Error deleting timetable entry.' });
  }
});


module.exports = router;