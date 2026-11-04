@echo off
cd D:\MBN Group\Test Menu\backend
node src/server.js > server.log 2>&1
timeout /t 3 >nul
curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Client\",\"email\":\"testclient@demo.com\",\"password\":\"Password123\",\"restaurantName\":\"Test Restaurant\"}"