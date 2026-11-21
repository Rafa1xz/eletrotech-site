import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { parse } from 'acorn';
import postcss from 'postcss';
import { ROOT } from './paths.mjs';

let scripts = 0,
  styles = 0;
async function check(folder) {
  for (const entry of await readdir(resolve(ROOT, folder), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist')
      continue;
    const path = `${folder}/${entry.name}`;
    if (entry.isDirectory()) {
      await check(path);
      continue;
    }
    const source = await readFile(resolve(ROOT, path), 'utf8');
    if (/\.(?:js|mjs)$/.test(path)) {
      const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
      for (const node of ast.body)
        if (node.source?.value?.startsWith('.'))
          await access(resolve(dirname(resolve(ROOT, path)), node.source.value));
      scripts++;
    }
    if (path.endsWith('.css')) {
      postcss.parse(source, { from: path });
      styles++;
    }
  }
}
for (const folder of ['src', 'scripts', 'tests', 'studio']) await check(folder);
console.log(`Sintaxe validada: ${scripts} arquivos JavaScript e ${styles} folhas de estilo.`);
