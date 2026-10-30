// Static publishing adapter. No dependencies or runtime server are required.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');
const write=(path,value)=>writeFile(resolve(root,path),value.replace(/[\t ]+$/gm,''),'utf8');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(pt,es=pt,tag='span')=>`<${tag} data-pt="${escape(pt)}" data-es="${escape(es)}">${escape(pt)}</${tag}>`;
const site=JSON.parse(await read('data/site.json'));
const {products}=JSON.parse(await read('data/products.json'));
const categories={motores:['Motores','Motores'],materiais:['Materiais elétricos','Materiales eléctricos'],zagonel:['Zagonel','Zagonel'],oxilife:['OxiLife Fish','OxiLife Fish']};
const ids=new Set(),slugs=new Set();
const routes=JSON.parse(await read('data/product-routes.json').catch(error=>{if(error.code==='ENOENT')return '{}';throw error;}));
const base=new URL(site.url);
if(base.protocol!=='https:' || !/^\d{10,15}$/.test(site.whatsapp))throw Error('Configuração de URL/WhatsApp inválida.');
if(!Array.isArray(products))throw Error('products deve ser uma lista.');
for(const p of products){
  if(typeof p.id!=='string'||typeof p.slug!=='string'||!/^[a-z0-9-]+$/.test(p.id)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)||!p.name||!categories[p.category]||typeof p.active!=='boolean')throw Error('Produto inválido: '+p.id);
  if(ids.has(p.id)||slugs.has(p.slug))throw Error('ID ou slug duplicado: '+p.id);
  if(routes[p.id] && routes[p.id]!==p.slug)throw Error('URL estável: não altere o slug de '+p.id);
  if(Object.entries(routes).some(([id,slug])=>id!==p.id&&slug===p.slug))throw Error('Slug reservado: '+p.slug);
  for(const key of ['price','salePrice','stock','lowStock'])if(p[key]!=null&&(!Number.isFinite(p[key])||p[key]<0||(key.toLowerCase().includes('stock')&&!Number.isInteger(p[key]))))throw Error('Valor inválido: '+key);
  if(p.salePrice!=null&&(p.price==null||p.salePrice>p.price))throw Error('Promoção inválida: '+p.id);
  if(p.sku && products.some(other=>other!==p&&other.sku===p.sku))throw Error('SKU duplicado: '+p.sku);
  if(!Array.isArray(p.gallery)||!Array.isArray(p.specifications)||!Array.isArray(p.variations))throw Error('Galeria, especificações e variações devem ser listas.');
  for(const path of [p.src,...p.gallery]){
    if(!/^images\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|svg)$/.test(path))throw Error('Imagem local inválida: '+path);
    await access(resolve(root,path));
  }
  ids.add(p.id);slugs.add(p.slug);routes[p.id]=p.slug;
}
const active=products.filter(p=>p.active).sort((a,b)=>a.order-b.order);
await write('js/site-config.js',`// Generated from data/site.json; public contact information only.\nwindow.ELETROTECH_SITE = ${JSON.stringify(site).replace(/</g,'\\u003c')};\n`);
const link=p=>`produtos/${p.slug}.html`;
const canonical=p=>new URL(link(p),base).href;
const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const price=p=>p.price==null?tr('Sob consulta','Bajo consulta'):`${p.salePrice!=null?`<del>${money(p.price)}</del> `:''}<span>${money(p.salePrice??p.price)}</span>`;
function card(p){return `
            <article class="product-card" data-category="${p.category}" data-product-id="${p.id}">
              <a class="product-image" href="${link(p)}" aria-label="${escape(p.name)}">
                <img src="${escape(p.src)}" alt="${escape(p.alt||p.name)}" width="800" height="700" loading="lazy" decoding="async">
                ${p.illustration?`<span class="illustration-label">${tr('Ilustração','Ilustración')}</span>`:''}
              </a>
              <div class="product-body">
                <span class="product-category">${tr(...categories[p.category])}${p.featured?` · ${tr('Destaque','Destacado')}`:''}</span>
                <h3><a href="${link(p)}">${tr(p.name,p.nameEs)}</a></h3>
                <p>${tr(p.description,p.descriptionEs)}</p>
                <div class="product-card-meta"><span>${escape(p.brand||site.name)}</span><strong>${price(p)}</strong></div>
                <a class="btn btn-outline" href="${link(p)}">${tr('Ver detalhes','Ver detalles')} <span aria-hidden="true">↗</span></a>
              </div>
            </article>`;}
