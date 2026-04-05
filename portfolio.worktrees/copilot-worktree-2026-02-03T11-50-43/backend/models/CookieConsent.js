const mongoose = require('mongoose');

module.exports = mongoose.model(
  'CookieConsent',
  new mongoose.Schema({
    status: {
      type: String,
      enum: ['accepted', 'rejected'],
      required: true
    },
    createdAt: { type: Date, default: Date.now }
  })
);
