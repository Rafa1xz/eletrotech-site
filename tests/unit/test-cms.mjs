import { loadPageTemplate } from '../../scripts/templates.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { renderPage, validLink, localMedia } from '../../scripts/cms-render.mjs';
import { cmsMediaFile, mapPage, mapService, mergePage } from '../../scripts/cms-content.mjs';
import { missingPageFields } from '../../scripts/cms-migration.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const defaults = await read('data/cms-defaults.json');
const site = await read('data/site-defaults.json');
const icons = await read('src/templates/service-icons.json');
const template = await loadPageTemplate('home');
const options = { services: defaults.services, icons, defaults: site, pages: defaults.pages };

test('CMS edits remain escaped; section order, visibility and video changes survive rendering', () => {
  const page = structuredClone(defaults.pages.find((p) => p.pageId === 'home'));
  const heading = page.texts.find((t) => t.pt.includes('Energia para seguir'));
  assert(heading);
  heading.pt = '<script>alert(1)</script> & Novo título';
  heading.es = 'Título en español';
  page.sections[1].enabled = false;
  const first = page.sections.shift();
  page.sections.push(first);
  page.videos[0].enabled = false;
  page.videos[0].playbackRate = 1;
  page.videos[0].loop = false;
  const html = renderPage(template, page, site, options),
    $ = load(html);
  assert.equal($(`[data-cms-text="${heading.key}"]`).text(), heading.pt);
  assert.equal($(`[data-cms-text="${heading.key}"]`).attr('data-es'), 'Título en español');
  assert.equal($('script').filter((_, el) => $(el).text().includes('alert(1)')).length, 0);
  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.equal($('main>[data-cms-section]').last().attr('data-cms-section'), first.key);
  assert.equal($('main>[data-cms-section][hidden]').length, 1);
  assert.equal($('video').attr('data-video-enabled'), 'false');
  assert.equal($('video').attr('data-playback-rate'), '1');
  assert(!$('video').attr('loop'));
  assert.equal(renderPage(template, page, site, options), html, 'Rendering is deterministic');
});

test('Services can be created, reordered and hidden without changing stable links', () => {
  const page = defaults.pages.find((p) => p.pageId === 'home');
  const added = {
    ...defaults.services[0],
    serviceId: 'cms-new',
    name: 'Novo serviço <seguro>',
    order: -1,
    showOnHome: true,
  };
  const services = [
    ...defaults.services.map((s, i) => (i === 0 ? { ...s, active: false } : s)),
    added,
  ];
  const $ = load(renderPage(template, page, site, { ...options, services }));
  assert.equal($('.service-card').first().attr('id'), 'cms-new');
  assert.equal($('#cms-new h3').text(), added.name);
  assert.equal($(`#${services[0].serviceId}[hidden]`).length, 1);
  assert.equal($('#cms-new [data-whatsapp]').attr('href'), `https://wa.me/${site.whatsapp}`);
  assert.throws(
    () => renderPage(template, page, site, { ...options, services: [added, added] }),
    /duplicado/,
  );
});

test('Shared branding/contact settings update every generated page and direct contact channels', async () => {
  const config = {
    ...site,
    name: 'Loja Teste',
    whatsapp: '5545999999999',
    phone: '+5545888888888',
    phoneLabel: '+55 45 88888-8888',
    email: 'contato@example.com',
    instagram: 'https://instagram.com/lojateste',
    instagramLabel: '@lojateste',
    footerPt: 'Uma nova descrição',
    footerStart: '#abcdef',
    footerEnd: '#eeeeee',
    businessHours: 'Segunda a sexta',
  };
  for (const page of defaults.pages) {
    const source = await loadPageTemplate(page.pageId);
    const $ = load(renderPage(source, page, config, options));
    assert.equal($('.brand img').attr('alt'), 'Loja Teste');
    assert($('.site-footer').attr('style').includes('#abcdef'));
    assert($('.footer-grid>div:first-child>p').text().includes('Uma nova descrição'));
    $('a[href^="mailto:"]').each((_, el) =>
      assert.equal($(el).attr('href'), 'mailto:contato@example.com'),
    );
    $('a[href^="tel:"]').each((_, el) => assert.equal($(el).attr('href'), 'tel:+5545888888888'));
    $('a[href^="https://wa.me/"]').each((_, el) =>
      assert.equal(new URL($(el).attr('href')).pathname, '/5545999999999'),
    );
    if (page.pageId === 'contact') {
      assert.equal($('form#quote-form').length, 0);
      assert.equal($('#contato-direto').length, 1);
      assert.equal($('.contact-direct-links a').length, 3);
      assert.equal($('.contact-hours').text(), 'Segunda a sexta');
    }
  }
});

