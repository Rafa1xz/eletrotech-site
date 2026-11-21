import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deploymentUrl, preservePublishedRoutes } from '../../scripts/deployment.mjs';
import { loadPageTemplate } from '../../scripts/templates.mjs';
import { renderPage } from '../../scripts/cms-render.mjs';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';

test('Vercel uses the production domain for canonical links, including in previews', () => {
  const original = 'https://rafa1xz.github.io/eletrotech-site/';
  assert.equal(deploymentUrl(original, {}), original);
  assert.equal(
    deploymentUrl(original, {
      VERCEL: '1',
      VERCEL_PROJECT_PRODUCTION_URL: 'loja.vercel.app',
      VERCEL_URL: 'preview-random.vercel.app',
    }),
    'https://loja.vercel.app/',
  );
  assert.equal(
    deploymentUrl(original, { SITE_URL: 'https://www.loja.example' }),
    'https://www.loja.example/',
  );
  assert.throws(() => deploymentUrl(original, { VERCEL: '1' }));
  for (const SITE_URL of [
    'http://example.com',
    'https://user:password@example.com',
    'https://example.com/?secret=1',
  ])
    assert.throws(() => deploymentUrl(original, { SITE_URL }));
});

test('Moving hosting preserves published product routes and permits a new domain with no first deployment', async () => {
  const routes = { 'product-1': 'motores-hercules' };
  const fetchImpl = async (url) =>
    url.hostname === 'old.example'
      ? Response.json({ 'product-1': 'motores-hercules', 'cms-new': 'produto-publicado' })
      : new Response('', { status: 404 });
  const merged = await preservePublishedRoutes(
    routes,
    ['https://old.example/', 'https://new.example/'],
    { fetchImpl },
  );
  assert.equal(merged['cms-new'], 'produto-publicado');
  assert(!routes['cms-new']);
  await assert.rejects(
    preservePublishedRoutes(routes, ['https://old.example/'], {
      fetchImpl: async () => new Response('', { status: 503 }),
    }),
  );
  await assert.rejects(
    preservePublishedRoutes(routes, ['https://old.example/'], {
      fetchImpl: async () => Response.json({ 'product-1': 'url-alterada' }),
    }),
  );
});

test('Managed page metadata follows the configured production URL on every page', async () => {
  const { pages } = JSON.parse(await readFile('data/pages.json', 'utf8'));
  const site = JSON.parse(await readFile('data/site.json', 'utf8'));
  for (const page of pages) {
    const $ = load(
      renderPage(
        await loadPageTemplate(page.pageId),
        page,
        { ...site, url: 'https://loja.example/' },
        { pages },
      ),
    );
    const expected = new URL(page.file, 'https://loja.example/').href;
    assert.equal($('link[rel=canonical]').length, 1);
    assert.equal($('link[rel=canonical]').attr('href'), expected);
    assert.equal($('meta[property="og:url"]').attr('content'), expected);
  }
});
