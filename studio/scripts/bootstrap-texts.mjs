// Idempotent migration: preserve both published edits and drafts, fail on concurrent changes.
import {getCliClient} from 'sanity/cli';
import {readFile} from 'node:fs/promises';
const client=getCliClient({apiVersion:'2026-10-28'}).withConfig({useCdn:false});
const read=async name=>JSON.parse(await readFile(new URL('../../data/'+name,import.meta.url),'utf8'));
const [{documents},{pages}]=await Promise.all([read('text-defaults.json'),read('page-text-manifest.json')]);
let updated=0;
const existingGroups=await client.fetch('*[_type == "siteTexts" && !(_id in path("drafts.**"))]',{},{perspective:'raw'});
const existingEntries=new Map(existingGroups.flatMap(doc=>doc.entries||[]).map(entry=>[entry.key,entry]));
for(const base of documents){
  await client.createIfNotExists({...base,entries:base.entries.map(entry=>({...entry,...existingEntries.get(entry.key)}))});
  const versions=await client.fetch('*[_id in $ids]',{ids:[base._id,'drafts.'+base._id]},{perspective:'raw'});
  for(const doc of versions){
    const entries=base.entries.map(entry=>({...entry,...existingEntries.get(entry.key),...(doc.entries||[]).find(e=>e.key===entry.key),label:entry.label,sourcePt:entry.sourcePt,sourceEs:entry.sourceEs,context:entry.context}));
    if(JSON.stringify(doc.entries)!==JSON.stringify(entries)){
      await client.patch(doc._id).ifRevisionId(doc._rev).set({entries}).commit();updated++;
    }
  }
}
for(const base of pages){
  const versions=await client.fetch('*[_id in $ids]',{ids:[base._id,'drafts.'+base._id]},{perspective:'raw'});
  for(const doc of versions){
    const texts=base.texts.map(entry=>({...entry,_type:'pageText',...(doc.texts||[]).find(e=>e.key===entry.key),label:entry.label,section:entry.section}));
    if(JSON.stringify(doc.texts)!==JSON.stringify(texts)){
      await client.patch(doc._id).ifRevisionId(doc._rev).set({texts}).commit();updated++;
    }
  }
}
console.log(`Textos inicializados. ${updated} documentos atualizados; conteúdo e rascunhos existentes preservados.`);
