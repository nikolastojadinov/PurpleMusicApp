// Simple localStorage cache with TTL
// keys are namespaced under 'pm_cache:'
const NS = 'pm_cache:';

export function setCache(key, value, ttlMs) {
  try {
    const expires = Date.now() + (ttlMs || 0);
    const payload = { v: value, e: expires };
    localStorage.setItem(NS + key, JSON.stringify(payload));
  } catch (e) { /* silent */ }
}

export function getCache(key) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.e && parsed.e > 0 && Date.now() > parsed.e) {
      localStorage.removeItem(NS + key);
      return null;
    }
    return parsed.v;
  } catch (e) { return null; }
}

export function remember(key, ttlMs, producer) {
  const cached = getCache(key);
  if (cached) return Promise.resolve(cached);
  return Promise.resolve().then(producer).then(v => { setCache(key, v, ttlMs); return v; });
}
