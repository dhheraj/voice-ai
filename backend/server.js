require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/tts', require('./routes/ttsRoutes'));

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

async function startServer() {
  // Connect to Database
  await connectDB();

  // Start Express Server
  app.listen(PORT, () => {
    console.log(`Voice AI API running on http://localhost:${PORT}`);
    if (!process.env.NVIDIA_API_KEY) {
      console.warn('WARNING: NVIDIA_API_KEY is not set in environment variables.');
    }
  });
}

startServer();
