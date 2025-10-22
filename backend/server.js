// server.js
require('dotenv').config();
const express = require('express'); // Ensure this line appears only ONCE
const cors = require('cors');
const { generateText } = require('./geminiService');
require('./notificationService'); // Start the background notification checks

const app = express();
app.use(express.json());
app.use(cors());

// --- Database pool is managed in db.js ---

// Base route
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Modular routes
const authRoutes = require('./routes/authRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const todoRoutes = require('./routes/todoRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const studentRoutes = require('./routes/studentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);

// Gemini AI endpoint (generic summary)
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