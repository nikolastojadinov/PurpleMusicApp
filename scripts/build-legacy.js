/*
  build-legacy.js
  Generates a single fallback bundle (legacy.bundle.js) transpiled by esbuild to an older target
  for browsers that fail on modern syntax (e.g., optional chaining inside dependencies).

  Strategy:
   - Bundle entire app (including node_modules) to ensure optional chaining is lowered.
   - Target ES2017 (safe for most older modern WebViews); adjust to 'es2016/es5' if needed.
   - Inject basic env defines for process.env.* used by CRA runtime paths.
*/
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Collect REACT_APP_ env vars (Netlify or process env) so legacy bundle has same config.
const defines = {
  'process.env.NODE_ENV': '"production"'
};
Object.keys(process.env).forEach(k => {
  if (k.startsWith('REACT_APP_')) {
    defines['process.env.' + k] = JSON.stringify(process.env[k]);
  }
});

const outFile = path.join('build', 'legacy.bundle.js');

esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: outFile,
  target: ['es2017'],
  platform: 'browser',
  format: 'iife',
  minify: true,
  sourcemap: false,
  define: defines,
  loader: {
    '.js': 'jsx',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.mp3': 'file',
    '.css': 'css'
  },
  logLevel: 'info'
}).then(() => {
  const bytes = fs.statSync(outFile).size;
  console.log(`[legacy] Built legacy bundle: ${outFile} (${(bytes/1024).toFixed(1)} kB)`);
}).catch(err => {
  console.error('[legacy] build failed', err);
  process.exit(1);
});
