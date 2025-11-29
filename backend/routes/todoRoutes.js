// routes/todoRoutes.js
// (No AI prompt here; unchanged. Included for completeness if you need the whole backend set.)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  const { task, due_date, timetable_id } = req.body;
  if (!task || !due_date) {
    return res.status(400).json({ error: 'Task and due_date are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO todos (user_id, task, due_date, timetable_id, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [user_id, task, due_date, timetable_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding to-do:', err);
    res.status(500).json({ error: 'Error adding to-do item' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT * FROM todos WHERE user_id = $1 ORDER BY due_date ASC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Error fetching todos' });
  }
});

// Update a todo (e.g. toggle status)
router.put('/:id', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  const todoId = req.params.id;
  const { task, due_date, status, completed } = req.body;

  // Determine new status: prefer 'status' field, fallback to 'completed' boolean
  let newStatus = status;
  if (newStatus === undefined && completed !== undefined) {
    newStatus = completed ? 'completed' : 'pending';
  }

  try {
    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (task !== undefined) {
      fields.push(`task = $${paramIndex++}`);
      values.push(task);
    }
    if (due_date !== undefined) {
      fields.push(`due_date = $${paramIndex++}`);
      values.push(due_date);
    }
    if (newStatus !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(newStatus);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(todoId);
    values.push(user_id);

    const query = `
      UPDATE todos 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'To-do item not found or not authorized.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating todo ${todoId}:`, err);
    res.status(500).json({ error: 'Error updating to-do item' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  const todoId = req.params.id;
  try {
    const result = await pool.query(
      `DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id`,
      [todoId, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'To-do item not found or not authorized.' });
    }
    res.status(200).json({ success: true, message: 'To-do item deleted successfully' });
  } catch (err) {
    console.error(`Error deleting todo ${todoId}:`, err);
    res.status(500).json({ error: 'Error deleting to-do item' });
  }
});

module.exports = router;