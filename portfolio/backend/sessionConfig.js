const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/venomtech',
    collectionName: 'sessions'
  })
};

module.exports = sessionConfig;
