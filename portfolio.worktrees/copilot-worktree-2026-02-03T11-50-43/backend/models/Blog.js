const mongoose = require('mongoose');

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
  dislikes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Blog', blogSchema);
