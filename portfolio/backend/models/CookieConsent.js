const mongoose = require('mongoose');
const wrapModel = require('../config/wrapModel');

const cookieConsentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['accepted', 'rejected'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

const CookieConsentModel = mongoose.model('CookieConsent', cookieConsentSchema);
module.exports = wrapModel(CookieConsentModel, 'cookieconsents');
