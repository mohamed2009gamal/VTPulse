const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
console.log('>>> Loading auth.js routes file <<<');
const Admin = require('../models/admin');
const adminAuth = require('../middleware/adminAuth');
const AdminAudit = require('../models/AdminAudit');
const { getConnectionStatus } = require('../config/db');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

// Helper to handle DB errors
const handleDBError = (err, res) => {
  console.error('Database error:', err.message);
  const dbStatus = getConnectionStatus();
  
  if (!dbStatus.isConnected) {
    return res.status(503).json({
      message: 'Database temporarily unavailable. Please try again in a moment.',
      error_code: 'DB_UNAVAILABLE',
      db_status: dbStatus.status,
      retry_attempt: dbStatus.retryAttempt
    });
  }
  
  return res.status(500).json({
    message: 'Database error. Please try again.',
    error_code: 'DB_ERROR'
  });
};

const router = express.Router();

console.log('Auth router created');


// ========================
// SESSION COOKIE
// ========================

function issueSession(res, admin) {
  const sessionToken = Buffer.from(`${admin._id}:${Date.now()}`).toString('base64');

  res.cookie('adminAuth', sessionToken, {
    httpOnly: true,
    // Only mark as secure in real production behind HTTPS
    secure: process.env.NODE_ENV === 'production',
    // Lax works better with redirects and cross-origin dev setups
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000
  });
}

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined'
};

function getApprovalStatus(admin) {
  return admin?.approvalStatus || APPROVAL_STATUS.APPROVED;
}

function isApprovedAdmin(admin) {
  return !admin?.deletedAt && getApprovalStatus(admin) === APPROVAL_STATUS.APPROVED;
}

function getApprovalMessage(admin) {
  const status = getApprovalStatus(admin);

  if (status === APPROVAL_STATUS.PENDING) {
    return 'Your registration is pending admin approval.';
  }

  if (status === APPROVAL_STATUS.DECLINED) {
    return 'Your registration was declined. Contact an admin for more information.';
  }

  if (admin?.deletedAt) {
    return 'This admin account is no longer active.';
  }

  return 'This account is not allowed to access the dashboard.';
}

function serializeAdmin(admin) {
  return {
    _id: admin._id,
    name: admin.name || '',
    email: admin.email,
    localAllowed: admin.localAllowed,
    googleAllowed: admin.googleAllowed,
    approvalStatus: getApprovalStatus(admin),
    approvalReviewedAt: admin.approvalReviewedAt,
    approvalReviewedBy: admin.approvalReviewedBy,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt
  };
}


// ========================
// PASSPORT STRATEGIES
// ========================

if (!passport._strategiesConfigured) {

  console.log('Configuring passport strategies...');

  // ========================
  // GOOGLE STRATEGY
  // ========================

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            'http://localhost:4000/api/auth/google/callback'
        },

        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails && profile.emails[0].value;

            if (!email) {
              return done(new Error('No email from Google'));
            }

            console.log('Google login attempt:', email);

            // Only allow Google login for accounts that already exist in Admin
            // and have googleAllowed=true (managed from the dashboard).
            let admin;
            try {
              admin = await Admin.findOne({ email });
            } catch (dbErr) {
              console.error('Database error checking admin:', dbErr.message);
              return done(new Error('Database connection failed. Please ensure MongoDB is running and accessible.'));
            }

            if (!admin) {
              console.log('Google login blocked (no matching admin record):', email);
              return done(new Error('This Google account is not allowed to access the dashboard'));
            }

            if (!isApprovedAdmin(admin)) {
              console.log('Google login blocked by approval status:', email, getApprovalStatus(admin));
              return done(new Error(getApprovalMessage(admin)));
            }

            if (admin.googleAllowed === false) {
              console.log('Google login blocked for admin (googleAllowed=false):', email);
              return done(new Error('Google login disabled for this account'));
            }

            console.log('Authorized Google admin login:', email);
            return done(null, admin);
          } catch (err) {
            console.error('Google OAuth error:', err);
            return done(err);
          }
        }
      )
    );

    console.log('✓ Google OAuth strategy registered');

  } else {
    console.log('✗ Google OAuth not configured');
  }


  // ========================
  // GITHUB STRATEGY
  // ========================

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {

    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL:
            process.env.GITHUB_CALLBACK_URL ||
            'http://localhost:4000/api/auth/github/callback',
          scope: ['user:email']
        },

        async (accessToken, refreshToken, profile, done) => {
          try {

            const email = profile.emails && profile.emails[0]?.value;

            if (!email) {
              return done(new Error('No email from GitHub'));
            }

            let admin;
            try {
              admin = await Admin.findOne({ email });
            } catch (dbErr) {
              console.error('Database error checking admin:', dbErr.message);
              return done(new Error('Database connection failed. Please ensure MongoDB is running and accessible.'));
            }

            if (!admin || admin.deletedAt) {
              return done(new Error('This GitHub account is not allowed to access the dashboard'));
            }

            if (!isApprovedAdmin(admin)) {
              return done(new Error(getApprovalMessage(admin)));
            }

            return done(null, admin);

          } catch (err) {
            return done(err);
          }
        }
      )
    );

    console.log('✓ GitHub OAuth strategy registered');

  } else {
    console.log('✗ GitHub OAuth not configured');
  }

