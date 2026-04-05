const path = require('path');
require('dotenv').config();
const { connectDB, isUsingMockDB, getMockDB } = require('./config/db');
const bcrypt = require('bcrypt');
const Admin = require('./models/admin');

async function createAdmin() {
  try {
    // Connect to database (with mock DB fallback)
    await connectDB();
    console.log('✅ Connected to database');
    
    // Default admin credentials
    const email = process.env.ADMIN_EMAIL || 'admin@portfolio.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin already exists
    let existingAdmin;
    try {
      existingAdmin = await Admin.findOne({ email });
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr.message);
      console.error('   Make sure MongoDB is running or check mock database');
      process.exit(1);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (existingAdmin) {
      // Update existing admin (even if marked as deleted)
      console.log('ℹ️  Admin already exists, resetting credentials...');
      const result = await Admin.findOneAndUpdate(
        { email },
        {
          $set: {
            password: hashedPassword,
            deletedAt: null,
            approvalStatus: 'approved',
            localAllowed: true,
            googleAllowed: true
          }
        },
        { new: true }
      );
      console.log('✅ Admin reset successfully!');
    } else {
      // Create new admin
      const admin = await Admin.create({
        email,
        password: hashedPassword,
        name: 'Administrator',
        localAllowed: true,
        googleAllowed: true,
        approvalStatus: 'approved',
        deletedAt: null
      });
      console.log('✅ Admin created successfully!');
    }
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();

