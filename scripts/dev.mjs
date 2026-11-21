import { watch } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ROOT } from './paths.mjs';

const build = () =>
  execFileSync(process.execPath, [resolve(ROOT, 'scripts/build.mjs'), '--offline'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
build();
const server = spawn(process.execPath, [resolve(ROOT, 'scripts/serve.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
  windowsHide: true,
});
let timer;
const watchers = ['src', 'public', 'data'].map((folder) =>
  watch(resolve(ROOT, folder), { recursive: true }, (_, file) => {
    if (file?.toString() === 'product-routes.json') return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
        console.log('Site atualizado. Recarregue a página no navegador.');
      } catch {
        console.error('Corrija o arquivo indicado para continuar.');
      }
    }, 200);
  }),
);
function close() {
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  server.kill();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
server.on('exit', close);