passport._strategiesConfigured = true;

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Admin.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
}


// ========================
// DEBUG ROUTES
// ========================

router.get('/test', (req, res) => {
  res.json({ message: 'Auth router works' });
});

router.get('/providers', (req, res) => {
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const githubEnabled = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  res.json({
    google: googleEnabled,
    github: githubEnabled,
    message: !googleEnabled ? 'Set GOOGLE_CLIENT_ID/SECRET in .env' : 'Ready',
    githubMessage: !githubEnabled ? 'Set GITHUB_CLIENT_ID/SECRET in .env' : 'Ready'
  });
});


// ========================
// GOOGLE LOGIN
// ========================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✓ Google routes enabled');
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );
} else {
  console.log('✗ Google routes disabled (no env vars)');
  router.get('/google', (req, res) => {
    res.status(503).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' });
  });
}


if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/api/auth/failure'
    }),
    async (req, res) => {
      try {
        issueSession(res, req.user);
        // audit...
        try {
          await AdminAudit.create({
            adminEmail: req.user.email,
            actorEmail: req.user.email,
            action: 'login',
            loginMethod: 'google',
            details: {}
          });
        } catch (auditErr) {
          console.error('AdminAudit error (google login):', auditErr);
        }
        res.redirect(
          process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/dashboard`
            : 'http://localhost:3000/dashboard'
        );
      } catch (err) {
        console.error('Google callback error:', err);
        res.redirect('/api/auth/failure');
      }
    }
  );
}


// ========================
// GITHUB LOGIN
// ========================

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  console.log('✓ GitHub routes enabled');
  router.get(
    '/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );
} else {
  console.log('✗ GitHub routes disabled');
  router.get('/github', (req, res) => {
    res.status(503).json({ error: 'GitHub OAuth not configured' });
  });
}


if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  router.get(
    '/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/api/auth/failure'
    }),
    (req, res) => {
      issueSession(res, req.user);
      res.redirect(
        process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/dashboard`
          : 'http://localhost:3000/dashboard'
      );
    }
  );
}


// ========================
// FAILURE ROUTE
// ========================

router.get('/failure', (req, res) => {
  res.status(401).json({ message: 'OAuth login failed' });
});


