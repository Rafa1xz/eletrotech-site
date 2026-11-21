import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'cheerio';
import { ROOT } from './paths.mjs';

const partials = [
  ['.site-header', 'header'],
  ['.site-footer', 'footer'],
  ['a.floating-contact', 'floating-contact'],
];

export async function loadPageTemplate(pageId, { root = ROOT } = {}) {
  if (!/^[a-z0-9-]+$/.test(pageId)) throw Error('Identificador de página inválido.');
  let html = await readFile(resolve(root, `src/pages/${pageId}.html`), 'utf8');
  for (const [, name] of partials)
    html = html.replace(
      `<!-- site:${name} -->`,
      await readFile(resolve(root, `src/partials/${name}.html`), 'utf8'),
    );
  return html;
}

// Inventory edits the shared components once, without copying them into every page.
export async function savePageTemplate(pageId, html, { root = ROOT } = {}) {
  const $ = load(html, { scriptingEnabled: false });
  for (const [selector, name] of partials) {
    const node = $(selector);
    if (node.length !== 1) throw Error('Componente compartilhado ausente: ' + name);
    await writeFile(resolve(root, `src/partials/${name}.html`), node.toString() + '\n');
    node.replaceWith(`<!-- site:${name} -->`);
  }
  await writeFile(resolve(root, `src/pages/${pageId}.html`), $.html());
}