test('CMS upload mapping supports images, video and posters and rejects unsafe paths', async () => {
  const root = 'https://cdn.sanity.io';
  assert.equal(
    cmsMediaFile(`${root}/files/abc/production/hash.mp4`, 'abc', 'production', 'video'),
    'videos/sanity-hash.mp4',
  );
  assert.equal(
    cmsMediaFile(`${root}/images/abc/production/hash-200x200.png`, 'abc', 'production'),
    'images/sanity-hash-200x200.png',
  );
  for (const url of [
    `${root}/files/other/production/hash.mp4`,
    `${root}/files/abc/production/hash.html`,
    `${root}/files/abc/production/hash.mp4?x=1`,
    'https://example.com/a.mp4',
  ])
    assert.throws(() => cmsMediaFile(url, 'abc', 'production', 'video'));
  for (const href of [
    'javascript:alert(1)',
    'data:text/html,hello',
    '//evil.example',
    '../outside.html',
    'https://example.com/\n',
  ])
    assert.throws(() => validLink(href));
  assert.equal(validLink('produtos.html#catalogo'), 'produtos.html#catalogo');
  assert.equal(validLink('images/real.png'), 'images/real.png');
  assert.throws(() => localMedia('videos/a.mp4'));
  assert.throws(() => localMedia('images/../secret.jpg'));
  const page = await mapPage(
    {
      images: [{ src: 'images/old.png', uploadedUrl: 'new' }],
      videos: [{ src: 'videos/old.mp4', uploadedUrl: 'movie', posterUrl: 'poster' }],
    },
    async (url, kind) =>
      `${kind === 'video' ? 'videos' : 'images'}/${url}.${kind === 'video' ? 'mp4' : 'png'}`,
  );
  assert.equal(page.images[0].src, 'images/new.png');
  assert.equal(page.videos[0].src, 'videos/movie.mp4');
  assert.equal(page.videos[0].poster, 'images/poster.png');
  const service = await mapService(
    { src: 'images/old.png', uploadedUrl: 'new' },
    async () => 'images/new.png',
  );
  assert.equal(service.src, 'images/new.png');
});

test('Merchant menu settings control order, ES-only labels and optional pages across the site', async () => {
  const pages = structuredClone(defaults.pages);
  const home = pages.find((p) => p.pageId === 'home');
  home.menuTitleEs = 'Página inicial';
  home.menuOrder = 20;
  const portfolio = pages.find((p) => p.pageId === 'portfolio');
  portfolio.showInMenu = true;
  portfolio.menuOrder = 0;
  portfolio.menuTitle = 'Projetos <reais>';
  portfolio.menuTitleEs = 'Proyectos';
  pages.find((p) => p.pageId === 'catalog').showInMenu = false;
  for (const page of pages) {
    const source = await loadPageTemplate(page.pageId);
    const $ = load(renderPage(source, page, site, { ...options, pages }));
    const links = $('#main-nav>a:not(.mobile-menu-cta)');
    assert.equal(links.first().attr('href'), 'portfolio.html');
    assert.equal(links.first().text(), 'Projetos <reais>');
    assert.equal(links.last().attr('href'), 'index.html');
    assert.equal(links.last().find('span').attr('data-es'), 'Página inicial');
    assert.equal($('#main-nav>a[href="produtos.html"]').length, 0);
    assert.equal($('#main-nav .mobile-menu-cta').length, 1);
    assert.equal($('#main-nav a[aria-current="page"]').length, page.pageId === 'catalog' ? 0 : 1);
    assert(!$('#main-nav script').length);
  }
});

test('Uploaded background images are editable without removing the approved overlay', async () => {
  const page = structuredClone(defaults.pages.find((p) => p.pageId === 'oxilife'));
  page.images.find((item) => item.key === 'background-001').src = 'images/new-background.png';
  const source = await loadPageTemplate('oxilife');
  const $ = load(renderPage(source, page, site, options));
  assert(
    $('[data-cms-background]')
      .attr('style')
      .includes("--cms-background:url('images/new-background.png')"),
  );
  const css = await readFile('src/styles/oxilife.css', 'utf8');
  assert.match(css, /var\(\s*--cms-background,\s*url\(/);
  page.images.find((item) => item.key === 'background-001').src = "images/x.png');color:red";
  assert.throws(() => renderPage(source, page, site, options), /inválida/);
});

test('Layout migration adds new fields once and preserves published edits and drafts', () => {
  const base = defaults.pages.find((p) => p.pageId === 'oxilife');
  const remote = structuredClone(base);
  delete remote.menuOrder;
  remote.images = remote.images.filter((item) => item.key !== 'background-001').reverse();
  remote.images[0].src = 'images/merchant-photo.png';
  remote.images[0].image = { asset: { _ref: 'merchant-upload' } };
  remote.texts[0].pt = 'Título editado';
  remote.sections.reverse();
  remote.file = 'outside.html';
  const merged = mergePage(base, remote);
  assert.equal(merged.file, base.file);
  assert.equal(merged.texts[0].pt, 'Título editado');
  assert.deepEqual(merged.sections, remote.sections);
  assert.equal(merged.images[0].src, 'images/merchant-photo.png');
  assert.equal(merged.images[0].image.asset._ref, 'merchant-upload');
  assert.equal(merged.images.at(-1).key, 'background-001');
  const patch = missingPageFields(base, remote);
  assert.deepEqual(Object.keys(patch).sort(), ['images', 'menuOrder']);
  assert.deepEqual(missingPageFields(base, { ...remote, ...patch }), {});
  const draft = { ...remote, _id: 'drafts.' + base._id, menuOrder: 42 };
  assert.equal(missingPageFields(base, draft).menuOrder, undefined);
  assert.equal(remote.images.length, base.images.length - 1);
});
