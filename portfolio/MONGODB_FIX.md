# MongoDB Connection Timeout Fix

## Problem
```
Error: Operation `admins.findOne()` buffering timed out after 10000ms
```

This error means **MongoDB is not running** or not reachable at `mongodb://localhost:27017`.

---

## ✅ Quick Fix Guide

### Step 1: Start MongoDB

**Windows with MongoDB Installed:**
```powershell
# Open a new PowerShell terminal
mongod
```

You should see: `Waiting for connections on port 27017`

### Step 2: Verify Environment Variables

Ensure your `.env` file has:
```
MONGO_URI=mongodb://localhost:27017/portfolio
```

### Step 3: Restart Backend Server

```powershell
cd backend
npm start
```

### Step 4: Create Admin Account (if needed)

```powershell
# In backend directory
node createAdmin.js
```

### Step 5: Test Login

```bash
curl -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portfolio.com","password":"admin123"}'
```

Expected response (200 OK with user data)

---

## 🚀 Alternative: Use MongoDB Atlas (Cloud)

If you don't want to run MongoDB locally:

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account and new cluster
3. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net`)
4. Update `.env`:
   ```
   MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/portfolio?retryWrites=true&w=majority
   ```
5. Restart backend server

---

## 🔧 Improvements Made

- ✅ Added error handling to `Admin.findOne()` calls
- ✅ Better error messages for database connection issues
- ✅ 503 status codes for database connection failures
- ✅ MongoDB connection timeout: 5 seconds (faster feedback)

---

## 🆘 Still Having Issues?

1. **MongoDB won't start?**
   - Reinstall MongoDB from: https://www.mongodb.com/try/download/community
   - Or switch to MongoDB Atlas (cloud)

2. **Check if MongoDB process is running:**
   ```powershell
   Get-Process mongod
   ```

3. **Check if port 27017 is in use:**
   ```powershell
   netstat -ano | findstr :27017
   ```
