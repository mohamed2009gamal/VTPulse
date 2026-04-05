const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require('../models/admin');

const router = express.Router();

// Login admin
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let isValid;
    try {
      isValid = await bcrypt.compare(password, admin.password);
    } catch (bcryptErr) {
      console.error('Bcrypt error:', bcryptErr);
      return res.status(500).json({ message: 'Password comparison error' });
    }
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session with timestamp for 30-minute expiration
    const sessionToken = Buffer.from(`${admin._id}:${Date.now()}`).toString('base64');
    res.cookie('adminAuth', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    res.json({ message: 'Login successful', adminId: admin._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout admin
router.post('/admin/logout', (req, res) => {
  res.clearCookie('adminAuth');
  res.json({ message: 'Logged out successfully' });
});

// Register admin
router.post('/register', async (req, res) => {
  try {
    const { email, password, adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword });
    await admin.save();

    res.json({ message: 'Admin created' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating admin' });
  }
});

module.exports = router;
