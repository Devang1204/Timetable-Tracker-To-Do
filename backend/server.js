// server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { generateText } = require('./geminiService'); // Imports your new Gemini function

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE, // This now matches your .env file
  password: process.env.DB_PASSWORD, // This now matches your .env file
  port: process.env.DB_PORT,
});

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Your route to fetch timetable
app.get('/timetable', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM timetable');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching timetable');
  }
});

// New Gemini API Endpoint
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'A prompt is required.' });
    }
    
    const summary = await generateText(prompt);
    res.json({ summary: summary });

  } catch (error) {
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
