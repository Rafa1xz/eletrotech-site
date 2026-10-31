// Snapshot the approved layout once. No remote writes and no product changes.
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {pageDefinitions,extractPage,extractServices} from './cms-model.mjs';
import {load} from 'cheerio';
await mkdir('templates/pages',{recursive:true});
try {await access('data/pages.json');console.log('Conteúdo CMS já inicializado; nenhum arquivo substituído.');process.exit(0);} catch {}
const pages=[];
for(const definition of pageDefinitions){
  const {page,html}=extractPage(await readFile(definition[2],'utf8'),definition);
  pages.push(page);await writeFile(`templates/pages/${definition[0]}.html`,html);
}
const {services,icons}=extractServices(await readFile('produtos.html','utf8'));
const site=JSON.parse(await readFile('data/site.json','utf8'));
const $=load(await readFile('index.html','utf8'));
const defaults={...site,phone:`+${site.whatsapp}`,phoneLabel:'+55 45 9924-1306',instagram:'https://instagram.com/eletrotechmarechal',instagramLabel:'@eletrotechmarechal',logoSrc:$('.brand img').attr('src'),footerPt:$('.footer-grid>div:first-child>p [data-pt]').attr('data-pt'),footerEs:$('.footer-grid>div:first-child>p [data-es]').attr('data-es'),businessHours:'',footerStart:'#e4f1ff',footerEnd:'#f4f9ff'};
await writeFile('data/pages.json',JSON.stringify({pages},null,2)+'\n');
await writeFile('data/services.json',JSON.stringify({services},null,2)+'\n');
await writeFile('data/site-defaults.json',JSON.stringify(defaults,null,2)+'\n');
await writeFile('data/site.json',JSON.stringify(defaults,null,2)+'\n');
await writeFile('templates/service-icons.json',JSON.stringify(icons,null,2)+'\n');
console.log(`Conteúdo inicializado: ${pages.length} páginas e ${services.length} serviços. Produtos preservados.`);
