const PREFIX = 'goodjobnet_cache_v1:';
const MAX_AGE = 24 * 60 * 60 * 1000;
const READS = new Set(['/api/dashboard-stats', '/api/search-jobs', '/api/search-seekers', '/api/assigned-seekers', '/api/seeker-matching-jobs', '/api/hot-jobs-review']);
const WRITES = new Set(['/api/submit-job', '/api/update-hot-job', '/api/delete-hot-job', '/api/import-jobseekers', '/api/update-jobseeker-info', '/api/export-jsearch-jobs', '/api/sync-jobseekers-csv-to-drive', '/api/update-hot-jobs-map']);
let generation = 0;
let pendingReads = 0;
const syncListeners = new Set();
export const getCacheSyncing = () => pendingReads > 0;
export const subscribeCacheSync = listener => { syncListeners.add(listener); return () => syncListeners.delete(listener); };
function changePending(delta) { pendingReads += delta; syncListeners.forEach(listener => listener()); }


function scope() {
  try { const user = JSON.parse(localStorage.getItem('goodjobnet_user') || 'null'); return JSON.stringify(user ? [user.username || user.name, user.role, user.email || ''] : ['public']); } catch { return 'public'; }
}
function cacheKey(url, options = {}) { return PREFIX + JSON.stringify([scope(), url, options.method || 'GET', options.body || '']); }
export function cachedData(url, options = {}) {
  try {
    const key = cacheKey(url, options);
    const entry = JSON.parse(localStorage.getItem(key));
    if (!entry || Date.now() - entry.timestamp > MAX_AGE) { localStorage.removeItem(key); return null; }
    return entry.data?.success ? entry.data : null;
  } catch { return null; }
}
function put(key, data) {
  if (!data?.success) return;
  try {
    const keys = Object.keys(localStorage).filter(item => item.startsWith(PREFIX));
    if (keys.length >= 40 && !keys.includes(key)) localStorage.removeItem(keys.sort((a, b) => JSON.parse(localStorage.getItem(a)).timestamp - JSON.parse(localStorage.getItem(b)).timestamp)[0]);
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch { /* Storage limits must not interrupt the application. */ }
}
export function clearApiCache() {
  generation++;
  try { Object.keys(localStorage).filter(key => key.startsWith(PREFIX)).forEach(key => localStorage.removeItem(key)); } catch { /* Storage may be disabled. */ }
  try { sessionStorage.removeItem('seeker_search_results'); } catch { /* Storage may be disabled. */ }
}

// Every read revalidates on request; cached data is an offline fallback, never an edit source.
export async function apiFetch(url, options = {}) {
  const path = String(url).split('?')[0];
  const read = READS.has(path);
  const startGeneration = generation;
  const startScope = scope();
  const key = read ? cacheKey(url, options) : null;
  if (read) changePending(1);
  try {
    const response = await fetch(url, options);
    if (read && response.ok) {
      const data = await response.clone().json();
      if (generation === startGeneration && scope() === startScope && !options.signal?.aborted) put(key, data);
    }
    if (WRITES.has(path) && response.ok) {
      const data = await response.clone().json();
      if (data.success) {
        clearApiCache();
        window.dispatchEvent(new Event('goodjobnet-data-updated'));
        // Prime the dashboard after a successful mutation; no spreadsheet writes here.
        apiFetch('/api/dashboard-stats').catch(() => {});
      }
    }
    return response;
  } catch (error) {
    if (options.signal?.aborted || error.name === 'AbortError' || scope() !== startScope || generation !== startGeneration) throw error;
    const saved = read && path !== '/api/hot-jobs-review' && cachedData(url, options);
    if (saved) return new Response(JSON.stringify(saved), { headers: { 'Content-Type': 'application/json', 'X-GoodJobNet-Cache': 'offline' } });
    throw error;
  } finally {
    if (read) changePending(-1);
  }
}
