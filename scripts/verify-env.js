#!/usr/bin/env node
/**
 * verify-env.js
 * Hard stop the build early if required environment variables are missing.
 * This prevents opaque CRA build failures later and keeps secrets scanning logs clean.
 */

// Required for client build to function.
const REQUIRED = [
  'REACT_APP_API_URL',
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY'
];

// Optional but recommended server-only secret (should *not* normally exist in frontend build env)
const OPTIONAL_SERVER = ['SUPABASE_SERVICE_KEY'];

// YouTube key now optional because we proxy; only warn if absent.
const oneOfYouTube = ['VITE_YOUTUBE_API_KEY', 'REACT_APP_YOUTUBE_API_KEY'];

const missing = [];

for (const key of REQUIRED) {
  if (!process.env[key] || String(process.env[key]).trim() === '') {
    missing.push(key);
  }
}

const hasYouTube = oneOfYouTube.some(k => !!process.env[k]);

if (missing.length) {
  console.error('\n================ ENV VALIDATION FAILED ================');
  for (const key of missing) {
    console.error(`❌ Missing required environment variable: ${key}`);
  }
  console.error('\nSet these in your deployment environment (Netlify UI / CLI or Render) and re-run the build.');
  console.error('Aborting build.');
  process.exit(1);
} else {
  console.log('✅ Environment variables present:');
  [...REQUIRED].forEach(k => {
    if (!k) return;
    const val = process.env[k];
    const redacted = val && val.length > 8 ? val.slice(0,4) + '...' + val.slice(-4) : 'set';
    console.log(`  - ${k}: ${redacted}`);
  });
  if (hasYouTube) {
    const k = oneOfYouTube.find(k=>process.env[k]);
    const val = process.env[k];
    const redacted = val && val.length > 8 ? val.slice(0,4) + '...' + val.slice(-4) : 'set';
    console.log(`  - ${k}: ${redacted}`);
  } else {
    console.log('  - YouTube key: (none) -> will use backend proxy only');
  }
  OPTIONAL_SERVER.forEach(k => {
    if (process.env[k]) {
      const val = process.env[k];
      const redacted = val && val.length > 8 ? val.slice(0,4) + '...' + val.slice(-4) : 'set';
      console.log(`  - ${k}: ${redacted} (present – ensure not exposed client-side)`);
    } else {
      console.log(`  - ${k}: (not set – fine for frontend build)`);
    }
  });
  console.log('Proceeding with build...\n');
}
