import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/api/client.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { api } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
const calls = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url, ...init });
  if (url.endsWith('/auth/csrf')) return new Response(JSON.stringify({ token: 'csrf-token' }), { status: 200 });
  if (url.endsWith('/reset-password')) return new Response(null, { status: 204 });
  return new Response(JSON.stringify({ items: [], user: { id: '2' }, id: '5', version: 4 }), { status: 200 });
};

await api.adminUsers();
await api.createUser('new.user', '새 사용자', 'long-temporary-password');
await api.updateUser('2', { role: 'ADMIN', isActive: true });
await api.resetUserPassword('2', 'another-long-password');
await api.correctPrint('5', { version: 3, reason: '실측값 확인', userId: null, actualFilamentG: 0 });

assert.equal(calls[0].url, '/api/v1/admin/users');
assert.equal(calls[0].credentials, 'same-origin');
assert.deepEqual(calls.filter(call => call.url.endsWith('/auth/csrf')).length, 4);
const mutations = calls.filter(call => ['POST', 'PATCH'].includes(call.method));
assert.deepEqual(mutations.map(call => [call.url, call.method]), [
  ['/api/v1/admin/users', 'POST'],
  ['/api/v1/admin/users/2', 'PATCH'],
  ['/api/v1/admin/users/2/reset-password', 'POST'],
  ['/api/v1/admin/prints/5', 'PATCH'],
]);
for (const mutation of mutations) { assert.equal(mutation.headers['X-CSRF-Token'], 'csrf-token'); assert.equal(mutation.credentials, 'same-origin'); }
assert.deepEqual(JSON.parse(mutations[3].body), { version: 3, reason: '실측값 확인', userId: null, actualFilamentG: 0 });
console.log('Admin API routes, CSRF, cookie credentials, correction payload OK');
