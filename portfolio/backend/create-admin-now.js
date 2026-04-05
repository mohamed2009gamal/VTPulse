require('dotenv').config();
const bcrypt = require('bcrypt');
const dbModule = require('./config/db');
const Admin = require('./models/admin');

async function createAdminNow() {
  try {
    // Use config/db connection (auto mockDB or MongoDB)
    const dbStatus = dbModule.getConnectionStatus();
    console.log('DB Status:', dbStatus.status);
    
    const email = 'mohamedgamal2512009@gmail.com';
    const password = 'password123';
    const hashed = await bcrypt.hash(password, 10);

    const adminData = {
      email,
      password: hashed,
      localAllowed: true,
      approvalStatus: 'approved',
      name: 'Mohamed Gamal'
    };

    // Create via Admin wrapper (handles mockDB/MongoDB)
    const admin = await Admin.create(adminData);
    
    console.log('✅ Admin created!');
    console.log('📧 Email:', email);
    console.log('🔑 Password: password123');
    console.log('📊 DB:', dbStatus.useMockDB ? 'MockDB (in-memory)' : 'MongoDB (persistent)');
    console.log('💡 Restart server if running: npm start or nodemon');
    console.log('🧪 Test: http://localhost:4000/api/auth/status');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('💡 Try: docker-compose up -d');
  }
}

createAdminNow();

