import {readFile,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPage} from './cms-render.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const json=async file=>JSON.parse(await readFile(resolve(root,file),'utf8'));
const [{pages},{services},site,defaults,icons]=await Promise.all([json('data/pages.json'),json('data/services.json'),json('data/site.json'),json('data/site-defaults.json'),json('templates/service-icons.json')]);
for(const page of pages){
  if(!/^[a-z0-9-]+$/.test(page.pageId)||!['index.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html','portfolio.html'].includes(page.file))throw Error('Página inválida.');
  const template=await readFile(resolve(root,`templates/pages/${page.pageId}.html`),'utf8');
  const html=renderPage(template,page,site,{services,icons,defaults,pages});
  // Fail before writing when a local image/video is missing.
  for(const match of html.matchAll(/(?:src|poster|data-src)="((?:images|videos)\/[^"?#]+)"/g))await access(resolve(root,match[1]));
  await writeFile(resolve(root,page.file),html);
}
console.log(`Renderizadas ${pages.length} páginas e os serviços do CMS.`);
