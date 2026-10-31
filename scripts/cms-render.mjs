import {load} from 'cheerio';

export function localMedia(value,kind='image') {
  const pattern=kind==='video'?/^videos\/[a-zA-Z0-9_.-]+\.(mp4|webm)$/:/^images\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|svg)$/;
  if(!pattern.test(value||''))throw Error(`Mídia ${kind} inválida: ${value}`);
  return value;
}
export function validLink(value) {
  if(typeof value!=='string'||/[\u0000-\u0020<>"\\]/.test(value))throw Error('Link inválido.');
  if(value.startsWith('images/'))return localMedia(value);
  if(/^https:\/\//i.test(value)) {new URL(value);return value;}
  if(/^mailto:[^@\s]+@[^@\s]+$/i.test(value)||/^tel:\+?[\d()-]+$/i.test(value))return value;
  if(/^#[\w-]+$/.test(value)||/^[a-z0-9/-]+\.html(?:[?#][^<>"\\\s]*)?$/i.test(value)&&!value.includes('..'))return value;
  throw Error(`Link não permitido: ${value}`);
}
const hex=value=>/^#[a-f\d]{6}$/i.test(value||'')?value:null;
const safeId=value=>/^[a-z0-9-]+$/.test(value||'');
const tr=($,pt,es)=>$('<span>').attr('data-pt',pt||'').attr('data-es',es||pt||'').text(pt||'');

export function renderPage(template,page,site,{services=[],icons={},defaults={},pages=[]}={}) {
  const $=load(template);
  for(const item of page.texts||[]){
    const n=$('[data-cms-text]').filter((_,el)=>$(el).attr('data-cms-text')===item.key);
    n.each((_,el)=>{
      const node=$(el),attribute=node.attr('data-translate-attr')||'';
      // Attribute names come exclusively from the trusted template.
      node.attr('data-pt',item.pt??'').attr('data-es',item.es||item.pt||'');
      if(attribute)node.attr(attribute,item.pt??'');else node.text(item.pt??'');
    });
  }
  for(const item of page.images||[]){
    const src=localMedia(item.src),node=$('[data-cms-image]').filter((_,el)=>$(el).attr('data-cms-image')===item.key);
    node.attr('src',src).attr('alt',item.altPt||'').attr('data-pt',item.altPt||'').attr('data-es',item.altEs||item.altPt||'').attr('data-translate-attr','alt');
    node.removeAttr('width height'); // A replacement may have a different aspect ratio.
  }
  for(const item of page.videos||[]){
    const node=$('[data-cms-video]').filter((_,el)=>$(el).attr('data-cms-video')===item.key);
    if(!node.length)continue;
    const src=localMedia(item.src,'video'),poster=localMedia(item.poster);
    const rate=item.playbackRate??.75;
    if(!Number.isFinite(rate)||rate<.25||rate>2)throw Error('Velocidade do vídeo inválida.');
    node.attr('data-src',src).attr('poster',poster).attr('data-video-enabled',String(item.enabled!==false)).attr('data-playback-rate',String(rate)).attr('data-video-loop',String(item.loop!==false));
    if(item.loop===false)node.removeAttr('loop');else node.attr('loop','');
    node.closest('.home-hero').attr('style',`background-image:url('${poster}')`);
  }
  for(const item of page.links||[]){
    const node=$('[data-cms-link]').filter((_,el)=>$(el).attr('data-cms-link')===item.key);
    node.attr('href',validLink(item.href));
    if(item.whatsappTopic)node.attr('data-whatsapp',item.whatsappTopic);else node.removeAttr('data-whatsapp');
  }
  if(page.sections?.length){
    const nodes=$('main>[data-cms-section]'),slot=$('<template>');
    nodes.first().before(slot);
    const used=new Set();
    for(const section of page.sections){
      if(used.has(section.key))throw Error(`Seção duplicada: ${section.key}`);used.add(section.key);
      const node=nodes.filter((_,el)=>$(el).attr('data-cms-section')===section.key);
      if(!node.length)throw Error(`Seção desconhecida em ${page.title}: ${section.key}`);
      if(section.enabled===false)node.attr('hidden','');
      node.remove();slot.before(node);
    }
    // Missing items retain their approved position after explicitly ordered items.
    nodes.filter((_,el)=>!used.has($(el).attr('data-cms-section'))).each((_,el)=>slot.before($(el).remove()));
    slot.remove();
  }
  if($('.service-grid').length){
    const home=page.pageId==='home',ids=new Set();
    const grid=$('.service-grid').empty();
    const list=[...services].sort((a,b)=>(a.order??0)-(b.order??0)||String(a.serviceId).localeCompare(String(b.serviceId)));
    for(const service of list){
      if(!safeId(service.serviceId)||ids.has(service.serviceId))throw Error('Identificador de serviço inválido/duplicado.');ids.add(service.serviceId);
      if(home&&!service.showOnHome)continue;
      const card=$('<article class="service-card">').attr('id',service.serviceId);
      if(service.active===false)card.attr('hidden','');
      card.append($('<img class="service-photo">').attr({src:localMedia(service.src),alt:service.alt||service.name,loading:'lazy',decoding:'async'}));
      const body=$('<div class="service-content">'),top=$('<div class="card-top">');
      top.append($('<span class="service-symbol">').html(icons[service.icon]||Object.values(icons)[0]||''));
      top.append($('<span class="tag">').text(service.category||''));body.append(top);
      body.append($('<h3>').append(tr($,service.name,service.nameEs)),$('<p>').append(tr($,service.description,service.descriptionEs)));
      const link=$('<a class="text-link" target="_blank" rel="noopener noreferrer">').attr('data-whatsapp',service.whatsappTopic||service.name).attr('href',`https://wa.me/${site.whatsapp}`);
      link.append(tr($,'Solicitar orçamento','Solicitar presupuesto'),$('<span aria-hidden="true">').text('↗'));body.append(link);
      if(service.note)body.append($('<span class="service-photo-note">').append(tr($,service.note,service.noteEs)));
      card.append(body);grid.append(card);
    }
  }
  // Shared contacts and branding are regenerated on every page, including links.
  if(!/^\d{10,15}$/.test(site.whatsapp||''))throw Error('WhatsApp inválido.');
  if(!/^\+?\d{10,15}$/.test(site.phone||`+${site.whatsapp}`))throw Error('Telefone inválido.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email||''))throw Error('E-mail inválido.');
  const base=defaults;
  const substitutions=[[base.name,site.name],[base.email,site.email],[base.phoneLabel,site.phoneLabel],[base.instagramLabel,site.instagramLabel]].filter(([a,b])=>a&&b&&a!==b);
  $('body *,head title,head meta').each((_,el)=>{
    const n=$(el);if(n.is('script,style,svg')||n.closest('script,style,svg').length)return;
    for(const [old,value] of substitutions){
      n.contents().each((_,child)=>{if(child.type==='text')child.data=child.data.replaceAll(old,value);});
      for(const attr of ['data-pt','data-es','content','alt','aria-label'])if(n.attr(attr)?.includes(old))n.attr(attr,n.attr(attr).replaceAll(old,value));
    }
  });
  $('a[href^="https://wa.me/"]').each((_,el)=>{const n=$(el),url=new URL(n.attr('href'));url.pathname=`/${site.whatsapp}`;n.attr('href',url.href);});
  $('a[href^="tel:"]').attr('href',`tel:${site.phone||`+${site.whatsapp}`}`);
  $('a[href^="mailto:"]').attr('href',`mailto:${site.email}`);
  if(site.instagram){validLink(site.instagram);$('a[href*="instagram.com/eletrotechmarechal"]').attr('href',site.instagram);}
  if(site.logoSrc){const logo=localMedia(site.logoSrc);$('.brand img,.footer-brand img').attr('src',logo).attr('alt',site.name).attr('data-pt',site.name).attr('data-es',site.name).removeAttr('width height');}
  if(site.footerPt)$('.footer-grid>div:first-child>p').empty().append(tr($,site.footerPt,site.footerEs));
  if(site.businessHours)$('.contact-hours').empty().append(tr($,site.businessHours,site.businessHoursEs));
  if(hex(site.footerStart)&&hex(site.footerEnd))$('.site-footer').attr('style',`background:linear-gradient(105deg,${site.footerStart},${site.footerEnd})`);
  for(const config of pages){
    $(`#main-nav>a[href="${config.file}"]`).each((_,el)=>{
      const node=$(el);if(config.showInMenu===false){node.attr('hidden','');return;}
      if(config.menuTitle){node.empty().append(tr($,config.menuTitle,config.menuTitleEs));}
    });
  }
  return $.html().replace(/[\t ]+$/gm,'');
}
