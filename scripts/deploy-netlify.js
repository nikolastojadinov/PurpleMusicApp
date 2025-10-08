#!/usr/bin/env node
/**
 * Fallback Netlify deploy script.
 * - Builds the project
 * - Deploys using Netlify CLI (production)
 * Provides colored logs and error guidance.
 */
const { spawn } = require('child_process');

const colors = {
  green: txt => `\x1b[32m${txt}\x1b[0m`,
  red: txt => `\x1b[31m${txt}\x1b[0m`,
  yellow: txt => `\x1b[33m${txt}\x1b[0m`,
  cyan: txt => `\x1b[36m${txt}\x1b[0m`
};

function run(cmd, args, opts={}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)));
  });
}

(async function main(){
  console.log(colors.cyan('[deploy-netlify] Starting fallback deployment...'));
  try {
    // Ensure Netlify CLI is installed or advise user
    try {
      await run('netlify', ['--version']);
    } catch(_) {
      console.log(colors.yellow('[deploy-netlify] Netlify CLI not found. Installing locally...'));
      await run('npm', ['install','--no-audit','--no-fund','netlify-cli']);
    }

    console.log(colors.cyan('[deploy-netlify] Building project...'));
    await run('CI=false npm run build');

    console.log(colors.cyan('[deploy-netlify] Deploying build directory to production...'));
    await run('npx netlify deploy --prod --dir=build');

    console.log(colors.green('\n[deploy-netlify] ✅ Deployment successful!'));
    console.log(colors.cyan('If site URL not shown above, visit Netlify dashboard for deployment details.'));
  } catch(err){
    const msg = err.message || String(err);
    console.error(colors.red(`\n[deploy-netlify] Deployment failed: ${msg}`));
    if (/auth|login|token|unauthorized|permission/i.test(msg)) {
      console.error(colors.yellow('\nPossible authentication issue. Run: netlify login')); 
    }
    console.error(colors.yellow('You can also deploy manually: npx netlify deploy --prod --dir=build'));
    process.exitCode = 1;
  }
})();
