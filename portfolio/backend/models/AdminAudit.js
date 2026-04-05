const mongoose = require('mongoose');

const adminAuditSchema = new mongoose.Schema(
  {
    adminEmail: { type: String, required: true },
    action: { type: String, required: true }, // e.g. 'created', 'credentials_updated', 'deleted', 'login'
    actorEmail: { type: String }, // who performed the action (admin)
    // when action === 'login', this will be 'google' or 'local'
    loginMethod: { type: String },
    details: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const AuditModel = mongoose.model('AdminAudit', adminAuditSchema);

// Wrapper to support both Mongoose and Mock Database
class AdminAuditWrapper {
  static async create(doc) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('adminaudits');
      return collection.insertOne(doc);
    }
    return AuditModel.create(doc);
  }

  static async find(query = {}) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('adminaudits');
      return collection.find(query);
    }
    return AuditModel.find(query);
  }

  static async countDocuments(query = {}) {
    const { isUsingMockDB, getMockDB } = require('../config/db');
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection('adminaudits');
      return collection.countDocuments(query);
    }
    return AuditModel.countDocuments(query);
  }
}

module.exports = AdminAuditWrapper;


