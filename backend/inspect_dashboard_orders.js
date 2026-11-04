const http = require('http');
function post(path, body) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5173, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'Cookie': 'access_token=', }, }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res({status:r.statusCode, body:b})); });
    req.on('error', rej); req.write(data); req.end();
  });
}
(async () => {
  // 1) Signin -> get access token
  const signin = await post('/api/auth/signin', { email: 'super@menucraft.demo', password: 'PPv7Ms1hwcnRbUeIoZMHSw' });
  console.log('SIGNIN:', signin.status, signin.body.substring(0,300));
  // Extract access token
  let tok = '';
  try { const j = JSON.parse(signin.body); tok = j.accessToken || ''; console.log('token prefix:', tok ? tok.substring(0, 20) : 'none'); } catch {}
  if (tok) {
    // 2) Dashboard API for orders scoped to user restaurant (or all)
    const orders = await new Promise((res, rej) => {
      http.request({ hostname: '127.0.0.1', port: 5173, path: '/api/platform/admin/orders', method: 'GET', headers: { 'Cookie': `access_token=${tok}`, 'Accept': 'application/json' } }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res({status:r.statusCode, body:b})); }).on('error', rej).write('GET /api/platform/admin/orders HTTP/1.1\r\nHost: localhost:5173\r\nCookie: access_token='+tok+'\r\nConnection: close\r\n\r\n');
    });
    console.log('ORDERS API:', orders.status, orders.body.substring(0, 600));
    // Try without cookie
    const orders2 = await new Promise((res, rej) => {
      http.request({ hostname: '127.0.0.1', port: 5173, path: '/api/platform/admin/orders', method: 'GET' }, (r) => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res({status:r.statusCode, body:b})); }).on('error', rej);
    });
    console.log('ORDERS API no-cookie:', orders2.status, orders2.body.substring(0,300));
  }
})();
