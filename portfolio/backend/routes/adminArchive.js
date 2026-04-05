const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const Admin = require('../models/admin');
const AdminAudit = require('../models/AdminAudit');

// Get logically deleted admin accounts
router.get('/deleted', adminAuth, async (req, res) => {
  try {
    const admins = await Admin.find(
      { deletedAt: { $ne: null } },
      'email localAllowed googleAllowed deletedAt createdAt updatedAt'
    ).sort({ deletedAt: -1 });
    res.json(admins);
  } catch (err) {
    console.error('Admin archive deleted error:', err);
    res.status(500).json({ message: 'Failed to load deleted admins' });
  }
});

// Get audit log of admin credential/login info changes
router.get('/audit', adminAuth, async (req, res) => {
  try {
    const records = await AdminAudit.find({})
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(records);
  } catch (err) {
    console.error('Admin archive audit error:', err);
    res.status(500).json({ message: 'Failed to load admin audit history' });
  }
});

module.exports = router;

