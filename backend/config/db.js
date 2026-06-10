const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dheerajprajapati0009:dheerajprajapati0009@cluster0.7m5841w.mongodb.net/voiceai_db?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    console.error('[db] Server will start but DB features will be unavailable.');
  }
}

module.exports = connectDB;
