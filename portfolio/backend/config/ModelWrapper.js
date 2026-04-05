/**
 * Model Wrapper - Works with both Mongoose and Mock Database
 * Transparently switches between real MongoDB and in-memory storage
 */

const { isUsingMockDB, getMockDB } = require('./db');

class ModelWrapper {
  constructor(mongooseModel, collectionName) {
    this.model = mongooseModel;
    this.collectionName = collectionName;
  }

  async findOne(query) {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection(this.collectionName);
      return collection.findOne(query);
    }
    return this.model.findOne(query);
  }

  async findOneAndUpdate(query, update, options = {}) {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection(this.collectionName);
      return collection.findOneAndUpdate(query, update, options);
    }
    return this.model.findOneAndUpdate(query, update, options);
  }

  async insertOne(doc) {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection(this.collectionName);
      return collection.insertOne(doc);
    }
    return new this.model(doc).save();
  }

  async find(query = {}) {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection(this.collectionName);
      return collection.find(query);
    }
    return this.model.find(query);
  }

  async updateMany(query, update) {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection(this.collectionName);
      return collection.updateMany(query, update);
    }
    return this.model.updateMany(query, update);
  }

  async deleteOne(query) {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection(this.collectionName);
      return collection.deleteOne(query);
    }
    return this.model.deleteOne(query);
  }

  async countDocuments(query = {}) {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      const collection = mockDB.getCollection(this.collectionName);
      return collection.countDocuments(query);
    }
    return this.model.countDocuments(query);
  }

  // Direct access to Mongoose model
  getMongooseModel() {
    return this.model;
  }

  // Direct access to mock DB collection
  getMockCollection() {
    if (isUsingMockDB()) {
      const mockDB = getMockDB();
      return mockDB.getCollection(this.collectionName);
    }
    return null;
  }
}

module.exports = ModelWrapper;
