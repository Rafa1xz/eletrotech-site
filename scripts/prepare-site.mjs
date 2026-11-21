import { cp, mkdir, readdir, readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import postcss from 'postcss';
import { ROOT, mediaPath, within } from './paths.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex').slice(0, 12);
const local = (value) => value && !/^(?:[a-z]+:|\/\/|#)/i.test(value);
const pathname = (value, base) =>
  posix.normalize(posix.join(posix.dirname(base), value.split(/[?#]/)[0]));

export async function prepareSite({ root = ROOT } = {}) {
  const output = within(root, 'dist');
  await mkdir(resolve(output, 'css'), { recursive: true });
  await mkdir(resolve(output, 'js'), { recursive: true });
  await cp(resolve(root, 'src/scripts'), resolve(output, 'js'), { recursive: true });
  await mkdir(resolve(output, 'data'), { recursive: true });
  for (const name of ['products', 'site', 'product-routes', 'pages', 'services', 'texts'])
    await cp(resolve(root, `data/${name}.json`), resolve(output, `data/${name}.json`));
  const assets = new Set(),
    cssCache = new Map();
  async function stylesheet(path, ancestors = []) {
    const name = path.replace(/^css\//, '').split('?')[0];
    if (!/^[a-z0-9-]+\.css$/.test(name) || ancestors.includes(name))
      throw Error('Importação CSS inválida: ' + name);
    if (cssCache.has(name)) return cssCache.get(name);
    const ast = postcss.parse(await readFile(resolve(root, 'src/styles', name), 'utf8'), {
      from: name,
    });
    const imports = [];
    ast.walkAtRules('import', (node) => imports.push(node));
    for (const node of imports) {
      const match = node.params.match(/^(?:url\()?['"](?:\.\/)?([^'"]+)['"]\)?$/);
      if (!match) throw Error('Somente imports CSS locais são aceitos: ' + node.params);
      node.replaceWith(
        postcss.parse(await stylesheet('css/' + match[1], [...ancestors, name])).nodes,
      );
    }
    const value = ast.toString();
    cssCache.set(name, value);
    return value;
  }
  const files = [];
  for (const folder of ['', 'produtos']) {
    try {
      for (const name of await readdir(resolve(output, folder)))
        if (name.endsWith('.html')) files.push(posix.join(folder, name));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (const file of files) {
    const $ = load(await readFile(resolve(output, file), 'utf8'), { scriptingEnabled: false });
    const styles = $('link[rel=stylesheet]').filter((_, el) => local($(el).attr('href')));
    if (styles.length) {
      const parts = [];
      for (const el of styles.toArray())
        parts.push(await stylesheet(pathname($(el).attr('href'), file)));
      // Reuse the common base across navigation, preserving the original cascade.
      const paths = styles.toArray().map((el) => pathname($(el).attr('href'), file));
      const shared =
        paths[0] === 'css/styles.css' && paths[1] === 'css/industrial.css' && parts.length > 2;
      const groups = shared ? [parts.slice(0, 2), parts.slice(2)] : [parts];
      for (const [index, group] of groups.entries()) {
        const css = group.join('\n'),
          bundle = `css/bundle-${digest(css)}.css`;
        await writeFile(resolve(output, bundle), css);
        styles.eq(index).attr('href', posix.relative(posix.dirname(file), bundle));
        for (const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))
          if (local(match[1])) assets.add(pathname(match[1], bundle));
      }
      styles.slice(groups.length).remove();
    }
    for (const el of $('script[src]').toArray()) {
      const node = $(el),
        src = node.attr('src');
      if (!local(src)) continue;
      const path = pathname(src, file),
        bytes = await readFile(within(output, path));
      node.attr('src', src.split('?')[0] + '?v=' + digest(bytes));
    }
    $('[src],[href],[poster],[data-src]').each((_, el) => {
      const node = $(el);
      for (const attr of ['src', 'href', 'poster', 'data-src'])
        if (local(node.attr(attr))) assets.add(pathname(node.attr(attr), file));
    });
    $('[style]').each((_, el) => {
      for (const match of ($(el).attr('style') || '').matchAll(
        /url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g,
      ))
        if (local(match[1])) assets.add(pathname(match[1], file));
    });
    await writeFile(resolve(output, file), $.html());
  }
  for (const path of assets) {
    if (!/^(?:assets|images|videos)\//.test(path)) continue;
    const source = path.startsWith('assets/')
      ? within(resolve(root, 'public'), path)
      : await mediaPath(path, { root });
    await access(source);
    const target = within(output, path);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target);
  }
  try {
    await cp(resolve(root, 'public/assets/licenses'), resolve(output, 'assets/licenses'), {
      recursive: true,
    });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(resolve(output, '.nojekyll'), '');
  console.log(
    `Site preparado em dist/: ${files.length} páginas; CSS agrupado por página e somente mídias utilizadas.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await prepareSite();
