import { mkdtemp, rm, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, sep } from 'node:path';

export async function fixture(t, { project = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'eletrotech-test-'));
  t.after(async () => {
    const local = relative(resolve(tmpdir()), root);
    if (!local.startsWith('eletrotech-test-') || local.includes(sep))
      throw Error('Diretório temporário inesperado.');
    await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });
  if (project) {
    for (const path of ['data', 'public', 'scripts', 'src', 'dist'])
      await cp(resolve(path), join(root, path), { recursive: true });
    await symlink(resolve('node_modules'), join(root, 'node_modules'), 'junction');
  }
  return root;
}
