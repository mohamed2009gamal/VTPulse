const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    // Whether this account is allowed to log in using email/password
    localAllowed: {
      type: Boolean,
      default: true
    },
    // Whether this account is allowed to log in using Google OAuth
    googleAllowed: {
      type: Boolean,
      default: true
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'approved'
    },
    approvalReviewedAt: {
      type: Date,
      default: null
    },
    approvalReviewedBy: {
      type: String,
      default: null
    },
    // When this admin was "deleted" logically (for archive view). If null, active.
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const AdminModel = mongoose.model('Admin', adminSchema);

// Wrapper to support both Mongoose and Mock Database
class AdminWrapper {
  static async findOne(query) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.findOne(query);
    }
    return AdminModel.findOne(query);
  }

  static async findById(id) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.findOne({ _id: id });
    }
    return AdminModel.findById(id);
  }

  static async create(doc) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.insertOne(doc);
    }
    return AdminModel.create(doc);
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.findOneAndUpdate(query, update, options);
    }
    return AdminModel.findOneAndUpdate(query, update, options);
  }

  static async find(query = {}) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.find(query);
    }
    return AdminModel.find(query);
  }

  static async countDocuments(query = {}) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.countDocuments(query);
    }
    return AdminModel.countDocuments(query);
  }

  static async updateMany(query, update) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.updateMany(query, update);
    }
    return AdminModel.updateMany(query, update);
  }

  static async deleteOne(query) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('admins');
      return collection.deleteOne(query);
    }
    return AdminModel.deleteOne(query);
  }
}

module.exports = AdminWrapper;
