/* Interface de preparação: lê o site público, mantém prévias em memória e
   exporta rascunhos. Não autentica, não envia arquivos e não publica conteúdo. */
(() => {
  'use strict';
  const pages = [
    ['index.html', 'Início'], ['servicos.html', 'Serviços'],
    ['produtos.html', 'Produtos'], ['como-trabalhamos.html', 'Como trabalhamos'],
    ['oxilife-fish.html', 'OxiLife Fish'], ['contato.html', 'Contato']
  ];
  const labels = {dashboard:'Visão geral',products:'Produtos',banners:'Banners',content:'Textos e conteúdos',pages:'Páginas e seções',media:'Biblioteca de mídias',settings:'Configurações',access:'Acesso e permissões'};
  const descriptions = {
    dashboard:'Conteúdo atual e atalhos para organizar sua próxima atualização.',
    products:'Consulte o catálogo existente e prepare alterações nos produtos.',
    banners:'Prepare imagens e chamadas para os destaques do site.',
    content:'Edite os textos em português e espanhol, com prévia nesta aba.',
    pages:'Explore as páginas e prepare a organização das seções.',
    media:'Imagens utilizadas no site e arquivos selecionados para prévia.',
    settings:'Identidade, contatos e informações gerais em um único lugar.',
    access:'Autenticação e permissões serão conectadas na etapa de backend.'
  };
  const categories = {motores:'Motores',materiais:'Materiais elétricos',zagonel:'Zagonel',oxilife:'OxiLife Fish'};
  const state = {products:[],banners:[],content:[],sections:[],media:[],settings:{},changes:[],loaded:false};
  const $ = selector => document.querySelector(selector);
  const view = $('#view');
  const dialog = $('#editor');
  const form = $('#editor-form');
  const blobs = new Set();
  let edited = null;
  let sequence = 0;
  const uid = () => `draft-${++sequence}`;
  const clean = value => (value || '').replace(/\s+/g,' ').trim();
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function action(text, callback, className) {
    const button = el('button',text,className); button.type='button';
    button.addEventListener('click',callback); return button;
  }
  function image(src, alt) {
    const node = el('img'); node.src=src; node.alt=alt || ''; node.loading='lazy';
    return node;
  }
  function publicUrl(path) { return new URL(path, new URL('../',location.href)).href; }
  function feedback(text) { $('#feedback').textContent=text; }
  function note(title, description) {
    const box=el('div',null,'empty'); box.append(el('h2',title),el('p',description)); return box;
  }
  function badge(text,draft=false) { return el('span',text,`badge${draft?' draft':''}`); }
  function panel(title) { const box=el('section',null,'panel'); box.append(el('h2',title)); return box; }
  function record(message) {
    state.changes.unshift({time:new Date().toISOString(),message});
    feedback(`${message} — prévia nesta aba. O site público não foi alterado.`);
  }
  async function loadSite() {
    try {
      const documents = await Promise.all(pages.map(async ([path,name]) => {
        const response=await fetch(publicUrl(path),{cache:'no-store'});
        if(!response.ok) throw new Error(`Não foi possível ler ${path}.`);
        return {path,name,doc:new DOMParser().parseFromString(await response.text(),'text/html')};
      }));
      documents.forEach(({path,name,doc}) => {
        doc.querySelectorAll('main > section').forEach((section,index) => {
          state.sections.push({id:`${path}:section:${index}`,page:path,pageName:name,name:clean(section.querySelector('h1,h2')?.textContent) || `Seção ${index+1}`,active:true,order:index+1});
        });
        doc.querySelectorAll('main [data-pt][data-es], footer [data-pt][data-es], .topbar [data-pt][data-es], head title, head meta[name="description"]').forEach((node,index) => {
          if(node.closest('.product-card') || node.dataset.translateAttr && node.dataset.translateAttr!=='content') return;
          state.content.push({id:`${path}:text:${index}`,page:path,pageName:name,name:clean(node.dataset.pt || node.content || node.textContent),pt:node.dataset.pt || node.content || clean(node.textContent),es:node.dataset.es || '',element:node.tagName.toLowerCase()});
        });
        doc.querySelectorAll('img[src]').forEach(node => {
          const src=publicUrl(node.getAttribute('src'));
          let item=state.media.find(media=>media.src===src);
          if(!item){ item={id:uid(),src,name:decodeURIComponent(new URL(src).pathname.split('/').pop()),alt:node.alt,pages:[],local:false};state.media.push(item); }
          if(!item.pages.includes(name)) item.pages.push(name);
        });
        if(path==='produtos.html') doc.querySelectorAll('.product-card').forEach((card,index) => {
          const title=card.querySelector('h3 [data-pt]');
          const description=card.querySelector('.product-body > p [data-pt]');
          state.products.push({id:`product-${index+1}`,name:clean(title?.dataset.pt || card.querySelector('h3')?.textContent),nameEs:title?.dataset.es || '',description:description?.dataset.pt || '',descriptionEs:description?.dataset.es || '',category:card.dataset.category,src:publicUrl(card.querySelector('img').getAttribute('src')),gallery:'',sku:'',price:'',salePrice:'',stock:'',lowStock:'',variations:'',seoTitle:'',seoDescription:'',active:true,featured:false,order:index+1,details:[...card.querySelectorAll('details p')].map(p=>clean(p.textContent)).join('\n')});
        });
        if(path==='index.html') {
          const hero=doc.querySelector('.home-hero');
          const heroImage=hero?.querySelector('img');
          if(hero) state.banners.push({id:'home-hero',name:'Destaque da página inicial',title:clean(hero.querySelector('h1')?.textContent),subtitle:clean(hero.querySelector('.hero-lead, .hero-copy > p:not(.eyebrow), p:not(.eyebrow)')?.textContent),button:clean(hero.querySelector('.btn')?.textContent),link:hero.querySelector('.btn')?.getAttribute('href') || '',src:heroImage?publicUrl(heroImage.getAttribute('src')):'',mobileSrc:'',order:1,active:true});
          state.settings={id:'settings',name:'Eletrotech Marechal',phone:clean(doc.querySelector('a[href^="tel:"]')?.getAttribute('href')?.slice(4)),whatsapp:doc.querySelector('[data-whatsapp]')?.getAttribute('href')?.match(/wa\.me\/(\d+)/)?.[1] || '',message:'',email:doc.querySelector('a[href^="mailto:"]')?.getAttribute('href')?.slice(7) || '',address:'',hours:'',instagram:doc.querySelector('a[href*="instagram.com"]')?.href || '',facebook:'',tiktok:'',youtube:'',logo:publicUrl(doc.querySelector('.brand img').getAttribute('src')),favicon:publicUrl(doc.querySelector('link[rel=icon]').getAttribute('href')),description:clean(doc.querySelector('.footer-grid > div > p')?.textContent),seoTitle:clean(doc.title),seoDescription:doc.querySelector('meta[name=description]')?.content || ''};
        }
      });
      state.loaded=true; $('#export').disabled=false; view.setAttribute('aria-busy','false'); render();
    } catch(error) {
      view.setAttribute('aria-busy','false'); view.replaceChildren(note('Não foi possível carregar o site',`${error.message} Abra este painel pelo Live Server ou pela hospedagem HTTP, não por file://.`));
      view.append(action('Tentar novamente',()=>location.reload()));
    }
  }
  function dashboard() {
    const stats=el('div',null,'stats');
    [[state.products.length,'Produtos no catálogo','Lidos do site atual'],[pages.length,'Páginas existentes','Português e espanhol'],[state.media.filter(m=>!m.local).length,'Imagens utilizadas','Arquivos do site'],['—','Estoque baixo','Estoque ainda não informado']].forEach(([value,title,caption])=>{
      const card=el('div',null,'stat'); card.append(el('span',title),el('strong',String(value)),el('small',caption));stats.append(card);
    });
    view.append(stats);
    const columns=el('div',null,'columns'); const quick=panel('O que você quer preparar?');const links=el('div',null,'quick-links');
    [['products','Editar catálogo','Produtos, preços e detalhes'],['banners','Preparar banners','Imagens e chamadas'],['content','Revisar textos','Conteúdo em dois idiomas'],['settings','Atualizar contatos','WhatsApp e identidade']].forEach(([route,title,sub])=>{const link=el('a',title);link.href=`#${route}`;link.append(el('small',sub));links.append(link);});quick.append(links);
    const chart=panel('Produtos por categoria');chart.append(el('small','Distribuição dos cards lidos do site, incluindo prévias aplicadas.'));
    Object.entries(categories).forEach(([key,label])=>{const count=state.products.filter(p=>p.category===key).length;const row=el('div',null,'chart-row');const heading=el('div',null,'chart-label');heading.append(el('span',label),el('strong',String(count)));const bar=el('div',null,'bar');const fill=el('span');fill.style.width=`${100*count/Math.max(state.products.length,1)}%`;bar.append(fill);row.append(heading,bar);chart.append(row);});
    columns.append(quick,chart);view.append(columns);
    const lower=el('div',null,'columns');const history=panel('Atividade desta aba');
    if(!state.changes.length) history.append(el('p','Nenhuma prévia aplicada nesta aba. O histórico administrativo será fornecido pelo backend.','muted'));
    else {const list=el('ol',null,'history');state.changes.slice(0,8).forEach(change=>list.append(el('li',`${new Date(change.time).toLocaleTimeString('pt-BR')} · ${change.message}`)));history.append(list);}
    const publication=panel('Publicação e dados');publication.append(el('p','O site atual recebe consultas pelo WhatsApp. Não há dados de pedidos ou vendas para exibir.','muted'),el('p',`${state.banners.length} destaque(s) identificado(s). Preços e estoque não foram inventados.`,'help'),badge('Backend pendente',true));lower.append(history,publication);view.append(lower);
  }
  function filterControls(options, callback) {
    const toolbar=el('div',null,'toolbar');const label=el('label','Pesquisar');const input=el('input');input.type='search';input.placeholder='Digite para pesquisar…';label.append(input);
    const category=el('label','Filtrar');const select=el('select');
    [['','Todos'],...options].forEach(([value,text])=>{const option=el('option',text);option.value=value;select.append(option);});category.append(select);
    toolbar.append(label,category);input.addEventListener('input',()=>callback(normalize(input.value),select.value));select.addEventListener('change',()=>callback(normalize(input.value),select.value));return toolbar;
  }
  function productList() {
    const list=el('div');const draw=(query='',category='')=>{
      const products=state.products.filter(p=>(!category||p.category===category)&&normalize(`${p.name} ${p.sku}`).includes(query)).sort((a,b)=>a.order-b.order);
      list.replaceChildren(el('p',`${products.length} produto(s) · preços em reais; campos vazios significam não informado.`, 'count'));
      if(!products.length){list.append(note('Nenhum produto encontrado','Ajuste sua busca ou o filtro de categoria.'));return;}
      const wrap=el('div',null,'table-wrap');const table=el('table');const head=el('thead');const headings=el('tr');['Produto','Categoria','Preço','Estoque','Situação','Ações'].forEach(t=>headings.append(el('th',t)));head.append(headings);table.append(head);const body=el('tbody');
      products.forEach(product=>{const row=el('tr');const cell=el('td');const identity=el('div',null,'product-cell');const text=el('div');text.append(el('strong',product.name),el('small',product.sku||'SKU não informado'));identity.append(image(product.src,product.name),text);cell.append(identity);row.append(cell,el('td',categories[product.category]||product.category),el('td',product.price===''?'Sob consulta':money(product.salePrice||product.price)),el('td',product.stock===''?'Não informado':product.stock));const status=el('td');status.append(badge(product.draft?'Prévia local':product.active?'No site':'Inativo na prévia',!!product.draft));const actions=el('td');actions.append(action('Editar prévia',()=>edit('products',product)));row.append(status,actions);body.append(row);});table.append(body);wrap.append(table);list.append(wrap);
    };
    const controls=filterControls(Object.entries(categories),draw);controls.append(action('Novo produto',()=>edit('products',{id:uid(),name:'',nameEs:'',description:'',descriptionEs:'',category:'motores',src:'',gallery:'',sku:'',price:'',salePrice:'',stock:'',lowStock:'',variations:'',seoTitle:'',seoDescription:'',active:true,featured:false,order:state.products.length+1,details:''}),'primary'));view.append(controls,list);draw();
  }
  function money(value){return Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
  function banners() {
    const tools=el('div',null,'toolbar');tools.append(action('Novo banner',()=>edit('banners',{id:uid(),name:'',title:'',subtitle:'',button:'',link:'',src:'',mobileSrc:'',order:state.banners.length+1,active:true}),'primary'));view.append(tools,el('p','O destaque existente é uma composição de texto, imagem e vídeo. Esta prévia não substitui a composição publicada.','help'));
    const cards=el('div',null,'cards');state.banners.slice().sort((a,b)=>a.order-b.order).forEach(banner=>{const card=el('article',null,'card');if(banner.src)card.append(image(banner.src,banner.title));const body=el('div',null,'card-body');body.append(badge(banner.draft?'Prévia local':'Destaque atual',!!banner.draft),el('h2',banner.name),el('p',banner.title),action('Editar prévia',()=>edit('banners',banner)));card.append(body);cards.append(card);});view.append(cards);
  }
  function contents() {
    const list=el('div',null,'panel');const count=el('p',null,'count');let pageNumber=1;let query='';let page='';
    function draw(){const matches=state.content.filter(item=>(!page||item.page===page)&&normalize(item.pt+' '+item.es).includes(query));const maxPage=Math.max(1,Math.ceil(matches.length/12));pageNumber=Math.min(pageNumber,maxPage);count.textContent=`${matches.length} texto(s) · página ${pageNumber} de ${maxPage}`;list.replaceChildren();matches.slice((pageNumber-1)*12,pageNumber*12).forEach(item=>{const row=el('div',null,'section-row');const text=el('div');text.append(el('small',`${item.pageName} · ${item.element}${item.draft?' · prévia':''}`),el('p',item.pt.slice(0,150)+(item.pt.length>150?'…':'')));row.append(text,action('Editar',()=>edit('content',item)));list.append(row);});if(!matches.length)list.append(note('Nenhum texto encontrado','Tente outro termo ou outra página.'));const controls=el('div',null,'actions');const prev=action('Anterior',()=>{pageNumber--;draw();});const next=action('Próxima',()=>{pageNumber++;draw();});prev.disabled=pageNumber===1;next.disabled=pageNumber===maxPage;controls.append(prev,next);list.append(controls);}
    view.append(filterControls(pages,(q,p)=>{query=q;page=p;pageNumber=1;draw();}),count,list);draw();
  }
  function pageList(){const list=el('div',null,'page-list');pages.forEach(([path,name])=>{const box=panel(name);const link=el('a','Abrir página publicada ↗');link.href=publicUrl(path);link.target='_blank';link.rel='noopener';box.append(link);state.sections.filter(s=>s.page===path).sort((a,b)=>a.order-b.order).forEach(section=>{const row=el('div',null,'section-row');const text=el('div');text.append(el('strong',section.name),el('small',`Posição ${section.order} · ${section.active?'Visível':'Oculta na prévia'}${section.draft?' · rascunho':''}`));row.append(text,action('Organizar',()=>edit('sections',section)));box.append(row);});list.append(box);});view.append(el('p','A ordem e a visibilidade são propostas locais. A aplicação no layout será conectada ao backend.','help'),list);}
  function mediaList(){
    const tools=el('div',null,'toolbar');const label=el('label','Selecionar imagens para prévia');const input=el('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.multiple=true;label.append(input);tools.append(label);view.append(tools,el('p','JPEG, PNG ou WebP, até 5 MB por arquivo e 20 milhões de pixels. Os arquivos selecionados ficam somente nesta aba; nenhum upload é enviado.','help'));
    const cards=el('div',null,'cards');
    function draw(){cards.replaceChildren();state.media.forEach(item=>{const card=el('article',null,'card');card.append(image(item.src,item.alt));const body=el('div',null,'card-body');body.append(badge(item.local?'Arquivo local':'No site',item.local),el('h3',item.name),el('p',item.local?'Prévia temporária, sem upload.':`Utilizada em: ${item.pages.join(', ')}`));if(item.local)body.append(action('Remover prévia',()=>{if(!confirm('Remover esta imagem temporária da prévia?'))return;URL.revokeObjectURL(item.src);blobs.delete(item.src);state.media=state.media.filter(m=>m.id!==item.id);draw();feedback('Imagem removida somente desta prévia.');}));else{const remove=action('Em uso no site',()=>{});remove.disabled=true;body.append(remove);}card.append(body);cards.append(card);});}
    input.addEventListener('change',async()=>{input.disabled=true;let added=0;const errors=[];for(const file of input.files){try{const src=await localImage(file);state.media.push({id:uid(),src,name:file.name,alt:file.name,pages:[],local:true});added++;}catch(error){errors.push(`${file.name}: ${error.message}`);}}input.value='';input.disabled=false;draw();feedback(`${added} imagem(ns) disponível(is) para prévia. Nenhum upload enviado.${errors.length?' '+errors.join(' '):''}`);});view.append(cards);draw();
  }
  async function localImage(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Use JPEG, PNG ou WebP de até 5 MB.');
    const src=URL.createObjectURL(file);const img=new Image();img.src=src;
    try{await img.decode();if(img.naturalWidth*img.naturalHeight>20000000)throw new Error('Limite de 20 milhões de pixels.');blobs.add(src);return src;}catch(error){URL.revokeObjectURL(src);throw new Error(error.message || 'Imagem inválida.');}
  }
  function settings(){const box=panel('Identidade e canais de contato');box.append(el('p','Campos não encontrados no site ficam vazios. Nenhuma alteração é enviada aos canais de contato.','muted'));[['Empresa',state.settings.name],['WhatsApp',state.settings.whatsapp],['E-mail',state.settings.email],['Instagram',state.settings.instagram]].forEach(([title,value])=>{const row=el('div',null,'section-row');row.append(el('strong',title),el('span',value||'Não informado'));box.append(row);});box.append(action('Editar configurações na prévia',()=>edit('settings',state.settings),'primary'));view.append(box);}
  function access(){view.append(note('Autenticação ainda não conectada','Esta interface é pública e não é uma área protegida. Não informe senhas nem dados privados. Login, sessões e permissões serão implementados no backend.'));const box=panel('Perfis previstos');box.style.marginTop='20px';box.append(el('p','Administrador: configurações, conteúdo e gestão de acessos.','help'),el('p','Editor: gestão de conteúdo, dentro das permissões definidas no servidor.','help'));const button=action('Gerenciar usuários — backend pendente',()=>{});button.disabled=true;box.append(button);view.append(box);}
  const productFields=[['name','Nome do produto','text',true],['nameEs','Nome em espanhol'],['category','Categoria','category'],['sku','Código / SKU'],['description','Descrição em português','textarea'],['descriptionEs','Descrição em espanhol','textarea'],['src','URL da imagem principal','image'],['gallery','Galeria: uma URL por linha','textarea'],['price','Preço normal (R$)','decimal'],['salePrice','Preço promocional (R$)','decimal'],['stock','Quantidade em estoque','integer'],['lowStock','Alerta de estoque baixo','integer'],['variations','Variações: tamanho, cor ou modelo','textarea'],['details','Características','textarea'],['order','Ordem de exibição','integer',true],['active','Produto ativo','checkbox'],['featured','Produto em destaque','checkbox'],['seoTitle','Título para SEO'],['seoDescription','Descrição para SEO','textarea']];
  const schemas={products:productFields,banners:[['name','Nome interno','text',true],['title','Título','text',true],['subtitle','Subtítulo','textarea'],['button','Texto do botão'],['link','Link de destino'],['src','Imagem desktop','image'],['mobileSrc','Imagem mobile','image'],['order','Ordem','integer',true],['active','Banner ativo','checkbox']],content:[['pt','Texto em português','textarea',true],['es','Texto em espanhol','textarea']],sections:[['name','Título da seção','text',true],['order','Posição','integer',true],['active','Seção visível','checkbox']],settings:[['name','Nome da empresa','text',true],['phone','Telefone','tel'],['whatsapp','WhatsApp com DDI e DDD','tel'],['message','Mensagem padrão do WhatsApp','textarea'],['email','E-mail','email'],['address','Endereço físico'],['hours','Horário de atendimento'],['instagram','Instagram','url'],['facebook','Facebook','url'],['tiktok','TikTok','url'],['youtube','YouTube','url'],['logo','Logotipo (URL)','image'],['favicon','Favicon (URL)'],['description','Descrição institucional','textarea'],['seoTitle','Título para SEO'],['seoDescription','Descrição para SEO','textarea']]};
  function field(def,value){const [key,title,type='text',required=false]=def;const label=el('label',title,type==='textarea'?'wide':'');let input;
    if(type==='category'){input=el('select');Object.entries(categories).forEach(([id,name])=>{const option=el('option',name);option.value=id;input.append(option);});}
    else if(type==='textarea')input=el('textarea');
    else{input=el('input');input.type=type==='integer'||type==='decimal'?'number':type==='image'?'url':type;}
    input.name=key;input.required=required;if(type==='checkbox')input.checked=!!value;else input.value=value??'';
    if(type==='integer'||type==='decimal'){input.min=key==='order'?'1':'0';input.max='999999999';input.step=type==='integer'?'1':'0.01';}
    if(type==='textarea'||type==='text')input.maxLength=type==='textarea'?10000:500;
    label.append(input);
    if(type==='image'){
      const uploadLabel=el('span','Ou selecionar imagem local para prévia');const upload=el('input');upload.type='file';upload.accept='image/jpeg,image/png,image/webp';upload.setAttribute('aria-label',`Selecionar arquivo: ${title}`);
      upload.addEventListener('change',async()=>{if(!upload.files[0])return;try{const src=await localImage(upload.files[0]);input.type='text';input.value=src;feedback('Imagem selecionada apenas para prévia; exportação não inclui o arquivo.');updatePreview();}catch(error){feedback(error.message);}upload.value='';});label.append(uploadLabel,upload);
    }return label;
  }
  function edit(kind,item){edited={kind,original:{...item}};$('#editor-title').textContent=kind==='products'?'Preparar produto':kind==='banners'?'Preparar banner':kind==='content'?'Editar texto':kind==='sections'?'Organizar seção':'Configurações gerais';const fields=$('#fields');fields.replaceChildren(...schemas[kind].map(def=>field(def,item[def[0]])));dialog.showModal();updatePreview();}
  function values(){const result={...edited.original};schemas[edited.kind].forEach(([key,,type])=>{const field=form.elements.namedItem(key);result[key]=type==='checkbox'?field.checked:field.value;});return result;}
  function safeUrl(value){if(!value)return '';try{const url=new URL(value,publicUrl(''));return ['https:','http:'].includes(url.protocol)||blobs.has(value)?url.href:'';}catch{return '';}}
  function updatePreview(){if(!edited)return;const value=values();const target=$('#preview-body');target.replaceChildren();const src=safeUrl(value.src||value.logo);if(src)target.append(image(src,value.name||''));target.append(el('strong',value.title||value.name||'Prévia do texto'));if(edited.kind==='content'){target.append(el('small','Português'),el('p',value.pt),el('small','Español'),el('p',value.es));}else{target.append(el('p',value.description||value.subtitle||''));if(edited.kind==='products')target.append(el('p',value.price===''?'Preço sob consulta':money(value.salePrice||value.price)));if(edited.kind==='settings')target.append(el('p',`WhatsApp: ${value.whatsapp||'Não informado'}\nE-mail: ${value.email||'Não informado'}`));if(edited.kind==='sections')target.append(el('p',`Posição ${value.order} · ${value.active?'Visível':'Oculta'}`));if(value.button){const label=el('span',value.button,'button');target.append(label);}}}
  form.addEventListener('input',()=>{for(const field of form.elements)if(field.setCustomValidity)field.setCustomValidity('');updatePreview();});
  form.addEventListener('submit',event=>{event.preventDefault();const value=values();if(edited.kind==='products'&&value.salePrice!==''&&(value.price===''||Number(value.salePrice)>Number(value.price))){form.elements.salePrice.setCustomValidity('Informe um preço normal maior ou igual ao promocional.');form.elements.salePrice.reportValidity();return;}if(edited.kind==='products'&&value.sku&&state.products.some(p=>p.id!==value.id&&p.sku===value.sku)){form.elements.sku.setCustomValidity('Este SKU já está sendo usado na prévia.');form.elements.sku.reportValidity();return;}for(const key of ['src','mobileSrc','logo','favicon','link','instagram','facebook','tiktok','youtube'])if(value[key]&&!safeUrl(value[key])){form.elements[key]?.setCustomValidity('Use um endereço HTTP/HTTPS ou um caminho do site.');form.elements[key]?.reportValidity();return;}value.draft=true;const kind=edited.kind;if(kind==='settings')state.settings=value;else{const index=state[kind].findIndex(item=>item.id===value.id);if(index<0)state[kind].push(value);else state[kind][index]=value;}record(`Prévia aplicada: ${value.name||value.pt?.slice(0,50)||value.title}`);dialog.close();render();});
  $('#close-editor').addEventListener('click',()=>dialog.close());$('#cancel-editor').addEventListener('click',()=>dialog.close());
  function render(){if(!state.loaded)return;const route=location.hash.slice(1);const current=labels[route]?route:'dashboard';$('#title').textContent=labels[current];$('#subtitle').textContent=descriptions[current];document.querySelectorAll('.sidebar nav a').forEach(link=>{if(link.hash===`#${current}`)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});view.replaceChildren();({dashboard,products:productList,banners,content:contents,pages:pageList,media:mediaList,settings,access}[current])();}
  window.addEventListener('hashchange',()=>{render();$('#main').focus({preventScroll:true});});
  window.addEventListener('beforeunload',event=>{if(state.changes.length){event.preventDefault();event.returnValue='';}});
  $('#export').addEventListener('click',()=>{
    const payload={schemaVersion:1,exportedAt:new Date().toISOString(),mode:'frontend-draft-not-published',products:state.products.filter(p=>p.draft),banners:state.banners.filter(p=>p.draft),content:state.content.filter(p=>p.draft),sections:state.sections.filter(p=>p.draft),settings:state.settings.draft?state.settings:null,notes:'Rascunho para integração futura. Não publica o site. Imagens locais precisam ser enviadas posteriormente.',changes:state.changes};
    const data=JSON.stringify(payload,(key,value)=>typeof value==='string'&&value.startsWith('blob:')?'':value,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const link=el('a');link.href=url;link.download='eletrotech-rascunho.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('Rascunho exportado como JSON. Nenhum dado foi publicado; imagens locais não estão incluídas.');
  });
  loadSite();
})();
