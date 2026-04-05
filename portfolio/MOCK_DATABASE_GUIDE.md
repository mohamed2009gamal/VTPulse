# Mock Database Setup - Complete Guide

## ✅ What's Been Done

Your backend now **works without MongoDB installed**! The system automatically falls back to an in-memory mock database when MongoDB is unavailable.

### Key Features:
- ✅ **Zero MongoDB dependency** - Backend works immediately
- ✅ **File persistence** - Data saved to `backend/data.json` 
- ✅ **Real-time switching** - Can upgrade to real MongoDB anytime
- ✅ **Full model support** - All models wrapped to work transparently
- ✅ **Development-ready** - Perfect for testing UI and features

---

## 🚀 Quick Start

### 1. Create Admin Account (First Time Only)
```powershell
cd D:\Portfolio\portfolio\backend
node createAdmin.js
```

Expected output:
```
✅ Admin reset successfully!
📧 Email: admin@portfolio.com
🔑 Password: admin123
```

### 2. Start Backend Server
```powershell
cd D:\Portfolio\portfolio\backend
node index.js
```

You'll see:
```
📦 Mock Database initialized (in-memory with file persistence)
✅ MongoDB connected successfully
=== Server running on http://localhost:4000 ===
```

### 3. Test Health Check
```powershell
Invoke-WebRequest http://localhost:4000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

Response:
```json
{
  "server": "running",
  "database": "connected",
  "mongoUri": "***",
  "retryAttempt": "0/5"
}
```

### 4. Test Admin Login
```powershell
@{"email"="admin@portfolio.com";"password"="admin123"} | ConvertTo-Json | `
  Invoke-WebRequest -Uri http://localhost:4000/api/auth/admin/login -Method POST `
  -ContentType "application/json" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Response (Success):
```json
{
  "message": "Login successful",
  "adminId": "69b5613f40c8edfa26fba671"
}
```

---

## 📊 How It Works

### Data Storage
- **Location**: `backend/data.json`
- **Format**: JSON (human-readable)
- **Persistence**: Survives server restarts
- **Size**: Grows with data (OK for development)

### Example Data File
```json
{
  "admins": [
    {
      "_id": "69b5613f40c8edfa26fba671",
      "email": "admin@portfolio.com",
      "password": "hash...",
      "approvalStatus": "approved",
      "deletedAt": null
    }
  ],
  "blogs": [],
  "messages": [],
  "visits": []
}
```

### Collections Created Automatically
- `admins` - Admin accounts
- `adminaudits` - Login/action audit logs
- `blogs` - Blog posts
- `messages` - Contact form messages
- `visits` - Page visit analytics
- `clicks` - Click tracking
- `blogvotes` - Blog ratings
- `cookieconsents` - Cookie preferences

---

## 🔄 Switching to Real MongoDB

### Option A: Install & Run MongoDB Locally

1. **Download MongoDB Community**:
   - https://www.mongodb.com/try/download/community
   - Choose your OS and install

2. **Start MongoDB**:
   ```powershell
   mongod
   ```
   You'll see: `Waiting for connections on port 27017`

3. **Update `.env`**:
   ```
   MONGO_URI=mongodb://localhost:27017/portfolio
   ```

4. **Restart Backend** - It automatically detects real MongoDB:
   ```powershell
   cd backend
   node index.js
   ```
   You'll see: `✅ MongoDB connected successfully`

### Option B: Use MongoDB Atlas (Recommended - Cloud)

1. **Create Free Account**: https://www.mongodb.com/cloud/atlas

2. **Create Free Cluster**
   - Choose free tier (M0)
   - Select region
   - Create

3. **Get Connection String**
   - Click "Connect" → "Drivers"
   - Copy connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)

4. **Update `.env`**:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority
   ```

5. **Restart Backend**:
   ```powershell
   cd backend
   node index.js
   ```

6. **Create Admin** (if new database):
   ```powershell
   node createAdmin.js
   ```

---

## 🛠️ Useful Commands

### Reset Admin Password
```powershell
node createAdmin.js
```
Updates existing admin OR creates new one

### Clear All Data
```powershell
rm backend/data.json
# Then restart the server - fresh database created
```

### View Data (if using mock DB)
```powershell
# Windows
type backend/data.json | jq '.' 2>$null

# Or just view raw JSON
Get-Content backend/data.json
```

### Test an Endpoint
```powershell
# Health check
Invoke-WebRequest http://localhost:4000/api/health -UseBasicParsing

# Login
@{"email"="admin@portfolio.com";"password"="admin123"} | ConvertTo-Json | `
  Invoke-WebRequest -Uri http://localhost:4000/api/auth/admin/login -Method POST `
  -ContentType "application/json" -UseBasicParsing
```

### Check Server Status
```powershell
# If running in background
tasklist | findstr node   # See if node.exe is running

# Or check port
netstat -ano | findstr :4000   # See if port 4000 is in use
```

---

## 📝 Important Notes

### Mock Database Limitations
- ✅ Supports: Basic CRUD, countDocuments, queries
- ⚠️ **Limited aggregation** - Simple grouping only
- ⚠️ **Not suitable for production** - Data is in-process
- ⚠️ **Single-process only** - Can't scale to multiple servers

### When to Upgrade
- [ ] Multiple team members need shared data
- [ ] Production deployment needed
- [ ] Complex aggregation queries required
- [ ] Larger datasets (>100MB)
- [ ] Needing backups/replication

### Data Won't Persist If:
- Process crashes
- Multiple processes (horizontally scaled)
- Time-series data needed beyond single instance

---

## 🎯 Next Steps

1. ✅ Create admin account: `node createAdmin.js`
2. ✅ Start backend: `node index.js`
3. ✅ Start frontend: `npm start` (from root)
4. ✅ Open browser: `http://localhost:3001`
5. ✅ Login with: `admin@portfolio.com` / `admin123`
6. ✅ Develop and test features
7. 🔄 When ready for production, switch to MongoDB Atlas

---

## ❓ Troubleshooting

### "Database query failed" Error
```
Solution: Make sure backend is running and .env MONGO_URI is not set
         If you want MongoDB, set MONGO_URI and restart
```

### "Failed to fetch overview data"
```
Solution: You need to be logged in to access /api/dashboard
         Use admin credentials: admin@portfolio.com / admin123
```

### "Admin already exists"
```
Solution: Run again to reset password:
         node createAdmin.js
```

### Data Lost After Restart
```
Solution: This is expected for mock DB. To persist:
         1. Switch to MongoDB Atlas (recommended)
         2. Or export data.json before restarting
```

---

## 📚 Architecture

```
App Request
    ↓
Express Route
    ↓
Model (wrapped)
    ↓
    ├─→ MongoDB (if MONGO_URI set + connected)
    └─→ Mock Database (if MONGO_URI not set OR MongoDB unavailable)
              ├─→ In-Memory Store
              └─→ Persisted to data.json
```

The switching happens **automatically** - no code changes needed!

---

## 🎓 For More Info

- **Mock Database Code**: `backend/config/mockDB.js`
- **Model Wrapper**: `backend/config/wrapModel.js`  
- **DB Connection**: `backend/config/db.js`
- **Models**: `backend/models/*.js` (all wrapped)

All models support both real MongoDB and mock database transparently.
