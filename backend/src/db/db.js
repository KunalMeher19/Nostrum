// Mongoose connection · shares the same database as the Next.js app
// (Auth.js MongoDB adapter writes the users collection there).
const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI environment variable');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = { connectDb, mongoose };
