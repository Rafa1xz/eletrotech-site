import {contentQuery,cmsMediaFile,mapPage,mapService} from './cms-content.mjs';
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
  const query = `{"products": ${productQuery}, "site": *[_type == "siteSettings" && _id == "site-settings"][0]{name,url,whatsapp,email,phone,phoneLabel,instagram,instagramLabel,logoSrc,"logoUrl":logo.asset->url,footerPt,footerEs,businessHours,businessHoursEs,footerStart,footerEnd}, ${contentQuery}}`;
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
  const defaults = JSON.parse(await readFile(resolve(root,'data/cms-defaults.json'),'utf8'));
  const siteDefaults = JSON.parse(await readFile(resolve(root,'data/site-defaults.json'),'utf8'));
  const downloadMedia = async (url,kind='image') => {
    const local=cmsMediaFile(url,projectId,dataset,kind),target=resolve(root,local);
    try {await access(target);return local;}catch(error){if(error.code!=='ENOENT')throw error;}
    const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(60000)});
    if(!response.ok)throw Error('Falha ao baixar m?dia do CMS: HTTP '+response.status);
    const limit=(kind==='video'?80:20)*1024*1024;
    if(Number(response.headers.get('content-length'))>limit)throw Error('M?dia excede limite de publica??o.');
    const reader=response.body.getReader(),chunks=[];let size=0;
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('M?dia excede limite de publica??o.');}chunks.push(value);}
    await writeFile(target,Buffer.concat(chunks));return local;
  };
  const pages=[];
  for(const base of defaults.pages){
    const remote=(result.pages||[]).find(item=>item._id===base._id);
    const page=remote?await mapPage({...base,...remote,pageId:base.pageId,file:base.file},downloadMedia):base;
    pages.push(page);
  }
  const remoteServices=result.services||[];
  const services=remoteServices.length?await Promise.all(remoteServices.map(doc=>mapService(doc,downloadMedia))):defaults.services;
  const settings={...siteDefaults,...Object.fromEntries(Object.entries(result.site).filter(([,v])=>v!=null))};
  if(settings.logoUrl)settings.logoSrc=await downloadMedia(settings.logoUrl);delete settings.logoUrl;
  const products = [];
  for (const document of result.products) products.push(await mapProduct(document, download));
  // The existing generator validates IDs, reserved routes, images, SKU and prices before deployment.
  await writeFile(resolve(root, 'data/products.json'), JSON.stringify({schemaVersion: 1, products}, null, 2) + '\n');
  await writeFile(resolve(root, 'data/site.json'), JSON.stringify(settings, null, 2) + '\n');
  await writeFile(resolve(root,'data/pages.json'),JSON.stringify({pages},null,2)+'\n');
  await writeFile(resolve(root,'data/services.json'),JSON.stringify({services},null,2)+'\n');
  console.log(`Sincronizados ${products.length} produtos publicados do Sanity.`);
}
