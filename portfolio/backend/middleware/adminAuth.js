const Admin = require('../models/admin');

module.exports = async (req, res, next) => {
  try {
    console.log(`[adminAuth] ${req.method} ${req.originalUrl}`);
    // Check for adminAuth cookie first
    const token = req.cookies.adminAuth;
    
    if (!token) {
      console.log('[adminAuth] missing token');
      return res.status(401).json({ error: 'No auth token' });
    }

    // Decode the token to get admin ID and expiry
    const decoded = Buffer.from(token, 'base64').toString();
    const [adminId, issuedAt] = decoded.split(':');
    
    // Check if token is expired (30 min)
    const now = Date.now();
    if (now - parseInt(issuedAt) > 30 * 60 * 1000) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      console.log('[adminAuth] admin not found');
      return res.status(401).json({ error: 'Invalid admin' });
    }

    if (admin.deletedAt) {
      return res.status(401).json({ error: 'Admin account is no longer active' });
    }

    if ((admin.approvalStatus || 'approved') !== 'approved') {
      return res.status(403).json({ error: 'Admin approval required' });
    }

    // Add admin to request
    req.admin = admin;
    console.log(`[adminAuth] authorized ${admin.email}`);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Auth failed' });
  }
};
