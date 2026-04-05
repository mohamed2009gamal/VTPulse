const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Visit',
  new mongoose.Schema({
    ip: String,
    path: String,
    userAgent: String,
    timeSpent: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  })
);
