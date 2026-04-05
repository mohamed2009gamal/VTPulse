const { connectDB, getMockDB } = require('./config/db');
const bcrypt = require('bcrypt');

async function resetAdmin() {
  try {
    await connectDB();
    console.log('✅ Connected to database');
    
    const mockDB = getMockDB();
    if (mockDB) {
      const adminsCollection = mockDB.getCollection('admins');
      
      // Find and update the admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const result = await adminsCollection.findOneAndUpdate(
        { email: 'admin@portfolio.com' },
        {
          $set: {
            password: hashedPassword,
            deletedAt: null,
            approvalStatus: 'approved',
            localAllowed: true
          }
        },
        { upsert: false }
      );
      
      if (result && result.value) {
        console.log('✅ Admin account reset successfully!');
        console.log('📧 Email: admin@portfolio.com');
        console.log('🔑 Password: admin123');
      } else {
        console.log('❌ Admin account not found');
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetAdmin();
