const sql = require('mssql');
const c = { user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, options: { trustServerCertificate: true }, database: 'menucraft_docker' };
sql.connect(c).then(p => p.request().query('ALTER TABLE Subscriptions ADD updated_at DATETIME DEFAULT GETDATE()').then(r => console.log('ALTER OK')).catch(e => console.log('ALTER result:', e.message)).finally(() => sql.close()));
