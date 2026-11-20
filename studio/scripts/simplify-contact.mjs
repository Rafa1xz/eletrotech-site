import {getCliClient} from 'sanity/cli';
import {mkdir,writeFile} from 'node:fs/promises';
const client=getCliClient({apiVersion:'2026-10-28'}).withConfig({useCdn:false});
if(client.config().projectId!=='zr5fcto8')throw Error('Confirme o projeto ativo antes de migrar o contato.');
const documents=await client.fetch('*[_type in ["sitePage","siteTexts"]]',{},{perspective:'raw'});
await mkdir('.sanity',{recursive:true});
await writeFile(`.sanity/contact-before-${Date.now()}.json`,JSON.stringify(documents,null,2));
let updated=0;
for(const doc of documents){
  const id=doc._id.replace(/^drafts\./,''),patch={};
  if(id==='page-contact'){
    const sections=(doc.sections||[]).map(section=>section.key==='section-002'&&section.title==='O que você precisa?'?{...section,title:'Contato direto'}:section);
    if(JSON.stringify(sections)!==JSON.stringify(doc.sections))patch.sections=sections;
  }
  if(id==='page-process'){
    const links=(doc.links||[]).map(link=>link.key==='link-003'&&link.href==='contato.html#quote-form'?{...link,href:'contato.html#contato-direto',label:'Falar com a equipe'}:link);
    if(JSON.stringify(links)!==JSON.stringify(doc.links))patch.links=links;
  }
  if(Object.keys(patch).length){await client.patch(doc._id).ifRevisionId(doc._rev).set(patch).commit();updated++;}
}
console.log(`Contato direto: ${updated} documentos atualizados. Backup salvo em studio/.sanity/.`);
