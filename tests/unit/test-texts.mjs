import { loadPageTemplate } from '../../scripts/templates.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTextCatalog, formatText, mergeTextDocuments } from '../../scripts/text-catalog.mjs';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import vm from 'node:vm';
import { renderPage } from '../../scripts/cms-render.mjs';

const defaults = [
  {
    _id: 'texts-actions',
    entries: [
      {
        key: 'quote',
        sourcePt: 'Solicitar orçamento',
        sourceEs: 'Solicitar presupuesto',
        pt: 'Solicitar orçamento',
        es: 'Solicitar presupuesto',
      },
    ],
  },
];
test('Published copy overrides defaults, preserves missing translations and escapes through renderers', () => {
  const remote = [
    { _id: 'texts-actions', entries: [{ key: 'quote', pt: 'Falar <com> a equipe', es: '' }] },
  ];
  const docs = mergeTextDocuments(defaults, remote);
  const catalog = createTextCatalog(docs);
  assert.equal(
    catalog.pair('Solicitar orçamento', 'Solicitar presupuesto', 'pt'),
    'Falar <com> a equipe',
  );
  assert.equal(
    catalog.pair('Solicitar orçamento', 'Solicitar presupuesto', 'es'),
    'Solicitar presupuesto',
  );
  assert.equal(catalog.pair('Texto novo', 'Texto nuevo', 'es'), 'Texto nuevo');
  assert.equal(defaults[0].entries[0].pt, 'Solicitar orçamento');
});
test('Global published labels are escaped in markup and page text remains independently editable', async () => {
  const source = await loadPageTemplate('home');
  const { pages } = JSON.parse(await readFile('data/pages.json', 'utf8'));
  const site = JSON.parse(await readFile('data/site-defaults.json', 'utf8'));
  const { documents } = JSON.parse(await readFile('data/text-defaults.json', 'utf8'));
  const changed = structuredClone(documents);
  const quote = changed
    .flatMap((d) => d.entries)
    .find((e) => e.sourcePt === 'Solicitar orçamento' && e.sourceEs === 'Solicitar presupuesto');
  assert(quote);
  quote.pt = 'Orçamento <seguro>';
  quote.es = 'Presupuesto seguro';
  const page = structuredClone(pages.find((p) => p.pageId === 'home'));
  const target = page.texts.find((t) => t.pt.includes('Energia para seguir'));
  target.pt = 'Título editado pelo lojista';
  const { services } = JSON.parse(await readFile('data/services.json', 'utf8'));
  const $ = load(
    renderPage(source, page, site, { services, textCatalog: createTextCatalog(changed) }),
  );
  assert.equal($('.service-quote').first().text(), 'Orçamento <seguro>');
  assert.equal($('.service-quote script').length, 0);
  assert.equal($('.service-quote [data-es]').first().attr('data-es'), 'Presupuesto seguro');
  assert.equal($(`[data-cms-text="${target.key}"]`).text(), 'Título editado pelo lojista');
});
test('Browser messages use published PT/ES text and interpolate dynamic values once', async () => {
  const runtime = await readFile('src/scripts/copy-runtime.js', 'utf8');
  const documents = [
    {
      entries: [
        {
          key: 'result',
          sourcePt: '{count} produtos encontrados',
          sourceEs: '{count} productos encontrados',
          pt: 'Encontramos {count} opções',
          es: 'Hay {count} opciones',
        },
      ],
    },
  ];
  const context = {
    window: { ELETROTECH_TEXTS: documents },
    document: { documentElement: { lang: 'pt-BR' } },
  };
  vm.runInNewContext(runtime, context);
  assert.equal(
    context.window.ELETROTECH_COPY.pair(
      '{count} produtos encontrados',
      '{count} productos encontrados',
      undefined,
      { count: 3 },
    ),
    'Encontramos 3 opções',
  );
  context.document.documentElement.lang = 'es';
  assert.equal(
    context.window.ELETROTECH_COPY.pair(
      '{count} produtos encontrados',
      '{count} productos encontrados',
      undefined,
      { count: 1 },
    ),
    'Hay 1 opciones',
  );
});
test('Inventory covers dynamic messages and contains only text, with unique stable keys', async () => {
  const { documents } = JSON.parse(await readFile('data/text-defaults.json', 'utf8'));
  assert.equal(documents.length, 8);
  const entries = documents.flatMap((d) => d.entries),
    keys = entries.map((e) => e.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const source of [
    '{count} produtos encontrados',
    'Olá! Gostaria de um orçamento para {product}{code}. Página: {url}',
  ])
    assert(
      entries.some((e) => e.sourcePt === source),
      source,
    );
  const { pages } = JSON.parse(await readFile('data/page-text-manifest.json', 'utf8'));
  for (const page of pages)
    for (const item of page.texts)
      assert(!/<(?:p|span)\b/i.test(item.pt), 'Markup was inventoried as text');
});
test('Message interpolation never reinterprets customer content or accepts missing placeholders', () => {
  assert.equal(
    formatText('Olá, {name}. {message}', { name: 'Ana', message: '{name} <script>' }),
    'Olá, Ana. {name} <script>',
  );
  assert.throws(() => formatText('Olá, {name}', {}), /name/);
  assert.throws(
    () =>
      mergeTextDocuments(
        [
          {
            _id: 'texts-forms',
            entries: [
              {
                key: 'message',
                sourcePt: 'Olá, {name}',
                sourceEs: 'Hola, {name}',
                pt: 'Olá, {name}',
                es: 'Hola, {name}',
              },
            ],
          },
        ],
        [{ _id: 'texts-forms', entries: [{ key: 'message', pt: 'Oi' }] }],
      ),
    /placeholder/i,
  );
});
