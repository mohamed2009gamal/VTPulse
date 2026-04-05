const mongoose = require('mongoose');
const wrapModel = require('../config/wrapModel');

const clickSchema = new mongoose.Schema({
  element: String,
  path: String,
  createdAt: { type: Date, default: Date.now }
});

const ClickModel = mongoose.model('Click', clickSchema);
module.exports = wrapModel(ClickModel, 'clicks');
