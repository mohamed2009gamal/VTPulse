const mongoose = require('mongoose');

const connectDB = async (maxRetries = 5) => {
  const mongooseInstance = mongoose; // Ensure we use the imported instance
  
  // Connection options with retries and timeouts
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    bufferMaxEntries: 0,
    bufferCommands: false,
    autoIndex: false,
    retryWrites: true,
    w: 'majority'
  };

  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI environment variable is not set');
      }

      console.log(`Attempting MongoDB connection ${retryCount + 1}/${maxRetries} to: ${process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')}`);
      
      await mongooseInstance.connect(process.env.MONGO_URI, options);
      
      mongooseInstance.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongooseInstance.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      console.log('✅ MongoDB connected successfully');
      return mongooseInstance.connection;
    } catch (err) {
      retryCount++;
      console.error(`MongoDB connection attempt ${retryCount}/${maxRetries} failed:`, err.message);
      
      if (retryCount >= maxRetries) {
        console.error('❌ All connection retries failed. Server will start with limited DB functionality.');
        throw err; // Re-throw to be caught by caller
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }
};

module.exports = connectDB;

