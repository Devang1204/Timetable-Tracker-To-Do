// routes/todoRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// --- All routes are now protected ---

// Create a new to-do
router.post('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  // Backend expects 'task' and 'due_date'
  const { task, due_date, timetable_id } = req.body;
  console.log('Received Add Todo:', req.body); // Log received data

  // Basic Validation
  if (!task || !due_date) {
      return res.status(400).json({ error: 'Task and due_date are required.' });
  }

  try {
    // Convert due_date string to Date object for insertion if needed,
    // or ensure frontend sends a format PostgreSQL understands (YYYY-MM-DD)
    const result = await pool.query(
      `INSERT INTO todos (user_id, task, due_date, timetable_id, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`, // Added default status
      [user_id, task, due_date, timetable_id] // timetable_id can be null/undefined
    );
    console.log('Todo Added:', result.rows[0]);
    // Send back the created object directly
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding to-do:', err); // Log the specific error
    res.status(500).json({ error: 'Error adding to-do item' });
  }
});

// Get all todos for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  console.log(`Fetching todos for user ${user_id}`);
  try {
    // ============================================
    // ✅ --- FIX: Removed created_at from ORDER BY ---
    // ============================================
    const result = await pool.query(
        `SELECT * FROM todos WHERE user_id = $1 ORDER BY due_date ASC`, // Removed ", created_at ASC"
        [user_id]
    );
    // ============================================
    console.log(`Found ${result.rows.length} todos`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Error fetching todos' });
  }
});

// Delete a To-Do Item
router.delete('/:id', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  const todoId = req.params.id;
  console.log(`Attempting to delete todo ${todoId} for user ${user_id}`);

  try {
    const result = await pool.query(
      `DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id`, // RETURNING helps confirm deletion
      [todoId, user_id]
    );

    if (result.rowCount === 0) {
      console.log(`Todo ${todoId} not found or user ${user_id} not authorized.`);
      return res.status(404).json({ error: 'To-do item not found or you are not authorized to delete it.' });
    }

    console.log(`Todo ${todoId} deleted successfully.`);
    res.status(200).json({ success: true, message: 'To-do item deleted successfully' });

  } catch (err) {
    console.error(`Error deleting todo ${todoId}:`, err);
    res.status(500).json({ error: 'Error deleting to-do item' });
  }
});

module.exports = router;