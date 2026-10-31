import {readFile,writeFile} from 'node:fs/promises';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [{pages},{services},settings]=await Promise.all([read('data/pages.json'),read('data/services.json'),read('data/site.json')]);
const types={texts:'pageText',images:'pageImage',videos:'pageVideo',links:'pageLink',sections:'pageSection'};
const documents=pages.map(source=>{
  const page=structuredClone(source);for(const [key,type]of Object.entries(types))page[key]=(page[key]||[]).map(item=>({...item,_type:type}));return page;
});
documents.push(...services);
await writeFile('data/cms-import.ndjson',documents.map(doc=>JSON.stringify(doc)).join('\n')+'\n');
console.log(`Preparadas ${pages.length} páginas e ${services.length} serviços. Importação remota usa createIfNotExists.`);
