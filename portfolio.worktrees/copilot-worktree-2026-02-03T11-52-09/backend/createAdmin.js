require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/admin');

async function createAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Default admin credentials
    const email = process.env.ADMIN_EMAIL || 'admin@portfolio.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('❌ Admin already exists with email:', email);
      console.log('   If you want to reset password, delete the admin from MongoDB first.');
      process.exit(1);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin
    const admin = new Admin({
      email,
      password: hashedPassword
    });
    
    await admin.save();
    
    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('   You can update ADMIN_EMAIL and ADMIN_PASSWORD in .env file');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
