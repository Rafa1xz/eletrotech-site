import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ROOT, resetOutput } from './paths.mjs';

const run = (script) =>
  execFileSync(process.execPath, [resolve(ROOT, 'scripts', script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
if (!process.argv.includes('--offline')) run('sync-sanity.mjs');
await resetOutput();
run('render-content.mjs');
run('build-products.mjs');
run('prepare-site.mjs');
