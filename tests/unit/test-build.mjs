import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { fixture } from '../helpers/fixtures.mjs';
import { createMediaDownloader } from '../../scripts/media.mjs';

test('A clean build preserves public URLs and excludes source, secrets, exports and obsolete output', async (t) => {
  const root = await fixture(t, { project: true });
  await mkdir(resolve(root, 'dist/admin'), { recursive: true });
  await writeFile(resolve(root, 'dist/admin/index.html'), 'obsolete');
  await writeFile(resolve(root, '.env'), 'PRIVATE_TOKEN=private');
  await writeFile(resolve(root, 'data/cms-import.ndjson'), 'private export');
  const build = () =>
    execFileSync(process.execPath, [resolve(root, 'scripts/build.mjs'), '--offline'], {
      cwd: root,
      stdio: 'pipe',
    });
  build();
  const html = async () => load(await readFile(resolve(root, 'dist/index.html'), 'utf8'));
  let $ = await html();
  assert.equal($('link[rel=stylesheet]').length, 2, 'Styles use a shared base and a page bundle');
  const styleUrls = () =>
    $('link[rel=stylesheet]')
      .map((_, el) => $(el).attr('href'))
      .get()
      .join(',');
  const firstStyle = styleUrls();
  const sharedStyle = $('link[rel=stylesheet]').first().attr('href');
  const firstScript = $('script[src^="js/script.js"]').attr('src');
  for (const path of [
    'index.html',
    'servicos.html',
    'produtos.html',
    'contato.html',
    'produtos/motores-hercules.html',
    'data/product-routes.json',
  ])
    await access(resolve(root, 'dist', path));
  for (const path of ['admin', 'studio', 'src', '.env', 'data/cms-import.ndjson'])
    await assert.rejects(access(resolve(root, 'dist', path)));
  await writeFile(
    resolve(root, 'src/styles/floating-contact.css'),
    (await readFile(resolve(root, 'src/styles/floating-contact.css'), 'utf8')) + '\n/* revision */',
  );
  await writeFile(
    resolve(root, 'src/scripts/script.js'),
    (await readFile(resolve(root, 'src/scripts/script.js'), 'utf8')) + '\n// revision\n',
  );
  build();
  $ = await html();
  assert.notEqual(styleUrls(), firstStyle, 'Imported CSS also invalidates the bundle');
  assert.equal(
    $('link[rel=stylesheet]').first().attr('href'),
    sharedStyle,
    'Unchanged base styles stay cached',
  );
  assert.notEqual(
    $('script[src^="js/script.js"]').attr('src'),
    firstScript,
    'Runtime changes invalidate cached scripts',
  );
  const second = await readFile(resolve(root, 'dist/index.html'), 'utf8');
  build();
  assert.equal(
    await readFile(resolve(root, 'dist/index.html'), 'utf8'),
    second,
    'Build is deterministic',
  );
});

test('Sanity media reuse existing originals and isolate new uploads in the cache', async (t) => {
  const root = await fixture(t);
  for (const folder of ['images', 'videos'])
    await mkdir(resolve(root, 'public', folder), { recursive: true });
  const bytes = Buffer.from('known local image'),
    hash = createHash('sha1').update(bytes).digest('hex');
  await writeFile(resolve(root, 'public/images/original.png'), bytes);
  const downloader = await createMediaDownloader('abc', 'production', { root });
  assert.equal(
    await downloader(`https://cdn.sanity.io/images/abc/production/${hash}-1x1.png`),
    'images/original.png',
  );
  await assert.rejects(downloader('https://example.com/image.png'));
  const uploaded = Buffer.from('new uploaded image'),
    uploadedHash = createHash('sha1').update(uploaded).digest('hex');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(uploaded);
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const url = `https://cdn.sanity.io/images/abc/production/${uploadedHash}-1x1.png`;
  const path = await downloader(url);
  assert.equal(await downloader(url), path);
  assert.equal(requests, 1);
  assert.deepEqual(await readFile(resolve(root, '.cache/media', path)), uploaded);
  await assert.rejects(access(resolve(root, 'public', path)));
});
