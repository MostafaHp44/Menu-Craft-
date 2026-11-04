const sql = require('mssql');
(async () => {
  const p = await sql.connect({ user: 'sa', password: 'YourStrong@Passw0rd', server: 'localhost', port: 1433, database: 'menucraft_docker', options: { encrypt: false, trustServerCertificate: true } });
  const idx = await p.request().query("SELECT i.name AS index_name, i.type_desc, c.name AS column_name FROM sys.indexes i JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id WHERE i.object_id = OBJECT_ID('Orders') AND i.name NOT LIKE 'PK_%' AND i.name NOT LIKE 'IX_%' ORDER BY i.name");
  console.log('Custom indexes on Orders:', idx.recordset.map(r => r.index_name + ' on ' + r.column_name));
  const all = await p.request().query("SELECT i.name, i.is_unique, i.type_desc, STRING_AGG(c.name, ',') WITHIN GROUP (ORDER BY ic.key_ordinal) AS cols FROM sys.indexes i JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id WHERE i.object_id = OBJECT_ID('Orders') GROUP BY i.name, i.is_unique, i.type_desc");
  console.log('All indexes:');
  all.recordset.forEach(r => console.log('  ' + r.name + ' (unique=' + r.is_unique + ', type=' + r.type_desc + ') cols=' + r.cols));
  await p.close();
})();