// ========================
// ADMIN LOGIN (EMAIL)
// ========================
router.post('/admin/login', async (req, res) => {
  console.log('LOGIN attempt:', req.body ? req.body.email : 'NO BODY');
  try {
    // Check database status first
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      console.error('❌ Database is not connected');
      return res.status(503).json({ 
        message: 'Database is not available. Please start MongoDB and try again.',
        db_status: dbStatus.status
      });
    }

    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';
    console.log('Parsed email:', email, 'password exists:', !!password);

    if (!normalizedEmail || !password) {
      console.log('400 - missing fields');
      return res.status(400).json({ message: 'Email and password required' });
    }

    console.log('Finding admin:', normalizedEmail);
    let admin;
    try {
      admin = await Admin.findOne({ email: normalizedEmail });
    } catch (dbErr) {
      console.error('Database error during login:', dbErr.message);
      const dbStatus = getConnectionStatus();
      if (dbStatus.useMockDB) {
        // Try mock DB
        const mockDB = dbStatus.getMockDB ? dbStatus.getMockDB() : null;
        if (mockDB) {
          admin = mockDB.admins.find(a => a.email === normalizedEmail);
        }
      }
      if (!admin) {
        return res.status(503).json({ 
          message: 'Database query failed. Please ensure MongoDB is running and accessible.',
          error: dbErr.message
        });
      }
    }
    console.log('Admin found:', !!admin);


    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!isApprovedAdmin(admin)) {
      return res.status(403).json({ message: getApprovalMessage(admin) });
    }

    if (admin.localAllowed === false) {
      return res.status(403).json({ message: 'Email/password login disabled for this account' });
    }

    console.log('Comparing password...');
    const valid = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', valid);

    if (!valid) {
      console.log('401 invalid pass');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Issuing session');
    issueSession(res, admin);


    // audit: login via email/password
    try {
      await AdminAudit.create({
        adminEmail: admin.email,
        actorEmail: admin.email,
        action: 'login',
        loginMethod: 'local',
        details: {}
      });
    } catch (auditErr) {
      console.error('AdminAudit error (local login):', auditErr);
    }

    res.json({
      message: 'Login successful',
      adminId: admin._id
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err.message || err);
    console.error('Full err:', err);
    res.status(500).json({
      message: 'Server error: ' + (err.message || err)
    });
  }


});


// ========================
// ADMIN LOGOUT
// ========================

router.post('/admin/logout', (req, res) => {

  res.clearCookie('adminAuth');

  res.json({
    message: 'Logged out'
  });

});


// ========================
// UPDATE ADMIN CREDENTIALS
// ========================

router.put('/admin/credentials', adminAuth, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const updateData = {};
    if (email) {
      updateData.email = email;
    }
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      updateData.password = hashed;
    }

    const updatedAdmin = await Admin.findOneAndUpdate(
      { _id: req.admin._id },
      updateData,
      { new: true }
    );

    // audit log: credentials updated (only log high-level info)
    try {
      await AdminAudit.create({
        adminEmail: updatedAdmin.email,
        actorEmail: req.admin.email,
        action: 'credentials_updated',
        details: { emailChanged: !!email, passwordChanged: !!newPassword }
      });
    } catch (auditErr) {
      console.error('AdminAudit error (credentials_updated):', auditErr);
    }

    res.json({
      message: 'Credentials updated successfully',
      email: updatedAdmin.email
    });
  } catch (err) {
    console.error('Update credentials error:', err);
    res.status(500).json({ message: 'Failed to update credentials' });
  }
});


// ========================
// DELETE ADMIN ACCOUNT
// ========================

router.delete('/admin', adminAuth, async (req, res) => {
  try {
    const adminId = req.admin._id;

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { deletedAt: new Date() },
      { new: true }
    );

    // also record audit log
    try {
      if (admin) {
        await AdminAudit.create({
          adminEmail: admin.email,
          actorEmail: req.admin.email,
          action: 'deleted',
          details: {}
        });
      }
    } catch (auditErr) {
      console.error('AdminAudit error (deleted):', auditErr);
    }
    res.clearCookie('adminAuth');

    res.json({
      message: 'Admin account deleted. You have been logged out.'
    });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ message: 'Failed to delete admin' });
  }
});


// ========================
// ADMIN ACCESS CONTROL INFO
// ========================

// List admin accounts and their access flags
router.get('/admin/list', adminAuth, async (req, res) => {
  try {
    const admins = await Admin.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .select('name email localAllowed googleAllowed approvalStatus approvalReviewedAt approvalReviewedBy createdAt updatedAt');
    res.json(admins);
  } catch (err) {
    console.error('List admins error:', err);
    res.status(500).json({ message: 'Failed to load admin accounts' });
  }
});

