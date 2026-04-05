const mongoose = require('mongoose');
const MockDatabase = require('./mockDB');

let connectionStatus = 'disconnected';
let retryCount = 0;
const MAX_RETRIES = 5;
let retryTimer = null;
let useMockDB = false;
let mockDB = null;

const isLocalMongoUri = (uri = '') => /^mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri);

const enableMockDB = () => {
  if (!mockDB) {
    mockDB = new MockDatabase();
  }

  useMockDB = true;
  connectionStatus = 'connected (mock)';
};

const connectDB = async (isRetry = false) => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI not set; using mock database for development');
      enableMockDB();
      return true;
    }

    console.log(
      `Attempting MongoDB connection${isRetry ? ` (retry ${retryCount}/${MAX_RETRIES})` : ''}...`
    );

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 3000,
      family: 4,
      retryWrites: true,
      bufferCommands: false,
      maxPoolSize: 5,
      minPoolSize: 1
    });

    connectionStatus = 'connected';
    retryCount = 0;
    useMockDB = false;
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    connectionStatus = 'disconnected';
    console.error(`MongoDB connection failed: ${err.message}`);

    const shouldFallbackToMock =
      process.env.NODE_ENV !== 'production' && isLocalMongoUri(process.env.MONGO_URI || '');

    if (shouldFallbackToMock) {
      console.log('Local MongoDB unavailable; switching to mock database for development');
      enableMockDB();
      return true;
    }

    if (retryCount < MAX_RETRIES) {
      retryCount += 1;
      const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
      console.log(`Retrying in ${delayMs}ms (attempt ${retryCount}/${MAX_RETRIES})...`);

      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      retryTimer = setTimeout(() => {
        connectDB(true);
      }, delayMs);
    } else {
      console.warn('MongoDB connection max retries reached');
      console.log('Falling back to mock database for development');
      console.log('Data will be stored in local mock persistence');
      enableMockDB();
      return true;
    }

    return false;
  }
};

const getConnectionStatus = () => ({
  status: connectionStatus,
  isConnected: connectionStatus.includes('connected'),
  mongoUri: process.env.MONGO_URI ? '***' : 'not-set',
  retryAttempt: `${retryCount}/${MAX_RETRIES}`,
  useMockDB
});

const getCollection = (collectionName) => {
  if (useMockDB && mockDB) {
    return mockDB.getCollection(collectionName);
  }

  return null;
};

process.on('SIGTERM', () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
  }

  if (mockDB) {
    mockDB.close();
  }
});

module.exports = {
  connectDB,
  getConnectionStatus,
  getCollection,
  getMockDB: () => mockDB,
  isUsingMockDB: () => useMockDB
};
