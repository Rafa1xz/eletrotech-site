import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import postcss from 'postcss';
import { OUTPUT } from './paths.mjs';

const external = (value) => /^(?:[a-z]+:|\/\/)/i.test(value);
const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export async function validateSite(root = OUTPUT) {
  let pages = 0,
    links = 0;
  const htmlCache = new Map(),
    issues = [];
  async function html(path) {
    if (!htmlCache.has(path)) htmlCache.set(path, await readFile(path, 'utf8'));
    return htmlCache.get(path);
  }
  async function reference(value, from) {
    if (!value || external(value)) return;
    const [resource, anchor] = value.split('#'),
      path = resolve(dirname(from), decodeURIComponent(resource.split('?')[0] || '.'));
    const target = resource.split('?')[0] ? path : from;
    if (relative(root, target).startsWith('..')) {
      issues.push(`Referência fora do site: ${value}`);
      return;
    }
    try {
      await access(target);
    } catch {
      issues.push(`${relative(root, from)}: arquivo ausente ${value}`);
      return;
    }
    if (
      anchor &&
      target.endsWith('.html') &&
      !load(await html(target))('[id]')
        .toArray()
        .some((el) => el.attribs.id === decodeURIComponent(anchor))
    )
      issues.push(`${relative(root, from)}: âncora ausente ${value}`);
    links++;
  }
  async function walk(folder) {
    for (const item of await readdir(folder, { withFileTypes: true })) {
      const path = resolve(folder, item.name);
      if (item.isDirectory()) {
        await walk(path);
        continue;
      }
      if (item.name.endsWith('.html')) {
        const source = await html(path),
          $ = load(source, { scriptingEnabled: false });
        pages++;
        const stack = [];
        const markup = source
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2');
        for (const tag of markup.matchAll(/<\/?([a-zA-Z][\w-]*)\b[^>]*>/g)) {
          const name = tag[1].toLowerCase();
          if (tag[0].startsWith('</')) {
            if (stack.pop() !== name) {
              issues.push(`${relative(root, path)}: fechamento inesperado de ${name}`);
              break;
            }
          } else if (!voidTags.has(name) && !tag[0].endsWith('/>')) stack.push(name);
        }
        if (stack.length) issues.push(`${relative(root, path)}: tags não fechadas`);
        for (const el of $('[href],[src],[poster],[data-src]').toArray())
          for (const attr of ['href', 'src', 'poster', 'data-src'])
            await reference($(el).attr(attr), path);
        for (const el of $('[style]').toArray())
          for (const match of ($(el).attr('style') || '').matchAll(
            /url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g,
          ))
            await reference(match[1], path);
      }
      if (item.name.endsWith('.css')) {
        const css = await readFile(path, 'utf8');
        postcss.parse(css, { from: path });
        for (const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))
          await reference(match[1], path);
      }
    }
  }
  await walk(root);
  if (!pages) issues.push('Nenhuma página foi gerada.');
  if (issues.length) throw Error(issues.join('\n'));
  console.log(`Site validado: ${pages} páginas; ${links} arquivos e âncoras locais verificados.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await validateSite();
