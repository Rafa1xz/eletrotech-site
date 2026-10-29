// Explicit allowlist: development files and private future backend files are not published.
import { cp, mkdir, readdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=process.cwd();
const output=resolve(root,'_site');
if(output!==resolve(root,'_site'))throw Error('Destino de publicação inválido.');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const directory of ['assets','css','js','images','videos','produtos']){
  await cp(resolve(root,directory),resolve(output,directory),{recursive:true});
}
await mkdir(resolve(output,'data'),{recursive:true});
for(const file of ['products.json','site.json','product-routes.json'])await cp(resolve(root,'data',file),resolve(output,'data',file));
for(const file of await readdir(root))if(file.endsWith('.html')||file==='sitemap.xml')await cp(resolve(root,file),resolve(output,file));
await writeFile(resolve(output,'.nojekyll'),'');
console.log('Arquivos públicos preparados em _site/');
