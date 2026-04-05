const mongoose = require('mongoose');
const wrapModel = require('../config/wrapModel');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  images: [{
    type: String // URLs or paths to images
  }],
  videos: [{
    type: String // URLs or paths to videos
  }],
  website: {
    type: String, // URL to website
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publisher: {
    name: {
      type: String,
      default: 'Admin'
    },
    avatar: {
      type: String // URL or path to publisher avatar
    }
  },
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  reads: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  }
});

// Pre-save hook to prevent negative likes
// synchronous version avoids needing a `next` callback (disallowing
// middleware errors like "next is not a function").
blogSchema.pre('save', function() {
  this.likes = Math.max(0, this.likes);
});

const BlogModel = mongoose.model('Blog', blogSchema);
module.exports = wrapModel(BlogModel, 'blogs');