// Update access flags for a specific admin
router.put('/admin/:id/access', adminAuth, async (req, res) => {
  try {
    const { localAllowed, googleAllowed } = req.body || {};
    const admin = await Admin.findById(req.params.id);

    if (!admin || admin.deletedAt) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!isApprovedAdmin(admin)) {
      return res.status(400).json({ message: 'Approve this registration before changing login methods.' });
    }

    const update = {};
    if (typeof localAllowed === 'boolean') update.localAllowed = localAllowed;
    if (typeof googleAllowed === 'boolean') update.googleAllowed = googleAllowed;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).select('name email localAllowed googleAllowed approvalStatus approvalReviewedAt approvalReviewedBy createdAt updatedAt');

    try {
      await AdminAudit.create({
        adminEmail: updatedAdmin.email,
        actorEmail: req.admin.email,
        action: 'access_updated',
        details: {
          localAllowed: updatedAdmin.localAllowed,
          googleAllowed: updatedAdmin.googleAllowed
        }
      });
    } catch (auditErr) {
      console.error('AdminAudit error (access_updated):', auditErr);
    }

    res.json({
      message: 'Access updated',
      admin: serializeAdmin(updatedAdmin)
    });
  } catch (err) {
    console.error('Update admin access error:', err);
    res.status(500).json({ message: 'Failed to update admin access' });
  }
});

router.put('/admin/:id/approval', adminAuth, async (req, res) => {
  try {
    const { approvalStatus } = req.body || {};

    if (![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.DECLINED].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Approval status must be approved or declined.' });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin || admin.deletedAt) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (String(admin._id) === String(req.admin._id) && approvalStatus === APPROVAL_STATUS.DECLINED) {
      return res.status(400).json({ message: 'You cannot decline your own active admin account.' });
    }

    const updateData = {
      approvalStatus,
      approvalReviewedAt: new Date(),
      approvalReviewedBy: req.admin.email
    };

    if (approvalStatus === APPROVAL_STATUS.DECLINED) {
      updateData.localAllowed = false;
      updateData.googleAllowed = false;
    } else if (admin.localAllowed === false && admin.googleAllowed === false) {
      updateData.localAllowed = true;
    }

    const updatedAdmin = await Admin.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );

    try {
      await AdminAudit.create({
        adminEmail: updatedAdmin.email,
        actorEmail: req.admin.email,
        action: approvalStatus === APPROVAL_STATUS.APPROVED ? 'registration_approved' : 'registration_declined',
        details: {
          approvalStatus,
          localAllowed: updatedAdmin.localAllowed,
          googleAllowed: updatedAdmin.googleAllowed
        }
      });
    } catch (auditErr) {
      console.error('AdminAudit error (registration approval):', auditErr);
    }

    res.json({
      message: approvalStatus === APPROVAL_STATUS.APPROVED ? 'Registration approved.' : 'Registration declined.',
      admin: serializeAdmin(admin)
    });
  } catch (err) {
    console.error('Update admin approval error:', err);
    res.status(500).json({ message: 'Failed to update registration approval.' });
  }
});


// ========================
// CREATE ADMIN (DASHBOARD)
// ========================

