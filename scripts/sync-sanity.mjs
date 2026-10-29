import {readFile, writeFile, access} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnvFile} from 'node:process';
import {assetFile, mapProduct, productQuery, validateConfig} from './sanity-content.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try { loadEnvFile(resolve(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
if (!projectId) {
  console.log('Sanity ainda não conectado: usando o catálogo local preservado.');
} else {
  validateConfig(projectId, dataset);
  const headers = process.env.SANITY_API_READ_TOKEN ? {Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}`} : {};
  const query = `{"products": ${productQuery}, "site": *[_type == "siteSettings" && _id == "site-settings"][0]{name,url,whatsapp,email}}`;
  const url = new URL(`https://${projectId}.api.sanity.io/v2026-10-28/data/query/${dataset}`);
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'published');
  const response = await fetch(url, {headers, signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw Error(`Não foi possível ler o Sanity (HTTP ${response.status}). A publicação foi interrompida.`);
  const {result} = await response.json();
  if (!Array.isArray(result?.products) || !result.site) throw Error('Importe e publique os produtos e as configurações no Sanity antes de sincronizar.');
  const current = JSON.parse(await readFile(resolve(root, 'data/products.json'), 'utf8'));
  if (!result.products.length && current.products.length && process.env.SANITY_ALLOW_EMPTY !== 'true') {
    throw Error('O Sanity retornou um catálogo vazio. Para esvaziar intencionalmente, use SANITY_ALLOW_EMPTY=true.');
  }
  const download = async url => {
    const local = assetFile(url, projectId, dataset);
    const target = resolve(root, local);
    try { await access(target); return local; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const image = await fetch(url, {redirect: 'error', signal: AbortSignal.timeout(30000)});
    if (!image.ok) throw Error(`Falha ao baixar imagem do Sanity (HTTP ${image.status}).`);
    const bytes = new Uint8Array(await image.arrayBuffer());
    if (bytes.length > 20 * 1024 * 1024) throw Error('Imagem do Sanity excede 20 MB.');
    await writeFile(target, bytes);
    return local;
  };
  const products = [];
  for (const document of result.products) products.push(await mapProduct(document, download));
  // The existing generator validates IDs, reserved routes, images, SKU and prices before deployment.
  await writeFile(resolve(root, 'data/products.json'), JSON.stringify({schemaVersion: 1, products}, null, 2) + '\n');
  await writeFile(resolve(root, 'data/site.json'), JSON.stringify(result.site, null, 2) + '\n');
  console.log(`Sincronizados ${products.length} produtos publicados do Sanity.`);
}
