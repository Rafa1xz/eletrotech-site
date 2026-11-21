import { ROOT, OUTPUT, mediaPath } from './paths.mjs';
import { loadPageTemplate } from './templates.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderPage } from './cms-render.mjs';
import { loadSiteTexts } from './site-texts.mjs';
const root = ROOT;
const { catalog: textCatalog, documents: textDocuments } = await loadSiteTexts(
  new URL('../', import.meta.url),
);
await writeFile(
  resolve(OUTPUT, 'js/site-texts.js'),
  '// Generated public site copy; no credentials.\nwindow.ELETROTECH_TEXTS = ' +
    JSON.stringify(textDocuments).replace(/</g, '\\u003c') +
    ';\n',
);
const json = async (file) => JSON.parse(await readFile(resolve(root, file), 'utf8'));
const [{ pages }, { services }, site, defaults, icons] = await Promise.all([
  json('data/pages.json'),
  json('data/services.json'),
  json('data/site.json'),
  json('data/site-defaults.json'),
  json('src/templates/service-icons.json'),
]);
for (const page of pages) {
  if (
    !/^[a-z0-9-]+$/.test(page.pageId) ||
    ![
      'index.html',
      'produtos.html',
      'como-trabalhamos.html',
      'oxilife-fish.html',
      'contato.html',
      'portfolio.html',
    ].includes(page.file)
  )
    throw Error('Página inválida.');
  const template = await loadPageTemplate(page.pageId);
  const html = renderPage(template, page, site, { services, icons, defaults, pages, textCatalog });
  for (const image of page.images || []) await mediaPath(image.src);
  // Fail before writing when a local image/video is missing.
  for (const match of html.matchAll(/(?:src|poster|data-src)="((?:images|videos)\/[^"?#]+)"/g))
    await mediaPath(match[1]);
  await writeFile(resolve(OUTPUT, page.file), html);
}
console.log(`Renderizadas ${pages.length} páginas e os serviços do CMS.`);

await writeFile(
  resolve(OUTPUT, 'servicos.html'),
  await readFile(resolve(root, 'src/redirects/servicos.html'), 'utf8'),
);
