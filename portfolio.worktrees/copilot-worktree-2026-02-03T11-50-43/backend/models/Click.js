const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Click',
  new mongoose.Schema({
    element: String,
    path: String,
    createdAt: { type: Date, default: Date.now }
  })
);
