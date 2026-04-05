# Docker Setup Guide - Portfolio + MongoDB

## 🚀 Prerequisites

Install Docker Desktop from: https://www.docker.com/products/docker-desktop

## 📦 Quick Start (3 steps)

### Step 1: Start Docker Services
```powershell
# From project root (d:\Portfolio\portfolio)
docker-compose up -d
```

This will:
- ✅ Download MongoDB 7.0 image
- ✅ Start MongoDB container (listening on port 27017)
- ✅ Start backend container (listening on port 4000)
- ✅ Auto-connect MongoDB to backend

### Step 2: Verify Services Are Running
```powershell
# Check container status
docker-compose ps

# Should show:
# - portfolio_mongodb  (healthy)
# - portfolio_backend  (running)
```

### Step 3: Create Admin Account
```powershell
# Inside the backend container
docker-compose exec backend node createAdmin.js
```

Expected output:
```
Admin user created successfully!
Email: admin@portfolio.com
Password: admin123
```

---

## 🧪 Test the Setup

### Test MongoDB Connection
```powershell
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "server": "running",
  "database": "connected",
  "mongoUri": "***",
  "retryAttempt": "0/10"
}
```

### Test Login
```powershell
curl -X POST http://localhost:4000/api/auth/admin/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@portfolio.com\",\"password\":\"admin123\"}'
```

Expected response (200 OK):
```json
{
  "message": "Logged in successfully",
  "user": { ... }
}
```

---

## 🛑 Cleanup & Troubleshooting

### Stop All Services
```powershell
docker-compose down
```

### Stop Services + Delete MongoDB Data
```powershell
docker-compose down -v
```

### View Logs
```powershell
# Backend logs
docker-compose logs backend

# MongoDB logs
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f backend
```

### Rebuild After Code Changes
```powershell
docker-compose up -d --build
```

### Force Restart
```powershell
docker-compose restart backend
```

---

## 📊 Service Details

**MongoDB:**
- Username: `admin`
- Password: `admin123`
- Database: `portfolio`
- Port: `27017`
- Connection String: `mongodb://admin:admin123@localhost:27017/portfolio?authSource=admin`

**Backend:**
- Port: `4000`
- Health Check: `http://localhost:4000/api/health`
- API Base: `http://localhost:4000/api`

---

## ⚠️ If Something Goes Wrong

### MongoDB won't connect
```powershell
# Check if containers started
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Wait 30 seconds, then test again
```

### Backend won't start
```powershell
# View error logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Can't connect to `localhost:4000`
- Make sure `docker-compose up -d` completed successfully
- Wait 30 seconds for health checks to pass
- Run `docker-compose ps` to verify all containers are running
- Check firewall isn't blocking port 4000

---

## 🎯 Next Steps

1. ✅ Run `docker-compose up -d`
2. ✅ Run `docker-compose exec backend node createAdmin.js`
3. ✅ Test with health check or login endpoint
4. ✅ Start frontend: `npm start` (from root)

You're now ready to develop! MongoDB is fully managed by Docker.
