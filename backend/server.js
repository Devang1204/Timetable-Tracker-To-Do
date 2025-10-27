// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateText } = require('./geminiService');
require('./db'); // Connects to PostgreSQL
require('./notificationService'); // Starts the cron job for notifications

const app = express();

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing

// ✅ --- ADD THESE LINES TO INCREASE SIZE LIMITS ---
// Increase limit for JSON payloads (e.g., up to 10MB)
app.use(express.json({ limit: '10mb' })); 
// Increase limit for URL-encoded payloads (often affects forms/uploads too)
app.use(express.urlencoded({ limit: '10mb', extended: true })); 
// --- END OF ADDED LINES ---

// --- Modular routes ---
const authRoutes = require('./routes/authRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const todoRoutes = require('./routes/todoRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const taRoutes = require('./routes/taRoutes');

// Base route
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// --- Use API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ta', taRoutes);

// Gemini AI endpoint (generic summary / "Get Motivation")
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'A prompt is required.' });
    }
    const summary = await generateText(prompt);
    res.json({ summary });
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});