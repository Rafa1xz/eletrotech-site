// Explicit allowlist: development files and private future backend files are not published.
import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
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
for(const file of ['pages.json','services.json']){try{await cp(resolve(root,'data',file),resolve(output,'data',file));}catch(error){if(error.code!=='ENOENT')throw error;}}
for(const file of await readdir(root))if(file.endsWith('.html')||file==='sitemap.xml')await cp(resolve(root,file),resolve(output,file));
// GitHub Pages caches these URLs for ten minutes. A content revision makes new
// HTML request the matching CSS/JS instead of mixing releases in the browser.
const revisions=new Map();
for(const folder of ['css','js']){
  for(const file of await readdir(resolve(output,folder))){
    if(!/\.(?:css|js)$/.test(file))continue;
    const path=`${folder}/${file}`;
    revisions.set(path,createHash('sha256').update(await readFile(resolve(output,path))).digest('hex').slice(0,12));
  }
}
for(const folder of ['','produtos']){
  for(const file of await readdir(resolve(output,folder))){
    if(!file.endsWith('.html'))continue;
    const path=resolve(output,folder,file);
    const html=await readFile(path,'utf8');
    const versioned=html.replace(/((?:href|src)=")((?:\.\.\/)?(?:css|js)\/[^"?#]+\.(?:css|js))(?:\?v=[^"\s]*)?(")/g,(match,before,asset,after)=>{
      const revision=revisions.get(asset.replace(/^\.\.\//,''));
      if(!revision)throw Error('Arquivo de interface ausente: '+asset);
      return `${before}${asset}?v=${revision}${after}`;
    });
    await writeFile(path,versioned,'utf8');
  }
}
await writeFile(resolve(output,'.nojekyll'),'');
console.log('Arquivos públicos preparados em _site/');
