/**
 * Universal Model Wrapper Factory
 * Automatically wraps any Mongoose model to work with both real MongoDB and mock database
 */

function wrapModel(mongooseModel, collectionName) {
class WrappedModel {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    return this.constructor.create(this);
  }
    static async findOne(query) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        return collection.findOne(query);
      }
      return mongooseModel.findOne(query);
    }

    static async findById(id) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        return collection.findOne({ _id: id });
      }
      return mongooseModel.findById(id);
    }

    static async find(query = {}) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        const cursor = collection.find(query);
        return cursor && typeof cursor.toArray === 'function' ? cursor.toArray() : cursor;
      }
      return mongooseModel.find(query);
    }

    static aggregate(pipeline) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const runAggregation = async () => {
          const mockDB = getMockDB();
          const collection = mockDB.getCollection(collectionName);
          let data = await collection.find({}).toArray();

          const resolveExpression = (doc, expression) => {
            if (typeof expression === 'string') {
              return expression.startsWith('$') ? doc[expression.slice(1)] : expression;
            }

            if (expression && typeof expression === 'object' && expression.$ifNull) {
              const [fieldRef, fallback] = expression.$ifNull;
              const value = resolveExpression(doc, fieldRef);
              return value == null ? fallback : value;
            }

            return expression;
          };

          for (const stage of pipeline) {
            if (stage.$group) {
              const grouped = new Map();
              for (const doc of data) {
                const groupKey = resolveExpression(doc, stage.$group._id);
                const existing = grouped.get(groupKey) || { _id: groupKey };

                for (const [field, operation] of Object.entries(stage.$group)) {
                  if (field === '_id') continue;
                  if (operation && operation.$sum === 1) {
                    existing[field] = (existing[field] || 0) + 1;
                  }
                }

                grouped.set(groupKey, existing);
              }
              data = Array.from(grouped.values());
              continue;
            }

            if (stage.$sort) {
              const sortEntries = Object.entries(stage.$sort);
              data.sort((a, b) => {
                for (const [field, direction] of sortEntries) {
                  if (a[field] === b[field]) continue;
                  const multiplier = direction < 0 ? -1 : 1;
                  return (a[field] > b[field] ? 1 : -1) * multiplier;
                }
                return 0;
              });
              continue;
            }

            if (stage.$limit) {
              data = data.slice(0, stage.$limit);
            }
          }

          return data;
        };

        return Promise.resolve().then(runAggregation);
      }
      return mongooseModel.aggregate(pipeline);
    }

    static async create(doc) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        const result = await collection.insertOne(doc);
        return { _id: result.insertedId, ...doc };
      }
      return mongooseModel.create(doc);
    }

    static async findOneAndUpdate(query, update, options = {}) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        return collection.findOneAndUpdate(query, update, options);
      }
      return mongooseModel.findOneAndUpdate(query, update, options);
    }

    static async updateMany(query, update) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        return collection.updateMany(query, update);
      }
      return mongooseModel.updateMany(query, update);
    }

    static async deleteOne(query) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        return collection.deleteOne(query);
      }
      return mongooseModel.deleteOne(query);
    }

    static async countDocuments(query = {}) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        return collection.countDocuments(query);
      }
      return mongooseModel.countDocuments(query);
    }

    static async deleteMany(query) {
      const { isUsingMockDB, getMockDB } = require('../config/db');
      if (isUsingMockDB()) {
        const mockDB = getMockDB();
        const collection = mockDB.getCollection(collectionName);
        // Note: Mock DB deleteOne only removes one, so we simulate deleteMany
        let deleted = 0;
        const docs = await collection.find(query).toArray();
        for (const doc of docs) {
          await collection.deleteOne({ _id: doc._id });
          deleted++;
        }
        return { deletedCount: deleted };
      }
      return mongooseModel.deleteMany(query);
    }

    // Passthrough to Mongoose model for advanced operations
    static getMongooseModel() {
      return mongooseModel;
    }
  };

  return WrappedModel;
}

module.exports = wrapModel;
