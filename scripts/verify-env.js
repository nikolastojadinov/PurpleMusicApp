#!/usr/bin/env node
/**
 * verify-env.js (soft mode)
 * Previous behavior: abort build on missing vars. New behavior: WARN ONLY.
 * Goals:
 *  - Never exit non‑zero (prevents Netlify build failure on partial envs)
 *  - Redact sensitive values when echoing
 *  - Provide Node version advisory (warn if not 20.x)
 *  - Include optional YouTube key status (VITE_YOUTUBE_API_KEY / REACT_APP_YOUTUBE_API_KEY)
 */

const fs = require('fs');
const path = require('path');

function redact(v){
  if (!v) return '(empty)';
  const s = String(v);
  if (s.length <= 8) return '****';
  return s.slice(0,4) + '...' + s.slice(-4);
}

// Soft pre-load .env.ci in CI if present (no shell expansion parsing).
try {
  if (process.env.CI === 'true') {
    const ciPath = path.join(process.cwd(), '.env.ci');
    if (fs.existsSync(ciPath)) {
      for (const line of fs.readFileSync(ciPath, 'utf8').split(/\r?\n/)) {
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        if (!key) continue;
        const val = line.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
      console.log('[verify-env] Loaded .env.ci (soft)');
    }
  }
} catch(e){
  console.warn('[verify-env] Warning: failed loading .env.ci ->', e.message);
}

// We keep expansion disabled as a defense (legacy recursion under Node 22)
if (!process.env.DOTENV_DISABLE_EXPAND) {
  process.env.DOTENV_DISABLE_EXPAND = 'true';
}

// Advisory: enforce (soft) Node 20.
try {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 20) {
    console.warn(`[verify-env] Warning: Detected Node ${process.versions.node}. Recommended Node 20.x for consistent builds.`);
  }
} catch(_) {}

const REQUIRED = [
  'REACT_APP_API_URL',
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY'
];
const YOUTUBE_KEYS = ['VITE_YOUTUBE_API_KEY','REACT_APP_YOUTUBE_API_KEY'];

const missing = REQUIRED.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
const hasYoutube = YOUTUBE_KEYS.some(k=>process.env[k]);

console.log('=== Environment Overview (soft validation) ===');
for (const k of REQUIRED) {
  const v = process.env[k];
  if (v) {
    console.log(`  ✓ ${k} = ${redact(v)}`);
  } else {
    console.warn(`  ! ${k} MISSING`);
  }
}

if (hasYoutube) {
  const k = YOUTUBE_KEYS.find(k=>process.env[k]);
  console.log(`  ✓ ${k} (YouTube) = ${redact(process.env[k])}`);
} else {
  console.warn('  ! VITE_YOUTUBE_API_KEY (or REACT_APP_YOUTUBE_API_KEY) not set -> will rely solely on backend proxy');
}

if (missing.length) {
  console.warn('\n[verify-env] Proceeding despite missing vars (soft mode). App features depending on these may fail at runtime.');
}

console.log('[verify-env] Completed soft validation.\n');

// Never exit non-zero
process.exitCode = 0;
