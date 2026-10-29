import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetFile, mapProduct, validateConfig, productQuery} from '../../scripts/sanity-content.mjs';
import {mkdtemp, mkdir, writeFile, readFile, cp, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {canonicalJson, mergeRoutes} from '../../scripts/publication-state.mjs';

test('Automatic publication ignores object key order and preserves previously deployed CMS routes', () => {
  assert.equal(canonicalJson({b: 2, a: [{y: 1, x: 0}]}), canonicalJson({a: [{x: 0, y: 1}], b: 2}));
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
  const local = {'product-1': 'motores-hercules'};
  const merged = mergeRoutes(local, {...local, 'cms-new': 'novo-produto'});
  assert.equal(merged['cms-new'], 'novo-produto');
  assert(!('cms-new' in local));
  assert.throws(() => mergeRoutes(local, {'product-1': 'alterado'}));
  assert.throws(() => mergeRoutes(local, {'cms-new': 'motores-hercules'}));
  assert.throws(() => mergeRoutes(local, {'cms-new': '../invalido'}));
});

test('Sanity assets remain local and belong to the configured project', () => {
  assert.equal(assetFile('https://cdn.sanity.io/images/abc/production/hash-800x600.jpg', 'abc', 'production'), 'images/sanity-hash-800x600.jpg');
  for (const url of ['https://example.com/a.jpg', 'https://cdn.sanity.io/images/other/production/hash.jpg', 'https://cdn.sanity.io/images/abc/production/hash.jpg?x=1']) {
    assert.throws(() => assetFile(url, 'abc', 'production'));
  }
  assert.throws(() => validateConfig('bad/project', 'production'));
});

test('Sanity mapping preserves IDs, zero stock, unknown prices and image uploads', async () => {
  const doc = {id: 'product-1', slug: 'motores-hercules', active: true, name: 'Motor', src: 'images/old.jpg', imageUrl: 'main', gallery: ['images/existing.jpg'], galleryUrls: ['extra'], stock: 0};
  const mapped = await mapProduct(doc, async value => `images/${value}.jpg`);
  assert.equal(mapped.id, doc.id);
  assert.equal(mapped.slug, doc.slug);
  assert.equal(mapped.src, 'images/main.jpg');
  assert.deepEqual(mapped.gallery, ['images/existing.jpg', 'images/extra.jpg']);
  assert.equal(mapped.price, null);
  assert.equal(mapped.stock, 0);
  assert.deepEqual(mapped.specifications, []);
  assert(!('imageUrl' in mapped));
  assert(productQuery.includes('slug.current'));
  await assert.rejects(mapProduct({...doc, slug: null}, async x => x));
});

test('Public package removes old admin artifacts and excludes CMS exports and secrets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'eletrotech-package-test-'));
  for (const dir of ['assets','css','js','images','videos','produtos','data','studio','_site/admin']) await mkdir(join(root, dir), {recursive: true});
  await writeFile(join(root, '_site/admin/index.html'), 'obsolete admin');
  await writeFile(join(root, 'studio/secret.json'), 'private');
  await writeFile(join(root, '.env'), 'TOKEN=private');
  await writeFile(join(root, 'data/sanity-import.ndjson'), 'private export');
  await writeFile(join(root, 'index.html'), '<html></html>');
  for (const file of ['products.json','site.json','product-routes.json']) await writeFile(join(root, 'data', file), '{}');
  await cp(resolve('scripts/prepare-site.mjs'), join(root, 'prepare-site.mjs'));
  execFileSync(process.execPath, [join(root, 'prepare-site.mjs')], {cwd: root});
  assert.equal(await readFile(join(root, '_site/data/products.json'), 'utf8'), '{}');
  for (const entry of ['admin','studio','.env','data/sanity-import.ndjson']) await assert.rejects(access(join(root, '_site', entry)));
});
