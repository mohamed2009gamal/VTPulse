require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

console.log('=== STARTING SERVER ===');

// 🔥 TRUST PROXY (IMPORTANT for production / cookies)
app.set('trust proxy', 1);

// ✅ CORS (better handling)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3003',
  'http://localhost:3005',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:3000/',
  'http://127.0.0.1:3000/'
];

// ✅ Improved CORS - more robust origin matching
const normalizeOrigin = (origin) => origin ? origin.replace(/\/$/, '') : '';

app.use(cors({
  origin: function (origin, callback) {
    const normOrigin = normalizeOrigin(origin);
    
    // Allow null/empty origins (Postman, curl, etc.)
    if (!origin || !normOrigin) {
      console.log('✅ CORS allowed: no-origin (Postman/cURL)');
      return callback(null, true);
    }
    
    // Allow all localhost/127.0.0.1 on ports 3000-3005
    if (/^https?:\/\/(localhost|127\.0\.0\.1):300[0-5]$/.test(normOrigin)) {
      console.log(`✅ CORS allowed (localhost): ${origin}`);
      return callback(null, true);
    }
    
    // Check exact/startsWith against allowed list (normalized)
    const isAllowed = allowedOrigins.some(allowed => {
      const normAllowed = normalizeOrigin(allowed);
      return normOrigin === normAllowed || normOrigin.startsWith(normAllowed);
    });
    
    if (isAllowed) {
      console.log(`✅ CORS allowed (list): ${origin}`);
      return callback(null, true);
    }
    
    // Reject non-matching origins cleanly
    console.warn(`❌ CORS denied: ${origin} (not in allowed list)`);
    return callback(new Error(`CORS not allowed at origin: ${origin}`), false);
  },
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browsers
}));


// ✅ Body parser
app.use(express.json());

// ✅ Cookies
app.use(cookieParser());

// ✅ Session (fixed)
app.use(session({
  name: 'venomtech.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // MUST be true in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ✅ Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔥 ROUTES LOADER FUNCTION (cleaner)
const loadRoute = (pathName, routePath) => {
  try {
    const route = require(routePath);
    app.use(pathName, route);
    console.log(`✓ ${routePath} mounted on ${pathName}`);
  } catch (err) {
    console.error(`✗ Failed to load ${routePath}:`, err.message);
  }
};

console.log('\n--- Loading routes ---');

loadRoute('/api/chat', './routes/chat');
loadRoute('/api/auth', './routes/auth');
loadRoute('/api/messages', './routes/messages');
loadRoute('/api/dashboard', './routes/dashboard');
loadRoute('/api/admin-archive', './routes/adminArchive');
loadRoute('/api/track', './routes/track');
loadRoute('/api/blogs', './routes/blogs');

console.log('--- All routes loaded ---\n');

// ✅ Test routes
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.get('/test-direct', (req, res) => {
  res.json({ message: 'Direct test route works!' });
});

app.get('/api/test-direct', (req, res) => {
  res.json({ message: 'API direct test route works!' });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 🔥 START SERVER AFTER DB CONNECTS WITH RETRY
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  let retryCount = 0;
  const maxRetries = 5;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`\\n🔄 DB connection attempt ${retryCount + 1}/${maxRetries}`);
      await connectDB();
      console.log('✓ MongoDB connected successfully');
      break;
    } catch (err) {
      retryCount++;
      console.error(`DB attempt ${retryCount} failed:`, err.message);
      if (retryCount >= maxRetries) {
        console.error('❌ Max retries reached. Starting server without full DB (some routes limited)');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // exponential backoff
    }
  }

  // Set global Mongoose query timeouts even if connection failed
  const mongoose = require('mongoose');
  mongoose.set('bufferTimeoutMS', 5000); // 5s query timeout
  mongoose.set('debug', process.env.NODE_ENV === 'development');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\\n=== Server running on http://localhost:${PORT} ===`);
    console.log('\\nTest URLs:');
    console.log(`  http://localhost:${PORT}/`);
    console.log(`  http://localhost:${PORT}/test-direct`);
    console.log(`  http://localhost:${PORT}/api/auth/google`);
    console.log(`  http://localhost:${PORT}/api/chat/chat (POST)`);
    console.log('========================\\n');
  });
};

startServer();

// ✅ Process safety
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

