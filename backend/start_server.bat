set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=mostafa123
set DB_NAME=menucraft_mysql
rem JWT secrets come ONLY from backend\.env — never hardcode them here (P0 C-1).
rem The server refuses to start with missing/default/weak secrets.
node src/app.js
