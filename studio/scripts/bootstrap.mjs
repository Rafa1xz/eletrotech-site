// Run with: sanity exec scripts/bootstrap.mjs --with-user-token
import {getCliClient} from 'sanity/cli';
import {readFile} from 'node:fs/promises';
const client=getCliClient({apiVersion:'2026-10-28'});
const documents=(await readFile(new URL('../../data/cms-import.ndjson',import.meta.url),'utf8')).trim().split('\n').map(JSON.parse);
const settings=JSON.parse(await readFile(new URL('../../data/site-defaults.json',import.meta.url),'utf8'));
let transaction=client.transaction();
for(const document of documents)transaction=transaction.createIfNotExists(document);
transaction=transaction.createIfNotExists({...settings,_id:'site-settings',_type:'siteSettings'}).patch('site-settings',patch=>patch.setIfMissing(settings));
await transaction.commit();
console.log(`Conteúdo inicializado sem substituir documentos existentes: ${documents.length} páginas/serviços.`);
