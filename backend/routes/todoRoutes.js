// routes/todoRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// --- All routes are now protected ---

// Create a new to-do
router.post('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id; // Get user ID from the token
  const { task, due_date, timetable_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO todos (user_id, task, due_date, timetable_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, task, due_date, timetable_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error adding to-do item' });
  }
});

// Get all todos for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM todos WHERE user_id = $1`, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching todos' });
  }
});

module.exports = router;