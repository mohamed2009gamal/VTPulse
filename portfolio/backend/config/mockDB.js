/**
 * Mock/In-Memory Database
 * Mimics MongoDB behavior for development without external dependencies
 * Switch to real MongoDB anytime by setting MONGO_URI environment variable
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MockDatabase {
  constructor() {
    this.db = {};
    this.dataFile = path.join(__dirname, '../data.json');
    this.loadFromDisk();
    console.log('📦 Mock Database initialized (in-memory with file persistence)');
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf-8');
        this.db = JSON.parse(data);
        console.log('✅ Loaded existing data from disk');
      } else {
        this.db = {};
        this.saveToDisk();
        console.log('✅ Created new data store');
      }
    } catch (err) {
      console.warn('⚠️  Could not load data:', err.message);
      this.db = {};
    }
  }

  saveToDisk() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.db, null, 2));
    } catch (err) {
      console.warn('⚠️  Could not save data to disk:', err.message);
    }
  }

  getCollection(name) {
    if (!this.db[name]) {
      this.db[name] = [];
    }
    return {
      findOne: async (query) => {
        const result = this.db[name].find(doc => this._matchesQuery(doc, query));
        return result || null;
      },
      findOneAndUpdate: async (query, update, options = {}) => {
        const index = this.db[name].findIndex(doc => this._matchesQuery(doc, query));
        if (index !== -1) {
          const doc = this.db[name][index];
          const updatedDoc = { ...doc, ...update.$set };
          this.db[name][index] = updatedDoc;
          this.saveToDisk();
          return { value: updatedDoc };
        }
        if (options.upsert) {
          const newDoc = { _id: crypto.randomBytes(12).toString('hex'), ...update.$set };
          this.db[name].push(newDoc);
          this.saveToDisk();
          return { value: newDoc };
        }
        return { value: null };
      },
      insertOne: async (doc) => {
        const newDoc = { _id: crypto.randomBytes(12).toString('hex'), ...doc };
        this.db[name].push(newDoc);
        this.saveToDisk();
        return { insertedId: newDoc._id };
      },
      find: (query = {}) => {
        const results = this.db[name].filter(doc => this._matchesQuery(doc, query));
        return this._createCursor(results);
      },
      updateMany: async (query, update) => {
        let count = 0;
        this.db[name] = this.db[name].map(doc => {
          if (this._matchesQuery(doc, query)) {
            count++;
            return this._applyUpdate(doc, update);
          }
          return doc;
        });
        this.saveToDisk();
        return { modifiedCount: count };
      },
      deleteOne: async (query) => {
        const index = this.db[name].findIndex(doc => this._matchesQuery(doc, query));
        if (index !== -1) {
          this.db[name].splice(index, 1);
          this.saveToDisk();
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
      countDocuments: async (query = {}) => {
        return this.db[name].filter(doc => this._matchesQuery(doc, query)).length;
      }
    };
  }

  _createCursor(results) {
    let current = [...results];

    const cursor = {
      limit: (n) => {
        current = current.slice(0, n);
        return cursor;
      },
      skip: (n) => {
        current = current.slice(n);
        return cursor;
      },
      sort: (sortSpec = {}) => {
        const entries = Object.entries(sortSpec);
        current.sort((a, b) => {
          for (const [field, direction] of entries) {
            const aValue = this._getFieldValue(a, field);
            const bValue = this._getFieldValue(b, field);
            if (aValue === bValue) continue;
            const multiplier = direction < 0 ? -1 : 1;
            return (aValue > bValue ? 1 : -1) * multiplier;
          }
          return 0;
        });
        return cursor;
      },
      toArray: async () => [...current]
    };

    return cursor;
  }

  _applyUpdate(doc, update = {}) {
    const nextDoc = { ...doc };

    if (update.$set) {
      Object.assign(nextDoc, update.$set);
    }

    if (update.$push) {
      for (const [key, value] of Object.entries(update.$push)) {
        const current = Array.isArray(nextDoc[key]) ? nextDoc[key] : [];
        nextDoc[key] = [...current, value];
      }
    }

    return nextDoc;
  }

  _getFieldValue(doc, key) {
    return key.split('.').reduce((value, part) => (value == null ? value : value[part]), doc);
  }

  _matchesQuery(doc, query) {
    if (Object.keys(query).length === 0) return true;
    for (const [key, value] of Object.entries(query)) {
      const docValue = this._getFieldValue(doc, key);

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        for (const [operator, expected] of Object.entries(value)) {
          if (operator === '$exists') {
            const exists = typeof docValue !== 'undefined';
            if (exists !== expected) return false;
            continue;
          }

          if (operator === '$gte') {
            if (!(docValue >= expected)) return false;
            continue;
          }

          if (operator === '$gt') {
            if (!(docValue > expected)) return false;
            continue;
          }

          if (operator === '$lte') {
            if (!(docValue <= expected)) return false;
            continue;
          }

          if (operator === '$lt') {
            if (!(docValue < expected)) return false;
            continue;
          }

          if (operator === '$in') {
            if (!Array.isArray(expected) || !expected.includes(docValue)) return false;
            continue;
          }

          if (docValue !== expected) return false;
        }
        continue;
      }

      if (docValue !== value) return false;
    }
    return true;
  }

  async connect() {
    console.log('✅ Mock Database "connected"');
    return true;
  }

  async close() {
    this.saveToDisk();
    return true;
  }
}

module.exports = MockDatabase;
