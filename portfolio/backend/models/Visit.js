const mongoose = require('mongoose');
const wrapModel = require('../config/wrapModel');

const visitSchema = new mongoose.Schema({
  ip: String,
  path: String,
  userAgent: String,
  timeSpent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const VisitModel = mongoose.model('Visit', visitSchema);
module.exports = wrapModel(VisitModel, 'visits');
