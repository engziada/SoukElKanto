#!/usr/bin/env node
/**
 * Pre-flight backend reachability check for the Souk ElKanto frontend.
 *
 * Why: the frontend is useless without CoreMesh. Failing FAST and LOUD here
 * prevents the "frontend started before the backend, retries forever" loop.
 *
 * Modes:
 *   node scripts/check-backend.mjs           -> strict: exit 1 if BE is down
 *   node scripts/check-backend.mjs --soft     -> warn only: always exit 0
 *
 * `predev` runs the soft variant so local FE work isn't hard-blocked, while
 * `npm run check:be` runs strict for CI / explicit gating.
 */

const soft = process.argv.includes('--soft');
const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
const healthUrl = `${base.replace(/\/$/, '')}/api/v1/health`;
const timeoutMs = 4000;

async function main() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      console.log(`\x1b[32m[check-backend] OK\x1b[0m  ${healthUrl} -> ${res.status}`);
      process.exit(0);
    }
    fail(`backend responded ${res.status} at ${healthUrl}`);
  } catch (err) {
    clearTimeout(timer);
    const reason = err?.name === 'AbortError' ? `no response within ${timeoutMs}ms` : err?.message ?? String(err);
    fail(`cannot reach backend at ${healthUrl} (${reason})`);
  }
}

function fail(msg) {
  const banner = soft ? '\x1b[33m[check-backend] WARN\x1b[0m' : '\x1b[31m[check-backend] FAIL\x1b[0m';
  console.error(`${banner}  ${msg}`);
  console.error('  The CoreMesh backend must be healthy before the frontend can work.');
  console.error('  Start the full stack in order from the parent folder:');
  console.error('    pwsh ./stack-up.ps1        (or)  pwsh ./stack-status.ps1');
  process.exit(soft ? 0 : 1);
}

main();
