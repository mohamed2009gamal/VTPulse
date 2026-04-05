const Admin = require('../models/admin');
const dbModule = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.adminAuth;
    
    if (!token) {
      return res.status(401).json({ error: 'No auth token' });
    }

    const decoded = Buffer.from(token, 'base64').toString();
    const [adminId, issuedAt] = decoded.split(':');
    
    const now = Date.now();
    if (now - parseInt(issuedAt) > 30 * 60 * 1000) {
      return res.status(401).json({ error: 'Session expired' });
    }

    let admin;
    try {
      admin = await Admin.findById(adminId).lean();
    } catch (dbErr) {
      console.error('Admin lookup error:', dbErr.message);
      // Fallback to mock if available
      const mockDB = dbModule.getMockDB ? dbModule.getMockDB() : null;
      if (mockDB) {
        admin = mockDB.admins.find(a => a._id.toString() === adminId);
      } else {
        return res.status(500).json({ error: 'Database unavailable' });
      }
    }

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin' });
    }

    if (admin.deletedAt) {
      return res.status(401).json({ error: 'Admin account is no longer active' });
    }

    if ((admin.approvalStatus || 'approved') !== 'approved') {
      return res.status(403).json({ error: 'Admin approval required' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Auth failed' });
  }
};

