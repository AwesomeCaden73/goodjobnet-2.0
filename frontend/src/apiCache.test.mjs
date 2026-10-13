import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, cachedData, clearApiCache, getCacheSyncing } from './apiCache.js';

function storage() {
  return Object.create({ getItem(key) { return this[key] ?? null; }, setItem(key, value) { this[key] = String(value); }, removeItem(key) { delete this[key]; } });
}
const response = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
test('cache revalidates, isolates users, survives offline reads and invalidates races after writes', async () => {
  const saved = { localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, fetch: globalThis.fetch, window: globalThis.window };
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage(); globalThis.window = { dispatchEvent() {} };
  try {
    clearApiCache();
    globalThis.fetch = async () => response({ success: true, total_hot_jobs: 10 });
    await apiFetch('/api/dashboard-stats');
    assert.equal(cachedData('/api/dashboard-stats').total_hot_jobs, 10);
    globalThis.fetch = async () => response({ success: true, total_hot_jobs: 11 });
    assert.equal((await (await apiFetch('/api/dashboard-stats')).json()).total_hot_jobs, 11);
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    const fallback = await apiFetch('/api/dashboard-stats');
    assert.equal(fallback.headers.get('X-GoodJobNet-Cache'), 'offline');
    assert.equal((await fallback.json()).total_hot_jobs, 11);
    localStorage.setItem('goodjobnet_user', JSON.stringify({ name: 'Another user', role: 'admin' }));
    assert.equal(cachedData('/api/dashboard-stats'), null);
    await assert.rejects(apiFetch('/api/dashboard-stats'), /offline/);
    localStorage.removeItem('goodjobnet_user');
    const controller = new AbortController(); controller.abort();
    await assert.rejects(apiFetch('/api/dashboard-stats', { signal: controller.signal }));
    await assert.rejects(apiFetch('/api/hot-jobs-review?category=company'), /offline/);
    let completeRead;
    globalThis.fetch = url => url === '/api/search-jobs' ? new Promise(resolve => { completeRead = resolve; }) : Promise.resolve(response({ success: true, total_hot_jobs: 12 }));
    const pending = apiFetch('/api/search-jobs', { method: 'POST', body: '{}' });
    assert.equal(getCacheSyncing(), true);
    await apiFetch('/api/update-hot-job', { method: 'POST', body: '{}' });
    completeRead(response({ success: true, results: { recent: [] } }));
    await pending;
    assert.equal(getCacheSyncing(), false);
    assert.equal(cachedData('/api/search-jobs', { method: 'POST', body: '{}' }), null);
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 500 });
    clearApiCache();
    await apiFetch('/api/dashboard-stats');
    assert.equal(cachedData('/api/dashboard-stats'), null);
  } finally { Object.assign(globalThis, saved); }
});
