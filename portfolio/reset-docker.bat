@echo off
REM Stop and remove all containers, volumes, and rebuild
echo ❌ Stopping all containers...
docker-compose down -v

echo.
echo 🔨 Rebuilding containers from scratch...
docker-compose build --no-cache

echo.
echo ✅ Starting fresh Docker setup...
docker-compose up -d

echo.
echo ⏳ Waiting 10 seconds for services to initialize...
timeout /t 10 /nobreak

echo.
echo 🏥 Checking service status...
docker-compose ps

echo.
echo ✅ All set! Testing health endpoint in 5 seconds...
timeout /t 5 /nobreak

curl http://localhost:4000/api/health

echo.
echo 💡 Next step: Create admin account with:
echo    docker-compose exec backend node createAdmin.js
