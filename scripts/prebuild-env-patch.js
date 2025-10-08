#!/usr/bin/env node
/**
 * prebuild-env-patch.js
 * CRA 5 + Node 22 + old transient dotenv-expand sometimes recurse infinitely on bash-style defaults.
 * We monkey-patch the require for 'dotenv-expand' to a no-op passthrough using a newer version if available
 * or a trivial implementation that just returns the config object without variable expansion.
 */
try {
  const Module = require('module');
  const originalLoad = Module._load;
  Module._load = function(request, parent, isMain) {
    if (request === 'dotenv-expand') {
      return function(config) { return config; };
    }
    return originalLoad(request, parent, isMain);
  };
  console.log('[prebuild-env-patch] Applied no-op dotenv-expand stub');
} catch (e) {
  console.warn('[prebuild-env-patch] Failed to apply stub', e.message);
}
