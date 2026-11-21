import { fixture } from '../helpers/fixtures.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('Publication preserves stable URLs, creates products and handles deactivation', async (t) => {
  const temp = await fixture(t, { project: true });
  const source = join(temp, 'data/products.json');
  const catalog = JSON.parse(await readFile(source, 'utf8'));
  const run = () =>
    execFileSync(process.execPath, [join(temp, 'scripts/build-products.mjs')], {
      cwd: temp,
      stdio: 'pipe',
    });
  run();
  const baseline = await readFile(join(temp, 'dist/produtos/motores-hercules.html'), 'utf8');
  run();
  assert.equal(
    await readFile(join(temp, 'dist/produtos/motores-hercules.html'), 'utf8'),
    baseline,
    'Build must be deterministic',
  );
  const newProduct = {
    ...catalog.products[0],
    id: 'test-only',
    slug: 'test-only',
    name: 'Teste <script>alert(1)</script>',
    sku: 'SKU-TESTE',
    price: 120,
    salePrice: 100,
    stock: 2,
    variations: ['Modelo de teste'],
  };
  catalog.products.push(newProduct);
  await writeFile(source, JSON.stringify(catalog));
  run();
  const generated = await readFile(join(temp, 'dist/produtos/test-only.html'), 'utf8');
  assert(generated.includes('Teste &lt;script&gt;'));
  assert(!generated.includes('<script>alert(1)</script>'));
  assert(generated.includes('SKU-TESTE'));
  assert(generated.includes('R$'));
  assert(generated.includes('product-variation'));
  assert(
    (await readFile(join(temp, 'dist/produtos.html'), 'utf8')).includes('produtos/test-only.html'),
  );
  newProduct.active = false;
  await writeFile(source, JSON.stringify(catalog));
  run();
  assert(
    (await readFile(join(temp, 'dist/produtos/test-only.html'), 'utf8')).includes('noindex,follow'),
  );
  assert(!(await readFile(join(temp, 'dist/sitemap.xml'), 'utf8')).includes('test-only.html'));
  assert(
    !(await readFile(join(temp, 'dist/produtos.html'), 'utf8')).includes('produtos/test-only.html'),
  );
  catalog.products.pop();
  await writeFile(source, JSON.stringify(catalog));
  run();
  assert(
    (await readFile(join(temp, 'dist/produtos/test-only.html'), 'utf8')).includes(
      'Produto indisponível',
    ),
  );
  catalog.products[0].slug = 'url-alterada';
  await writeFile(source, JSON.stringify(catalog));
  assert.throws(run);
});
