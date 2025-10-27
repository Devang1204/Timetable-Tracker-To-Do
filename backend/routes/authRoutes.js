// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log('--- ENTERED POST /api/auth/register ---');
  console.log('Register Request Body:', req.body);

  // Basic Validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }
  // Add more specific validation if needed (email format, password strength, role value)

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // ============================================
    // ✅ --- FIX: Return full user details ---
    // ============================================
    const result = await pool.query(
      // Use RETURNING * or list needed columns
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    // Construct the user object to send back (excluding password)
    const newUser = result.rows[0];
    const userDetails = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
    };
    // ============================================

    console.log('User registered successfully:', userDetails);
    // Send 201 Created status, success, and user object
    res.status(201).json({ success: true, user: userDetails });
    console.log('--- REGISTER RESPONSE SENT ---');

  } catch (err) {
    console.error('--- ERROR in POST /api/auth/register ---:', err);
    // Check for specific duplicate email error
    if (err.code === '23505' && err.constraint === 'users_email_key') {
      return res.status(409).json({ error: 'Email address already in use.' }); // 409 Conflict
    }
    // Generic error for other issues
    res.status(500).json({ error: 'Error registering user' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('--- ENTERED POST /api/auth/login ---');
  console.log('Login Request Body:', req.body);

  if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
        console.log(`Login attempt failed: User not found (${email})`);
        return res.status(400).json({ error: 'User not found' }); // Use 400 or 401/404 as preferred
    }

    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        console.log(`Login attempt failed: Invalid password for user ${email}`);
        return res.status(401).json({ error: 'Invalid password' }); // 401 Unauthorized
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, // Include necessary info in token payload
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Example: Token expires in 7 days
    );

    // Prepare user details to send back (exclude password)
    const userDetails = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    console.log(`Login successful for user ${email}`);
    // Send success, token, and user object
    res.json({ success: true, token, user: userDetails });
    console.log('--- LOGIN RESPONSE SENT ---');

  } catch (err) {
    console.error('--- ERROR in POST /api/auth/login ---:', err);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
});

module.exports = router;