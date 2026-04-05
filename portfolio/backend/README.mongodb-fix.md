# MongoDB Timeout Fix Instructions

## Immediate Actions:
1. **Replace files:**
   ```
   cd backend
   mv index.js index.js.bak
   mv index.js.updated.js index.js
   mv config/db.js config/db.js.bak
   mv config/db.js.updated.js config/db.js
   ```

2. **Add to backend/.env:**
   ```
   MONGO_URI=mongodb://localhost:27017/venomtech
   ```
   (If MongoDB has auth, use `mongodb://user:pass@localhost:27017/venomtech`)

3. **Restart server:**
   ```
   npm start
   ```
   Look for `✅ MongoDB connected successfully`

4. **Create admin if needed:**
   ```
   node createAdmin.js
   ```
   (Uses ADMIN_EMAIL/ADMIN_PASSWORD from .env or defaults)

5. **Test login:**
   ```
   curl -X POST http://localhost:4000/api/auth/admin/login \\
   -H "Content-Type: application/json" \\
   -d '{\"email\":\"admin@portfolio.com\",\"password\":\"admin123\"}'
   ```

## Next Steps (after test):
- Replace server.js with connectDB()
- Add retry logic to auth.js findOne calls

Updated TODO.md tracks progress.

