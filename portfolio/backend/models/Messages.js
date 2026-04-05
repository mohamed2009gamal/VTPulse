const mongoose = require('mongoose');
const wrapModel = require('../config/wrapModel');

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    message: {
      type: String,
      required: true
    },
    privacy: {
      type: Boolean,
      default: false
    },
    replies: [{
      reply: {
        type: String,
        required: true
      },
      repliedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

const MessageModel = mongoose.model('Message', messageSchema);
module.exports = wrapModel(MessageModel, 'messages');

