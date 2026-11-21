import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ROOT, resetOutput } from './paths.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { deploymentUrl, preservePublishedRoutes } from './deployment.mjs';

const run = (script) =>
  execFileSync(process.execPath, [resolve(ROOT, 'scripts', script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
if (!process.argv.includes('--offline')) {
  if (process.env.VERCEL === '1' && !process.env.SANITY_PROJECT_ID)
    throw Error('Configure SANITY_PROJECT_ID e SANITY_DATASET nas variáveis do projeto Vercel.');
  run('sync-sanity.mjs');
  const path = resolve(ROOT, 'data/site.json'),
    site = JSON.parse(await readFile(path, 'utf8'));
  const previous = site.url;
  site.url = deploymentUrl(site.url);
  if (process.env.VERCEL === '1') {
    const routeFile = resolve(ROOT, 'data/product-routes.json');
    const routes = await preservePublishedRoutes(JSON.parse(await readFile(routeFile, 'utf8')), [
      previous,
      site.url,
    ]);
    await writeFile(routeFile, JSON.stringify(routes, null, 2) + '\n');
  }
  await writeFile(path, JSON.stringify(site, null, 2) + '\n');
}
await resetOutput();
run('render-content.mjs');
run('build-products.mjs');
run('prepare-site.mjs');
