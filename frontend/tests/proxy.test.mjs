import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { join } from 'node:path';

const backend = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Set-Cookie', 'session=test; HttpOnly; Path=/');
  res.end(JSON.stringify({ path: req.url, method: req.method, cookie: req.headers.cookie, csrf: req.headers['x-csrf-token'], origin: req.headers.origin, body: Buffer.concat(chunks).toString() }));
});
backend.listen(0, '127.0.0.1');
await once(backend, 'listening');
const backendPort = backend.address().port;
const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const frontendPort = probe.address().port;
await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));

const frontend = spawn(process.execPath, [join(process.cwd(), 'server', 'index.js')], {
  env: { ...process.env, PORT: String(frontendPort), BACKEND_URL: `http://127.0.0.1:${backendPort}` },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let frontendError = '';
frontend.stderr.on('data', chunk => { frontendError += chunk.toString(); });
try {
  let response;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { response = await fetch(`http://127.0.0.1:${frontendPort}/api/v1/health/ready`); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.ok(response, `frontend server did not start: ${frontendError}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).path, '/api/v1/health/ready');
  const mutation = await fetch(`http://127.0.0.1:${frontendPort}/api/v1/reservations`, {
    method: 'POST', headers: { Cookie: 'session=test', Origin: 'http://localhost:8080', 'X-CSRF-Token': 'csrf-test', 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'test' }),
  });
  const body = await mutation.json();
  assert.equal(body.path, '/api/v1/reservations');
  assert.equal(body.method, 'POST');
  assert.equal(body.cookie, 'session=test');
  assert.equal(body.csrf, 'csrf-test');
  assert.equal(body.origin, 'http://localhost:8080');
  assert.equal(mutation.headers.get('set-cookie'), 'session=test; HttpOnly; Path=/');
  console.log('Frontend API proxy: path, cookie, Origin, CSRF, response cookie OK');
} finally {
  frontend.kill();
  backend.close();
}
