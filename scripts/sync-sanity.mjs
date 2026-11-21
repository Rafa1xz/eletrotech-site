import { ROOT } from './paths.mjs';
import { createMediaDownloader } from './media.mjs';
import { contentQuery, mapPage, mapService, mergePage } from './cms-content.mjs';
import { mergeTextDocuments } from './text-catalog.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { mapProduct, productQuery, validateConfig } from './sanity-content.mjs';

const root = ROOT;
try {
  loadEnvFile(resolve(root, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
if (!projectId) {
  console.log('Sanity ainda não conectado: usando o catálogo local preservado.');
} else {
  validateConfig(projectId, dataset);
  const headers = process.env.SANITY_API_READ_TOKEN
    ? { Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}` }
    : {};
  const query = `{"products": ${productQuery}, "site": *[_type == "siteSettings" && _id == "site-settings"][0]{name,url,whatsapp,email,phone,phoneLabel,instagram,instagramLabel,logoSrc,"logoUrl":logo.asset->url,footerPt,footerEs,businessHours,businessHoursEs,footerStart,footerEnd}, ${contentQuery}}`;
  const url = new URL(`https://${projectId}.api.sanity.io/v2026-10-28/data/query/${dataset}`);
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'published');
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok)
    throw Error(
      `Não foi possível ler o Sanity (HTTP ${response.status}). A publicação foi interrompida.`,
    );
  const { result } = await response.json();
  if (!Array.isArray(result?.products) || !result.site)
    throw Error(
      'Importe e publique os produtos e as configurações no Sanity antes de sincronizar.',
    );
  const current = JSON.parse(await readFile(resolve(root, 'data/products.json'), 'utf8'));
  if (
    !result.products.length &&
    current.products.length &&
    process.env.SANITY_ALLOW_EMPTY !== 'true'
  ) {
    throw Error(
      'O Sanity retornou um catálogo vazio. Para esvaziar intencionalmente, use SANITY_ALLOW_EMPTY=true.',
    );
  }
  const downloadMedia = await createMediaDownloader(projectId, dataset);
  const defaults = JSON.parse(await readFile(resolve(root, 'data/cms-defaults.json'), 'utf8'));
  const textDefaults = JSON.parse(await readFile(resolve(root, 'data/text-defaults.json'), 'utf8'));
  const textDocuments = mergeTextDocuments(textDefaults.documents, result.texts || []);
  const manifest = JSON.parse(
    await readFile(resolve(root, 'data/page-text-manifest.json'), 'utf8'),
  );
  const siteDefaults = JSON.parse(await readFile(resolve(root, 'data/site-defaults.json'), 'utf8'));
  const pages = [];
  for (const base of defaults.pages) {
    const remote = (result.pages || []).find((item) => item._id === base._id);
    const page = await mapPage(mergePage(base, remote), downloadMedia);
    const fields = manifest.pages.find((item) => item._id === base._id)?.texts || page.texts;
    page.texts = fields.map((field) => ({
      ...field,
      ...(page.texts || []).find((item) => item.key === field.key),
      label: field.label,
      section: field.section,
    }));
    pages.push(page);
  }
  const remoteServices = result.services || [];
  const services = await Promise.all(remoteServices.map((doc) => mapService(doc, downloadMedia)));
  const settings = {
    ...siteDefaults,
    ...Object.fromEntries(Object.entries(result.site).filter(([, v]) => v != null)),
  };
  if (settings.logoUrl) settings.logoSrc = await downloadMedia(settings.logoUrl);
  delete settings.logoUrl;
  const products = [];
  for (const document of result.products) products.push(await mapProduct(document, downloadMedia));
  // The existing generator validates IDs, reserved routes, images, SKU and prices before deployment.
  await writeFile(
    resolve(root, 'data/products.json'),
    JSON.stringify({ schemaVersion: 1, products }, null, 2) + '\n',
  );
  await writeFile(resolve(root, 'data/site.json'), JSON.stringify(settings, null, 2) + '\n');
  await writeFile(resolve(root, 'data/pages.json'), JSON.stringify({ pages }, null, 2) + '\n');
  await writeFile(
    resolve(root, 'data/services.json'),
    JSON.stringify({ services }, null, 2) + '\n',
  );
  await writeFile(
    resolve(root, 'data/texts.json'),
    JSON.stringify({ documents: textDocuments }, null, 2) + '\n',
  );
  console.log(`Sincronizados ${products.length} produtos publicados do Sanity.`);
}
