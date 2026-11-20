// Run with Sanity CLI authentication. Default is a read-only migration preview.
import {getCliClient} from 'sanity/cli';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const client=getCliClient({apiVersion:'2026-10-28'}).withConfig({useCdn:false});
const target=client.config().projectId;
if(target!=='zr5fcto8')throw Error('Esta migração foi preparada exclusivamente para zr5fcto8.');
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=async name=>readFile(resolve(root,name),'utf8');
const ndjson=source=>source.trim().split('\n').filter(Boolean).map(JSON.parse);
const documents=[...ndjson(await read('data/sanity-import.ndjson')),...ndjson(await read('data/cms-import.ndjson')),...JSON.parse(await read('data/texts.json')).documents];
const ids=documents.map(doc=>doc._id);
if(new Set(ids).size!==ids.length)throw Error('Identificadores duplicados na origem.');
const existing=await client.fetch('*[_type in ["product","siteSettings","sitePage","service","siteTexts"]]',{},{perspective:'raw'});
const checkpoint=resolve(root,'qa/temp',`migration-${target}-${new Date().toISOString().replace(/[:.]/g,'-')}`);
await mkdir(checkpoint,{recursive:true});
await writeFile(resolve(checkpoint,'target-before.json'),JSON.stringify(existing,null,2));
await writeFile(resolve(checkpoint,'source.json'),JSON.stringify(documents,null,2));
const counts=Object.fromEntries([...new Set(documents.map(doc=>doc._type))].map(type=>[type,documents.filter(doc=>doc._type===type).length]));
console.log(JSON.stringify({target,counts,create:ids.filter(id=>!existing.some(doc=>doc._id===id)).length,preserve:ids.filter(id=>existing.some(doc=>doc._id===id)).length,checkpoint}));
if(process.env.SANITY_MIGRATION_APPLY!=='true'){
  console.log('Prévia concluída; nenhum documento ou arquivo enviado.');
}else{
  const uploads=new Map();
  async function asset(path,kind='image'){
    const pattern=kind==='file'?/^videos\/[a-zA-Z0-9_.-]+\.(mp4|webm)$/:/^images\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|svg)$/;
    if(!pattern.test(path||''))throw Error('Mídia local inválida na migração: '+path);
    if(!uploads.has(path)){
      const uploaded=await client.assets.upload(kind,await readFile(resolve(root,path)),{filename:basename(path)});
      uploads.set(path,{_type:kind,asset:{_type:'reference',_ref:uploaded._id}});
    }
    return structuredClone(uploads.get(path));
  }
  async function hydrate(doc){
    if(doc._type==='product'||doc._type==='service'){
      if(!doc.image?.asset&&doc.src)doc.image=await asset(doc.src);
      // Existing gallery paths remain editable. Uploading copies into galleryImages
      // as well would show the same photos twice in the storefront.
    }
    if(doc._type==='siteSettings'&&!doc.logo?.asset&&doc.logoSrc)doc.logo=await asset(doc.logoSrc);
    if(doc._type==='sitePage'){
      for(const image of doc.images||[])if(!image.image?.asset&&image.src)image.image=await asset(image.src);
      for(const video of doc.videos||[]){
        if(!video.file?.asset&&video.src)video.file=await asset(video.src,'file');
        if(!video.posterImage?.asset&&video.poster)video.posterImage=await asset(video.poster);
      }
    }
    return doc;
  }
  for(const source of documents){
    const current=existing.find(doc=>doc._id===source._id);
    const doc=await hydrate(structuredClone({...source,...current}));
    for(const key of ['_rev','_createdAt','_updatedAt'])delete doc[key];
    if(current){
      const missing=Object.fromEntries(Object.entries(doc).filter(([key])=>!key.startsWith('_')&&!Object.hasOwn(current,key)));
      if(Object.keys(missing).length)await client.patch(current._id).ifRevisionId(current._rev).setIfMissing(missing).commit();
    }else await client.createIfNotExists(doc);
  }
  // Existing published fields and all drafts must remain byte-for-byte equivalent.
  const after=await client.fetch('*[_type in ["product","siteSettings","sitePage","service","siteTexts"]]',{},{perspective:'raw'});
  for(const before of existing){
    const doc=after.find(item=>item._id===before._id);
    for(const [key,value] of Object.entries(before)){
      if(['_rev','_updatedAt'].includes(key))continue;
      if(JSON.stringify(doc?.[key])!==JSON.stringify(value))throw Error('Campo existente alterado durante migração: '+before._id+'/'+key);
    }
  }
  if(ids.some(id=>!after.some(doc=>doc._id===id)))throw Error('Documentos ausentes após a migração.');
  await writeFile(resolve(checkpoint,'target-after.json'),JSON.stringify(after,null,2));
  console.log(`Migração validada: ${ids.length} documentos disponíveis, ${uploads.size} arquivos enviados; conteúdo anterior e rascunhos preservados.`);
}