let catalog=await read('produtos.html');
catalog=catalog.replace(/<div class="product-grid">[\s\S]*?<\/article>\s*<\/div>/,`<div class="product-grid">${active.map(card).join('')}\n          </div>`);
for(const key of ['todos',...Object.keys(categories)]){
  const count=key==='todos'?active.length:active.filter(p=>p.category===key).length;
  catalog=catalog.replace(new RegExp(`(data-filter="${key}"[\\s\\S]*?class="filter-count" aria-hidden="true">)\\d+`),`$1${count}`);
}
await write('produtos.html',catalog);
let ox=await read('oxilife-fish.html');
ox=ox.replace(/<div class="product-grid">[\s\S]*?<\/article>\s*<\/div>/,`<div class="product-grid">${active.filter(p=>p.category==='oxilife').map(card).join('')}\n          </div>`);
await write('oxilife-fish.html',ox);
const bodyBefore=catalog.slice(catalog.indexOf('<body'),catalog.indexOf('<main'));
const bodyAfter=catalog.slice(catalog.indexOf('</main>')+7);
function shell(p,main,available){
  const title=available?(p.seoTitle||`${p.name} | ${site.name}`):`Produto indisponível | ${site.name}`;
  const description=p.seoDescription||p.description||'Consulte o catálogo atualizado da Eletrotech.';
  const structured={ '@context':'https://schema.org','@type':'Product',name:p.name,description:p.description,image:[p.src,...(p.gallery||[])].filter(Boolean).map(src=>new URL(src,base).href),url:canonical(p),...(p.sku?{sku:p.sku}:{}),...(p.brand?{brand:{'@type':'Brand',name:p.brand}}:{})};
  if(p.price!=null)structured.offers={'@type':'Offer',price:p.salePrice??p.price,priceCurrency:'BRL',url:canonical(p),...(p.stock!=null?{availability:`https://schema.org/${p.stock>0?'InStock':'OutOfStock'}`}:{})};
  const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Início',item:site.url},{'@type':'ListItem',position:2,name:'Produtos',item:new URL('produtos.html',base).href},{'@type':'ListItem',position:3,name:p.name,item:canonical(p)}]};
  const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
  const html=`<!DOCTYPE html>
<html lang="pt-BR"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title data-pt="${escape(title)}" data-es="${escape((p.nameEs||p.name)+' | '+site.name)}">${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${canonical(p)}">
  <meta property="og:type" content="product"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical(p)}">
  ${p.src?`<meta property="og:image" content="${new URL(p.src,base).href}">`:''}
  ${available?'':'<meta name="robots" content="noindex,follow">'}
  <meta name="theme-color" content="#0B1425"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/styles.css"><link rel="stylesheet" href="css/industrial.css"><link rel="stylesheet" href="css/pages.css"><link rel="stylesheet" href="css/reference-layout.css?v=006baf702a9c">
  <script src="js/site-config.js" defer></script><script src="js/i18n.js" defer></script><script src="js/script.js" defer></script><script src="js/gallery.js" defer></script>
  ${available?`<script type="application/ld+json">${json(structured)}</script>`:''}
  <script type="application/ld+json">${json(breadcrumb)}</script>
</head>
${bodyBefore.replace('catalog-page','product-detail-page').replace('services-page combined-page','product-detail-page')}
<main id="conteudo">${main}</main>${bodyAfter}`;
  return html.replace(/(href|src|action|poster|data-src)="([^":]+)"/g,(match,key,value)=>(value.startsWith('/')||value.startsWith('#'))?match:`${key}="../${value}"`);
}
function detail(p){
  const images=[p.src,...p.gallery];
  const quote=`Olá! Gostaria de um orçamento para ${p.name}${p.sku?` (código ${p.sku})`:''}. Página: ${canonical(p)}`;
  const quoteEs=`Hola, quisiera un presupuesto para ${p.nameEs||p.name}${p.sku?` (código ${p.sku})`:''}. Página: ${canonical(p)}`;
  const related=active.filter(item=>item.id!==p.id&&item.category===p.category);
  const suggestions=(related.length?related:active.filter(item=>item.id!==p.id)).slice(0,3);
  return `
  <section class="product-detail section">
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Caminho da página"><a href="index.html">${tr('Início','Inicio')}</a><span aria-hidden="true">/</span><a href="produtos.html">${tr('Produtos','Productos')}</a><span aria-hidden="true">/</span><span aria-current="page">${tr(p.name,p.nameEs)}</span></nav>
      <div class="product-detail-grid">
        <div class="product-gallery" data-gallery>
          <a class="gallery-main" href="${p.src}" data-gallery-main aria-label="Ampliar imagem"><img src="${p.src}" alt="${escape(p.alt||p.name)}" width="900" height="900" fetchpriority="high" decoding="async"></a>
          <p class="gallery-caption">${p.illustration?tr('Ilustração do sistema. Consulte fotos do equipamento.','Ilustración del sistema. Consulte fotos del equipo.'):tr('Fotos dos equipamentos apresentados pela Eletrotech.','Fotos de los equipos presentados por Eletrotech.')} ${tr('Clique para ampliar.','Haga clic para ampliar.')}</p>
          ${images.length>1?`<div class="gallery-thumbs" aria-label="Fotos do produto">${images.map((src,i)=>`<a href="${src}" data-gallery-item aria-label="Foto ${i+1} de ${images.length}" ${i===0?'aria-current="true"':''}><img src="${src}" alt="${escape(p.name)} — foto ${i+1}" width="100" height="100" loading="lazy"></a>`).join('')}</div>`:''}
        </div>
        <div class="product-summary">
          <p class="eyebrow">${tr(...categories[p.category])}${p.featured?` · ${tr('Destaque','Destacado')}`:''}</p>
          <h1>${tr(p.name,p.nameEs)}</h1>
          <p class="product-lead">${tr(p.description,p.descriptionEs)}</p>
          <dl class="product-identification">${p.brand?`<div><dt>${tr('Marca','Marca')}</dt><dd>${escape(p.brand)}</dd></div>`:''}${p.model?`<div><dt>${tr('Modelo','Modelo')}</dt><dd>${escape(p.model)}</dd></div>`:''}${p.sku?`<div><dt>${tr('Código / SKU','Código / SKU')}</dt><dd>${escape(p.sku)}</dd></div>`:''}</dl>
          <div class="product-purchase"><p class="product-price">${price(p)}</p>
          <p>${p.stock!=null?tr(p.stock>0?`${p.stock} unidade(s) em estoque`:'Sem estoque no momento',p.stock>0?`${p.stock} unidad(es) en stock`:'Sin stock en este momento'):tr('Consulte modelos e disponibilidade com a equipe.','Consulte modelos y disponibilidad con el equipo.')}</p>
          ${p.variations.length?`<label for="product-variation">${tr('Opções','Opciones')}</label><select id="product-variation"><option value="">${escape('Selecione uma opção')}</option>${p.variations.map(v=>`<option>${escape(v)}</option>`).join('')}</select>`:''}
          <a class="btn btn-primary product-quote" data-product-quote="${escape(quote)}" data-product-quote-es="${escape(quoteEs)}" data-phone="${site.whatsapp}" href="https://wa.me/${site.whatsapp}?text=${encodeURIComponent(quote)}" target="_blank" rel="noopener noreferrer">${tr('Solicitar orçamento pelo WhatsApp','Solicitar presupuesto por WhatsApp')} <span aria-hidden="true">↗</span></a>
          <small>${tr('Atendimento para encontrar a solução adequada à sua aplicação.','Atención para encontrar la solución adecuada para su aplicación.')}</small></div>
        </div>
      </div>
      <div class="product-info-grid"><section><p class="eyebrow">${tr('O EQUIPAMENTO','EL EQUIPO')}</p><h2>${tr('Informações do produto','Información del producto')}</h2><p>${tr(p.details,p.detailsEs||p.details)}</p><p>${tr('Consulte disponibilidade, valores, entrega e condições de garantia com a equipe.','Consulte disponibilidad, precios, entrega y condiciones de garantía con el equipo.')}</p></section>
      <section><p class="eyebrow">${tr('DADOS DISPONÍVEIS','DATOS DISPONIBLES')}</p><h2>${tr('Especificações técnicas','Especificaciones técnicas')}</h2>${p.specifications.length?`<dl class="specifications">${p.specifications.map(s=>`<div><dt>${tr(s.label,s.labelEs||s.label)}</dt><dd>${tr(s.value,s.valueEs||s.value)}</dd></div>`).join('')}</dl>`:`<p>${tr('As especificações variam conforme o modelo e a aplicação. Consulte a equipe para confirmar os dados do equipamento.','Las especificaciones varían según el modelo y la aplicación. Consulte al equipo para confirmar los datos.')}</p>`}</section></div>
    </div>
  </section>
  <section class="section muted"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">${tr('CONTINUE EXPLORANDO','SIGA EXPLORANDO')}</p><h2>${tr(related.length?'Da mesma categoria':'Conheça também',related.length?'De la misma categoría':'Conozca también')}</h2></div><a class="text-link" href="produtos.html">${tr('Ver catálogo completo','Ver catálogo completo')} →</a></div><div class="product-grid">${suggestions.map(card).join('')}</div></div></section>`;
}
await mkdir(resolve(root,'produtos'),{recursive:true});
for(const [id,slug] of Object.entries(routes)){
  const p=products.find(p=>p.id===id)||{id,slug,name:'Produto indisponível',gallery:[]};
  const main=p.active?detail(p):`<section class="section unavailable-product"><div class="wrap"><p class="eyebrow">CATÁLOGO ELETROTECH</p><h1>${tr('Produto indisponível','Producto no disponible')}</h1><p>${tr('Este produto não está disponível no catálogo atual. Confira outras opções ou fale com a equipe.','Este producto no está disponible en el catálogo actual. Consulte otras opciones o contacte al equipo.')}</p><a class="btn btn-primary" href="produtos.html">${tr('Explorar catálogo','Explorar catálogo')}</a></div></section>`;
  await write(link(p),shell(p,main,!!p.active));
}
await write('data/product-routes.json',JSON.stringify(routes,null,2)+'\n');
let portfolio=await read('como-trabalhamos.html');
portfolio=portfolio.replace('class="process-page"','class="portfolio-page"').replace(/ aria-current="page"/g,'');
portfolio=portfolio.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,await read('templates/portfolio-main.html'));
portfolio=portfolio.replace(/<title\b[^>]*>[\s\S]*?<\/title>/,'<title data-pt="Projetos e equipamentos | Eletrotech Marechal" data-es="Proyectos y equipos | Eletrotech Marechal">Projetos e equipamentos | Eletrotech Marechal</title>');
portfolio=portfolio.replace(/<meta (name="description"|property="og:description")[^>]*>/g,'<meta $1 content="Fotos de montagens, instalações e equipamentos apresentados pela Eletrotech. Conheça soluções de elétrica, automação e piscicultura.">');
portfolio=portfolio.replace(/<meta property="og:title"[^>]*>/,'<meta property="og:title" content="Projetos e equipamentos | Eletrotech Marechal">');
portfolio=portfolio.replace('</head>',`<link rel="canonical" href="${new URL('portfolio.html',base).href}"><script src="js/gallery.js" defer></script></head>`);
await write('portfolio.html',portfolio);
const urls=['index.html','servicos.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html','portfolio.html',...active.map(link)];
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(path=>`  <url><loc>${new URL(path,base).href}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Publicação estática: ${active.length} produtos ativos, ${Object.keys(routes).length} URLs preservadas.`);
