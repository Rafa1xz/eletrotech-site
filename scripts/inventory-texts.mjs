// Development migration: stable page keys are preserved, published edits are retained.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse} from 'acorn';
import {load} from 'cheerio';
import {pageDefinitions} from './cms-model.mjs';
import {removeDecorativeArrows} from './decorative-arrows.mjs';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const {pages}=await read('data/pages.json');
const titles={navigation:'Cabeçalho e navegação',footer:'Rodapé e redes sociais',actions:'Botões e chamadas',catalog:'Busca e catálogo',forms:'Formulários e WhatsApp',gallery:'Galeria de imagens',products:'Páginas de produtos',accessibility:'Acessibilidade e idiomas'};
const groups=new Map(Object.entries(titles).map(([key,title])=>[key,{_id:`texts-${key}`,_type:'siteTexts',group:key,title,entries:[]}]));
const seen=new Set();
function register(pt,es=pt,group='actions',context=''){
  if(typeof pt!=='string'||typeof es!=='string'||!pt.trim())return;
  pt=removeDecorativeArrows(pt);es=removeDecorativeArrows(es);
  if(!pt||/^\d[\d\s/]*$/.test(pt))return;
  const key='copy-'+createHash('sha256').update(pt+'\0'+es).digest('hex').slice(0,14);
  if(!seen.has(key)){seen.add(key);groups.get(group).entries.push({_type:'siteTextEntry',_key:key,key,label:pt.replace(/\s+/g,' ').slice(0,100),context,sourcePt:pt,sourceEs:es,pt,es});}
  return key;
}
function staticString(node){
  if(node?.type==='Literal'&&typeof node.value==='string')return node.value;
  if(node?.type==='TemplateLiteral'&&!node.expressions.length)return node.quasis[0].value.cooked;
}
function alternatives(node){return node?.type==='ConditionalExpression'?[...alternatives(node.consequent),...alternatives(node.alternate)]:[staticString(node)].filter(v=>v!=null);}
function walk(node,file,parentFunction=''){
  if(!node||typeof node!=='object')return;
  const name=node.type==='FunctionDeclaration'&&node.id?.name.startsWith('init')?node.id.name:parentFunction;
  if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&['tr','text','label','phrase'].includes(node.callee.name)){
    const [pt,es]=node.arguments.map(staticString);
    let group=file.includes('gallery')?'gallery':file.includes('build-products')?'products':file.includes('cms-render')?'actions':file.includes('i18n')?'accessibility':name==='initCatalog'?'catalog':name==='initNavigation'?'navigation':name==='initQuoteForm'||name==='initContactLinks'?'forms':'actions';
    if(pt!=null)register(pt,es??pt,group,file);
    else for(const a of alternatives(node.arguments[0]))for(const b of alternatives(node.arguments[1]))register(a,b,group,file);
  }
  if(node.type==='VariableDeclarator'&&['categories','topics'].includes(node.id?.name)&&node.init?.type==='ObjectExpression'){
    for(const prop of node.init.properties){
      if(node.id.name==='categories'&&prop.value.type==='ArrayExpression'){const values=prop.value.elements.map(staticString);register(values[0],values[1],'catalog','Categorias do catálogo');}
      if(node.id.name==='topics')register(prop.key.name||prop.key.value,staticString(prop.value),'forms','Assuntos das mensagens do WhatsApp');
    }
  }
  for(const value of Object.values(node)){if(Array.isArray(value))for(const child of value)walk(child,file,name);else if(value&&typeof value==='object')walk(value,file,name);}
}
for(const pair of [['Solicitar orçamento','Solicitar presupuesto'],['Ver detalhes','Ver detalles'],['Voltar ao catálogo','Volver al catálogo'],['Ver catálogo completo','Ver catálogo completo'],['Entre em contato','Entre en contacto']])register(...pair,'actions','Botões compartilhados em serviços, produtos e contato');
for(const file of ['js/script.js','js/gallery.js','js/i18n.js','scripts/build-products.mjs','scripts/cms-render.mjs'])walk(parse(await readFile(file,'utf8'),{ecmaVersion:'latest',sourceType:'module'}),file);
for(const [id,title]of pageDefinitions){
  const path=`templates/pages/${id}.html`,$=load(await readFile(path,'utf8'),{scriptingEnabled:false});
  const page=pages.find(p=>p.pageId===id);let next=Math.max(999,...page.texts.map(t=>Number(t.key.replace('extra-',''))||0))+1;
  const add=(node,pt,es,attribute)=>{
    let key=node.attr('data-cms-text');
    if(!key){key=`extra-${next++}`;node.attr('data-cms-text',key);}
    if(!page.texts.some(t=>t.key===key))page.texts.push({_key:key,key,label:pt.replace(/\s+/g,' ').slice(0,100),pt,es,attribute:attribute||''});
    return key;
  };
  // Existing translations remain owned by the page; shared header/footer belong to global groups.
  $('[data-pt]').each((_,el)=>{
    const node=$(el);if(node.closest('svg,script,style,.product-grid,.service-grid').length)return;
    const pt=node.attr('data-pt')||'',es=node.attr('data-es')||pt,attr=node.attr('data-translate-attr')||'';
    if(node.closest('main,head').length){
      if(attr==='alt'&&node.attr('data-cms-image'))return;
      if(pt.trim())add(node,pt,es,attr);
    }else{
      const group=node.closest('.site-footer').length?'footer':node.closest('.site-header,.topbar').length?'navigation':'actions';
      const key=register(pt,es,group,title);if(key)node.attr('data-copy-key',key);
    }
  });
  // Bind unannotated visible text nodes; don't overwrite controls, counts or managed collections.
  $('body *').each((_,el)=>{
    const node=$(el);
    if(node.closest('script,style,svg,[data-pt],.product-grid,.service-grid,[data-year],#catalog-status,#message-count,[id$="-error"],#form-status,.filter-count').length)return;
    node.contents().filter((_,child)=>child.type==='text'&&/[\p{L}]/u.test(child.data)).each((_,child)=>{
      const original=child.data,pt=original.trim();if(!pt)return;
      const span=$('<span>').attr({'data-pt':pt,'data-es':pt}).text(pt);
      if(node.closest('main').length)add(span,pt,pt,'');
      else {const group=node.closest('.site-footer').length?'footer':node.closest('.site-header,.topbar').length?'navigation':'actions';const key=register(pt,pt,group,title);if(key)span.attr('data-copy-key',key);}
      $(child).replaceWith(span);
    });
  });
  // Accessible labels and form placeholders also need editable bindings.
  $('[aria-label],[title],[placeholder]').each((_,el)=>{
    const node=$(el);if(node.closest('svg,script,style,.product-grid,.service-grid').length)return;
    for(const attr of ['aria-label','title','placeholder']){
      const value=node.attr(attr);if(!value||node.attr('data-translate-attr')===attr)continue;
      const key=register(value,value,'accessibility',`${title}: ${attr}`);
      if(key)node.attr('data-copy-'+attr,key);
    }
  });
  // Remove obsolete fields from the panel for blocks explicitly removed by the owner.
  const used=new Set($('[data-cms-text]').map((_,el)=>$(el).attr('data-cms-text')).get());
  page.texts=page.texts.filter(t=>used.has(t.key));
  const contexts=new Map();
  $('[data-cms-text]').each((_,el)=>{const n=$(el),section=n.closest('[data-cms-section]'),sectionName=section.find('h1,h2').first().text().replace(/\s+/g,' ').trim();contexts.set(n.attr('data-cms-text'),sectionName|| (n.closest('head').length?'SEO e compartilhamento':'Conteúdo da página'));});
  for(const item of page.texts){item.section=contexts.get(item.key)||'Conteúdo';item.label=item.label||item.pt;}
  if(!$('script[src="js/site-texts.js"]').length)$('script[src="js/site-config.js"]').before('<script src="js/site-texts.js" defer></script><script src="js/copy-runtime.js" defer></script>');
  await writeFile(path,$.html().replace(/[\t ]+$/gm,''));
}
const documents=[...groups.values()].filter(doc=>doc.entries.length);
await writeFile('data/text-defaults.json',JSON.stringify({documents},null,2)+'\n');
try{await readFile('data/texts.json');}catch(e){if(e.code!=='ENOENT')throw e;await writeFile('data/texts.json',JSON.stringify({documents},null,2)+'\n');}
await writeFile('data/pages.json',JSON.stringify({pages},null,2)+'\n');
await writeFile('data/page-text-manifest.json',JSON.stringify({pages:pages.map(({_id,texts})=>({_id,texts}))},null,2)+'\n');
console.log(`Inventariados ${documents.length} grupos, ${documents.reduce((n,d)=>n+d.entries.length,0)} textos globais e ${pages.reduce((n,p)=>n+p.texts.length,0)} textos de páginas.`);
