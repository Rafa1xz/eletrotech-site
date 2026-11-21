import { access, mkdir, rm } from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const OUTPUT = resolve(ROOT, 'dist');
export const PUBLIC = resolve(ROOT, 'public');
export const CACHE = resolve(ROOT, '.cache/media');

export async function resetOutput(root = ROOT) {
  const output = within(root, 'dist');
  await rm(output, { recursive: true, force: true });
  await mkdir(resolve(output, 'js'), { recursive: true });
  return output;
}

export function within(root, path) {
  const target = resolve(root, path),
    local = relative(root, target);
  if (!local || local === '..' || local.startsWith('..' + sep) || isAbsolute(local))
    throw Error('Caminho fora do diretório permitido: ' + path);
  return target;
}

export async function mediaPath(path, { root = ROOT } = {}) {
  if (!/^(?:images|videos)\/[a-zA-Z0-9_.-]+$/.test(path))
    throw Error('Caminho de mídia inválido: ' + path);
  for (const directory of ['public', '.cache/media']) {
    const target = within(resolve(root, directory), path);
    try {
      await access(target);
      return target;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw Error('Arquivo de mídia ausente: ' + path);
}
