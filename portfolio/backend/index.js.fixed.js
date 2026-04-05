require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import ALL from config/db - supports both versions
const dbModule = require('./config/db');
const connectDB = dbModule.connectDB || dbModule.default || (() => console.log('DB module not found'));
const getConnectionStatus = dbModule.getConnectionStatus || (() => ({ status: 'unknown' }));

const app = express();

console.log('=== STARTING SERVER ===');

// ✅ Health check FIRST
app.get('/api/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  const statusCode = dbStatus.isConnected ? 200 : 503;
  res.status(statusCode).json({
    server: 'running',
    database: dbStatus.status || 'unknown',
    mongoUri: process.env.MONGO_URI ? '***' : 'not-set'
  });
});

console.log('✅ Health endpoint registered');

// 🔥 TRUST PROXY
app.set('trust proxy', 1);

// ✅ CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  name: 'venomtech.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24*60*60*1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const loadRoute = (pathName, routePath) => {
  try {
    const route = require(routePath);
    app.use(pathName, route);
    console.log(`✓ ${routePath}`);
  } catch (err) {
    console.error(`✗ ${routePath}:`, err.message);
  }
};

console.log('Loading routes...');
loadRoute('/api/chat', './routes/chat');
loadRoute('/api/auth', './routes/auth');
loadRoute('/api/messages', './routes/messages');
loadRoute('/api/dashboard', './routes/dashboard');
loadRoute('/api/admin-archive', './routes/adminArchive');
loadRoute('/api/track', './routes/track');
loadRoute('/api/blogs', './routes/blogs');
console.log('Routes loaded');

app.get('/', (req, res) => res.send('Backend running 🚀'));

// Global error handler
app.use((err, req, res) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 4000;

// DB connect + start
const startServer = async () => {
  try {
    console.log('Connecting DB...');
    await connectDB();
  } catch (err) {
    console.error('DB connect failed:', err.message);
    console.log('Starting without full DB...');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server on http://localhost:${PORT}`);
    console.log('Test: http://localhost:4000/api/health');
  });
};

startServer();