// Create a new admin from the dashboard (must already be logged in as admin)
router.post('/admin', adminAuth, async (req, res) => {
  try {
    const { name = '', email, password, localAllowed = true, googleAllowed = false } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let existing;
    try {
      existing = await Admin.findOne({ email: normalizedEmail });
    } catch (dbErr) {
      console.error('Database error during admin creation:', dbErr.message);
      return res.status(503).json({ 
        message: 'Database connection failed. Please ensure MongoDB is running and accessible.' 
      });
    }
    if (existing) {
      return res.status(409).json({ message: 'An admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      localAllowed,
      googleAllowed,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approvalReviewedAt: new Date(),
      approvalReviewedBy: req.admin.email
    });

    // audit log: admin created
    try {
      await AdminAudit.create({
        adminEmail: admin.email,
        actorEmail: req.admin.email,
        action: 'created',
        details: { name: admin.name, localAllowed, googleAllowed, approvalStatus: admin.approvalStatus }
      });
    } catch (auditErr) {
      console.error('AdminAudit error (created):', auditErr);
    }

    res.status(201).json({
      message: 'Admin created',
      admin: serializeAdmin(admin)
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});


// ========================
// AUTH STATUS
// ========================

router.get('/status', async (req, res) => {
  try {
    const token = req.cookies.adminAuth;
    if (!token) {
      return res.status(401).json({ logged: false, error: 'No auth token' });
    }

    const decoded = Buffer.from(token, 'base64').toString();
    const [adminId, issuedAt] = decoded.split(':');
    
    const now = Date.now();
    if (now - parseInt(issuedAt) > 30 * 60 * 1000) {
      return res.status(401).json({ logged: false, error: 'Session expired' });
    }

    const Admin = require('../models/admin');
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(401).json({ logged: false, error: 'Invalid admin' });
    }

    if (!isApprovedAdmin(admin)) {
      return res.status(403).json({
        logged: false,
        error: getApprovalMessage(admin),
        approvalStatus: getApprovalStatus(admin)
      });
    }

    res.json({
      logged: true,
      email: admin.email,
      approvalStatus: getApprovalStatus(admin)
    });
  } catch (err) {
    console.error('Auth status error:', err);
    res.status(401).json({ logged: false, error: 'Auth check failed' });
  }
});


// ========================
// PUBLIC REGISTRATION
// ========================

router.post('/register', async (req, res) => {
  try {
    const { name = '', email, password } = req.body || {};
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    let existing;
    try {
      existing = await Admin.findOne({ email: normalizedEmail });
    } catch (dbErr) {
      console.error('Database error during registration:', dbErr.message);
      return res.status(503).json({ 
        message: 'Database connection failed. Please ensure MongoDB is running and accessible.' 
      });
    }

    if (existing && !existing.deletedAt && getApprovalStatus(existing) === APPROVAL_STATUS.PENDING) {
      return res.status(409).json({ message: 'This registration is already pending admin approval.' });
    }

    if (existing && !existing.deletedAt && getApprovalStatus(existing) === APPROVAL_STATUS.APPROVED) {
      return res.status(409).json({ message: 'An admin account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing && !existing.deletedAt && getApprovalStatus(existing) === APPROVAL_STATUS.DECLINED) {
      const updatedExisting = await Admin.findOneAndUpdate(
        { _id: existing._id },
        {
          name: normalizedName,
          password: hashedPassword,
          localAllowed: true,
          googleAllowed: false,
          approvalStatus: APPROVAL_STATUS.PENDING,
          approvalReviewedAt: null,
          approvalReviewedBy: null
        },
        { new: true }
      );

      try {
        await AdminAudit.create({
          adminEmail: updatedExisting.email,
          action: 'registration_resubmitted',
          details: { name: updatedExisting.name }
        });
      } catch (auditErr) {
        console.error('AdminAudit error (registration_resubmitted):', auditErr);
      }

      return res.status(202).json({
        message: 'Registration resubmitted. An admin must approve your access before you can sign in.'
      });
    }

    if (existing && existing.deletedAt) {
      return res.status(409).json({ message: 'This email cannot be used to register a new admin account right now.' });
    }

    const admin = await Admin.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      localAllowed: true,
      googleAllowed: false,
      approvalStatus: APPROVAL_STATUS.PENDING
    });

    try {
      await AdminAudit.create({
        adminEmail: admin.email,
        action: 'registration_requested',
        details: { name: admin.name }
      });
    } catch (auditErr) {
      console.error('AdminAudit error (registration_requested):', auditErr);
    }

    res.status(202).json({
      message: 'Registration submitted. Wait for admin approval before signing in.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Failed to submit registration.' });
  }
});

console.log('>>> Auth routes defined <<<');

module.exports = router;
