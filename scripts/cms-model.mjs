import {load} from 'cheerio';

export const pageDefinitions = [
  ['home','Início','index.html'],['catalog','Serviços e produtos','produtos.html'],
  ['process','Como trabalhamos','como-trabalhamos.html'],['oxilife','OxiLife Fish','oxilife-fish.html'],
  ['contact','Contato','contato.html'],['portfolio','Projetos e equipamentos','portfolio.html'],
];
export const clean = value => String(value || '').replace(/\s+/g,' ').trim();
const label = (value, fallback) => clean(value).slice(0,90) || fallback;
export const keyFor = (prefix, index) => `${prefix}-${String(index+1).padStart(3,'0')}`;

// Keys are stored in the versioned templates, never recalculated during publication.
export function extractPage(source, [id,title,file]) {
  const $ = load(source);
  const page = {_id:`page-${id}`,_type:'sitePage',pageId:id,title,file,menuTitle:title,showInMenu:id!=='portfolio',sections:[],texts:[],images:[],videos:[],links:[]};
  $('main').children('section,aside').each((i,el)=>{
    const node=$(el),key=keyFor('section',i);
    node.attr('data-cms-section',key);
    page.sections.push({_key:key,key,title:label(node.find('h1,h2').first().text(),`Seção ${i+1}`),enabled:true});
  });
  // Product grids are managed by product documents; services by service documents.
  const managed = el => !$(el).closest('.product-grid,.service-grid,script,style,svg').length;
  $('main h1,main h2,main h3,main p,main figcaption,main summary,main option').each((_,el)=>{
    const n=$(el);
    if(managed(el)&&!n.attr('data-pt')&&!n.children().length&&clean(n.text())&&!n.is('[role=status],[id$="-error"],#message-count')&&!n.hasClass('form-required-note')) n.attr('data-pt',n.text()).attr('data-es',n.text());
  });
  $('head title,head meta[name=description],head meta[property="og:title"],head meta[property="og:description"]').each((_,el)=>{
    const n=$(el),isMeta=n.is('meta');
    if(!n.attr('data-pt')) n.attr('data-pt',isMeta?n.attr('content'):n.text()).attr('data-es',isMeta?n.attr('content'):n.text());
    if(isMeta)n.attr('data-translate-attr','content');
  });
  $('main [data-pt],head [data-pt]').each((_,el)=>{
    if(!managed(el)) return;
    const n=$(el),attribute=n.attr('data-translate-attr')||'';
    if(attribute==='alt'||attribute.startsWith('aria-')||n.attr('id')==='message-count') return;
    const key=keyFor('text',page.texts.length);
    n.attr('data-cms-text',key);
    page.texts.push({_key:key,key,label:label(n.attr('data-pt'),'Texto'),pt:n.attr('data-pt')||'',es:n.attr('data-es')||'',attribute});
  });
  $('main img').each((_,el)=>{
    if(!managed(el))return;
    const n=$(el),key=keyFor('image',page.images.length);
    n.attr('data-cms-image',key);
    page.images.push({_key:key,key,label:label(n.attr('alt'),'Imagem de fundo'),src:n.attr('src'),altPt:n.attr('data-pt')||n.attr('alt')||'',altEs:n.attr('data-es')||n.attr('alt')||''});
  });
  $('main video').each((_,el)=>{
    const n=$(el),key=keyFor('video',page.videos.length);
    n.attr('data-cms-video',key);
    page.videos.push({_key:key,key,label:'Vídeo do banner principal',src:n.attr('data-src')||n.attr('src'),poster:n.attr('poster')||'',enabled:true,loop:true,playbackRate:.75});
  });
  $('main a[href]').each((_,el)=>{
    if(!managed(el))return;
    const n=$(el),key=keyFor('link',page.links.length);
    n.attr('data-cms-link',key);
    page.links.push({_key:key,key,label:label(n.text(),'Link'),href:n.attr('href'),whatsappTopic:n.attr('data-whatsapp')||''});
  });
  return {page,html:$.html()};
}

export function extractServices(source) {
  const $=load(source),icons={};
  const services=[];
  $('.services-catalog .service-card').each((i,el)=>{
    const n=$(el),name=n.find('h3 [data-pt]').first(),description=n.find('.service-content>p [data-pt]').first(),key=n.attr('id')||keyFor('service',i);
    icons[key]=n.find('.service-symbol').html()||'';
    services.push({_id:`service-${key}`,_type:'service',serviceId:key,name:name.attr('data-pt')||clean(name.text()),nameEs:name.attr('data-es')||'',description:description.attr('data-pt')||clean(description.text()),descriptionEs:description.attr('data-es')||'',src:n.find('img').attr('src'),alt:n.find('img').attr('alt')||'',note:n.find('.service-photo-note').attr('data-pt')||'',noteEs:n.find('.service-photo-note').attr('data-es')||'',category:i<2?'Industrial · Rural':i===2||i===5?'Residencial':'Manutenção',active:true,showOnHome:i<3,order:i,whatsappTopic:n.find('[data-whatsapp]').attr('data-whatsapp')||'',icon:key});
  });
  return {services,icons};
}
