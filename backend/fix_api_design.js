const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const d = '{"colors":{"primary":"#E8571F","secondary":"#F5A623","accent":"#2A2A2A"},"typography":{"heading":"montserrat","body":"inter","menu":"inter","headingScale":1.04,"bodyScale":1.02,"headingWeight":700,"lineHeight":1.55},"layout":{"header":"split","hero":"split","menuLayout":"grid","card":"bordered","radius":8,"spacing":1,"aspect":"square","theme":"light"},"sections":[{"id":"featured","enabled":true},{"id":"menu","enabled":true},{"id":"about","enabled":true},{"id":"gallery","enabled":true},{"id":"hours","enabled":true},{"id":"contact","enabled":true}]}';
  await p.request().input('id', sql.NVarChar, 'rest-1793437631499-27bf0').input('d', sql.NVarChar, d).query('UPDATE Restaurants SET design = @d WHERE id = @id');
  console.log('api-test-rest design fixed');
  await p.close();
})();
