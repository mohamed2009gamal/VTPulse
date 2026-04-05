const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const { connectDB, getConnectionStatus } = require('./config/db');

const app = express();

console.log('=== STARTING SERVER ===');

// ✅ Health check endpoint - MUST BE FIRST (before all middleware!)
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  const dbStatus = getConnectionStatus();
  const statusCode = dbStatus.isConnected ? 200 : 503;
  res.status(statusCode).json({
    server: 'running',
    database: dbStatus.status,
    mongoUri: dbStatus.mongoUri,
    retryAttempt: dbStatus.retryAttempt
  });
});
console.log('✅ Health endpoint registered (FIRST)');

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
    console.error(`✗ Failed to load ${routePath}:`);
    console.error(`  Error: ${err.message}`);
    if (err.stack) {
      const lines = err.stack.split('\n');
      console.error(`  Stack: ${lines.slice(1, 3).join('\n    ')}`);
    }
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

// 🔥 START SERVER IMMEDIATELY (MongoDB connects in background)
const PORT = process.env.PORT || 4000;

// Start MongoDB connection in background (not awaited)
connectDB();

// Start Express server immediately
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Server running on http://localhost:${PORT} ===`);
  console.log('\nTest URLs:');
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://localhost:${PORT}/api/health`);
  console.log(`  http://localhost:${PORT}/test-direct`);
  console.log(`  http://localhost:${PORT}/api/auth/google`);
  console.log(`  http://localhost:${PORT}/api/chat/chat (POST)`);
  console.log('========================\n');
  console.log('💡 MongoDB will connect in background. Check /api/health for status.\n');
});

// ✅ Process safety
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
