import { readFile, readdir, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { ROOT, within } from './paths.mjs';
import { cmsMediaFile } from './cms-content.mjs';

export async function createMediaDownloader(project, dataset, { root = ROOT } = {}) {
  const originals = new Map();
  for (const folder of ['images', 'videos']) {
    for (const name of (await readdir(resolve(root, 'public', folder))).sort()) {
      const path = `${folder}/${name}`;
      const hash = createHash('sha1')
        .update(await readFile(resolve(root, 'public', path)))
        .digest('hex');
      if (!originals.has(hash)) originals.set(hash, path);
    }
  }
  const pending = new Map();
  return async function download(url, kind = 'image') {
    if (pending.has(url)) return pending.get(url);
    const job = (async () => {
      const local = cmsMediaFile(url, project, dataset, kind);
      const hash = local.match(/sanity-([a-f0-9]{40})(?:-|\.)/)?.[1];
      if (hash && originals.has(hash)) return originals.get(hash);
      const target = within(resolve(root, '.cache/media'), local);
      try {
        await access(target);
        return local;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw Error(`Falha ao baixar mídia do Sanity: HTTP ${response.status}.`);
      const limit = (kind === 'video' ? 80 : 20) * 1024 * 1024;
      if (Number(response.headers.get('content-length')) > limit)
        throw Error('Mídia excede o limite de publicação.');
      const chunks = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > limit) throw Error('Mídia excede o limite de publicação.');
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks);
      if (hash && createHash('sha1').update(bytes).digest('hex') !== hash)
        throw Error('Arquivo de mídia não corresponde ao conteúdo informado pelo Sanity.');
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
      return local;
    })();
    pending.set(url, job);
    return job;
  };
}
