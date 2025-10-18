// routes/timetableRoutes.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ✅ Create new timetable entry
router.post('/', async (req, res) => {
  const { user_id, role, day, subject, start_time, end_time, location } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO timetables (user_id, role, day, subject, start_time, end_time, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, role, day, subject, start_time, end_time, location]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding timetable entry' });
  }
});

// ✅ Fetch timetable for a user
router.get('/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM timetables WHERE user_id = $1 ORDER BY day, start_time`,
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching timetable' });
  }
});

// ✅ Update timetable entry
router.put('/:id', async (req, res) => {
  const { subject, day, start_time, end_time, location } = req.body;
  try {
    const result = await pool.query(
      `UPDATE timetables
       SET subject = $1, day = $2, start_time = $3, end_time = $4, location = $5
       WHERE id = $6 RETURNING *`,
      [subject, day, start_time, end_time, location, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating timetable entry' });
  }
});

// ✅ Delete timetable entry
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM timetables WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting timetable entry' });
  }
});

module.exports = router;
