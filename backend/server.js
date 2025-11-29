// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateText } = require('./geminiService');
require('./db'); // Connect PostgreSQL

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Optional: start notification service (disable with NOTIFY_ENABLED=false)
if (process.env.NOTIFY_ENABLED !== 'false') {
  try {
    const { startNotificationService } = require('./notificationService');
    startNotificationService();
  } catch (e) {
    console.warn('Notification service failed to start:', e?.message || e);
  }
}

// Routes
const authRoutes = require('./routes/authRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const todoRoutes = require('./routes/todoRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const taRoutes = require('./routes/taRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.get('/', (_req, res) => res.send('Backend is running 🚀'));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ta', taRoutes);
app.use('/api/notifications', notificationRoutes);

app.post('/api/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'A prompt is required.' });
    const text = await generateText(prompt);
    res.json({ text });
  } catch (error) {
    console.error('Gemini text generation error:', error);
    res.status(500).json({ error: 'Failed to generate text.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));