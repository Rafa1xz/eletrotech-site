import {readFile, writeFile, appendFile} from 'node:fs/promises';
import {canonicalJson, mergeRoutes} from './publication-state.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const base = new URL(process.env.PUBLISHED_SITE_URL || 'https://rafa1xz.github.io/eletrotech-site/');
if (base.protocol !== 'https:') throw Error('URL de publicação deve usar HTTPS.');
async function published(path) {
  const url = new URL(path, base);
  url.searchParams.set('publication_check', Date.now().toString());
  const response = await fetch(url, {signal: AbortSignal.timeout(30000), cache: 'no-store'});
  if (response.status === 404) return null;
  if (!response.ok) throw Error(`Não foi possível conferir a publicação: HTTP ${response.status}`);
  return response.json();
}

const [products, site, routes, oldProducts, oldSite, oldRoutes] = await Promise.all([
  read('data/products.json'), read('data/site.json'), read('data/product-routes.json'),
  published('data/products.json'), published('data/site.json'), published('data/product-routes.json'),
]);
// A clean Actions checkout must retain URLs created by previous CMS deployments.
const merged = mergeRoutes(routes, oldRoutes);
await writeFile('data/product-routes.json', JSON.stringify(merged, null, 2) + '\n');
const optional = async path => {try{return await read(path);}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const [pages,services,oldPages,oldServices]=await Promise.all([optional('data/pages.json'),optional('data/services.json'),published('data/pages.json'),published('data/services.json')]);
const contentChanged=canonicalJson(pages)!==canonicalJson(oldPages)||canonicalJson(services)!==canonicalJson(oldServices);
const changed = contentChanged || process.env.FORCE_PUBLISH === 'true' || canonicalJson(products) !== canonicalJson(oldProducts) || canonicalJson(site) !== canonicalJson(oldSite);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
console.log(changed ? 'Há conteúdo para publicar.' : 'Conteúdo sem alterações. Publicação dispensada.');
