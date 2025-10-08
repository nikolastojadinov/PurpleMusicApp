#!/usr/bin/env node
/**
 * verify-env.js
 * Hard stop the build early if required environment variables are missing.
 * This prevents opaque CRA build failures later and keeps secrets scanning logs clean.
 */

const REQUIRED = [
  'REACT_APP_API_URL',
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY' // requested (even though mainly server-side)
];

const oneOfYouTube = ['VITE_YOUTUBE_API_KEY', 'REACT_APP_YOUTUBE_API_KEY'];

const missing = [];

for (const key of REQUIRED) {
  if (!process.env[key] || String(process.env[key]).trim() === '') {
    missing.push(key);
  }
}

const hasYouTube = oneOfYouTube.some(k => !!process.env[k]);
if (!hasYouTube) missing.push('VITE_YOUTUBE_API_KEY|REACT_APP_YOUTUBE_API_KEY');

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
  [...REQUIRED, hasYouTube ? oneOfYouTube.find(k=>process.env[k]) : ''].filter(Boolean).forEach(k => {
    if (!k) return;
    const val = process.env[k];
    const redacted = val && val.length > 8 ? val.slice(0,4) + '...' + val.slice(-4) : 'set';
    console.log(`  - ${k}: ${redacted}`);
  });
  console.log('Proceeding with build...\n');
}
