const mongoose = require('mongoose');
const wrapModel = require('../config/wrapModel');

const blogVoteSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  voterId: { type: String, required: true },
  vote: { type: Number, enum: [1, -1], required: true },
  createdAt: { type: Date, default: Date.now }
});

blogVoteSchema.index({ blog: 1, voterId: 1 }, { unique: true });

const BlogVoteModel = mongoose.model('BlogVote', blogVoteSchema);
module.exports = wrapModel(BlogVoteModel, 'blogvotes');