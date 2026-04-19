const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://adhi:adhi123@cluster0.onwwfol.mongodb.net/AUC-COM?retryWrites=true&w=majority&appName=Cluster0';
    
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    // Do not exit in serverless environments like Vercel.
    // The app should stay alive to return a proper error response.
  }
};

module.exports = connectDB;