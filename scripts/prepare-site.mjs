// Explicit allowlist: development files and private future backend files are not published.
import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=process.cwd();
const output=resolve(root,'_site');
await mkdir(output,{recursive:true});
for(const directory of ['assets','css','js','images','videos','data','produtos']){
  await cp(resolve(root,directory),resolve(output,directory),{recursive:true});
}
for(const file of await readdir(root))if(file.endsWith('.html')||file==='sitemap.xml')await cp(resolve(root,file),resolve(output,file));
await mkdir(resolve(output,'admin'),{recursive:true});
for(const file of ['index.html','admin.js','admin.css'])await cp(resolve(root,'admin',file),resolve(output,'admin',file));
await writeFile(resolve(output,'.nojekyll'),'');
console.log('Arquivos públicos preparados em _site/');
