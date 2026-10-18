$ErrorActionPreference='Stop'
$root=(Get-Location).Path
$assetsPath=Join-Path $root 'assets'
$utf8=New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Drawing
function Write-Asset($name,$content){[IO.File]::WriteAllText((Join-Path $assetsPath $name),$content,$utf8)}
function E($text){[System.Net.WebUtility]::HtmlEncode([string]$text)}
function T($pt,$es){'<span data-pt="'+(E $pt)+'" data-es="'+(E $es)+'">'+(E $pt)+'</span>'}
function Image($file,$alt,$eager=$false){
 $im=[System.Drawing.Image]::FromFile((Join-Path (Join-Path $root 'images') $file));$w=$im.Width;$h=$im.Height;$im.Dispose()
 $loading='loading="lazy"';if($eager){$loading='loading="eager" fetchpriority="high"'}
 '<img src="../images/'+$file+'" alt="'+(E $alt)+'" width="'+$w+'" height="'+$h+'" '+$loading+' decoding="async">'
}
function WA($pt,$es,$topic='Contato',$class='btn btn-primary'){'<a class="'+$class+'" data-whatsapp="'+(E $topic)+'" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer">'+(T $pt $es)+'<span aria-hidden="true">↗</span></a>'}
function Link($url,$pt,$es,$class='text-link'){'<a class="'+$class+'" href="'+$url+'">'+(T $pt $es)+'<span aria-hidden="true"> →</span></a>'}
$pages=@(@('index.html','Início','Inicio'),@('servicos.html','Serviços','Servicios'),@('produtos.html','Produtos','Productos'),@('como-trabalhamos.html','Como trabalhamos','Cómo trabajamos'),@('oxilife-fish.html','OxiLife Fish','OxiLife Fish'),@('contato.html','Contato','Contacto'))
function Nav($active){
 $links=foreach($p in $pages){$current='';if($p[0]-eq $active){$current=' aria-current="page"'};'<a href="'+$p[0]+'"'+$current+'>'+(T $p[1] $p[2])+'</a>'}
 @"
<a class="skip-link" href="#conteudo">$(T 'Pular para o conteúdo' 'Saltar al contenido')</a>
<div class="topbar"><div class="wrap"><span>$(T 'Sistemas elétricos desde 2018' 'Sistemas eléctricos desde 2018')</span><a href="https://instagram.com/eletrotechmarechal" target="_blank" rel="noopener noreferrer">@eletrotechmarechal ↗</a></div></div>
<header class="site-header"><div class="wrap nav-shell"><a class="brand" href="index.html" aria-label="Eletrotech Marechal">$(Image 'logo-eletrotech-marechal-otimizada.png' 'Eletrotech Marechal' $true)</a>
<button class="menu-toggle" type="button" aria-controls="main-nav" aria-expanded="false">$(T 'Menu' 'Menú') <span aria-hidden="true">☰</span></button>
<nav id="main-nav" aria-label="Principal">$($links -join '')</nav>
<div class="header-actions"><div class="language-switch" role="group" aria-label="Idioma"><button type="button" data-lang="pt" aria-pressed="true">PT</button><button type="button" data-lang="es" aria-pressed="false">ES</button></div>$(WA 'Orçamento' 'Presupuesto' 'Orçamento' 'btn btn-small')</div>
</div></header>
"@
}
function CTA($ox=$false){
 $h=T 'Vamos encontrar a solução para o seu projeto?' '¿Encontramos la solución para su proyecto?'
 $d=T 'Conte o que você precisa. Nossa equipe ajuda a definir os próximos passos.' 'Cuéntenos qué necesita. Nuestro equipo le ayuda a definir los próximos pasos.'
 $topic='Orçamento'
 if($ox){$h=T 'Mais controle para a sua piscicultura.' 'Más control para su piscicultura.';$d=T 'Converse com a equipe sobre sondas, painéis e monitoramento para seus tanques.' 'Hable con el equipo sobre sondas, tableros y monitoreo para sus estanques.';$topic='OxiLife Fish'}
 '<section class="cta-section"><div class="wrap cta-inner"><div><p class="eyebrow">ELETROTECH MARECHAL</p><h2>'+$h+'</h2><p>'+$d+'</p></div>'+(WA 'Falar com a equipe' 'Hablar con el equipo' $topic)+'</div></section>'
}
function Footer{
 $links=foreach($p in $pages){'<a href="'+$p[0]+'">'+(T $p[1] $p[2])+'</a>'}
 @"
<footer class="site-footer"><div class="wrap footer-grid"><div><a class="footer-name" href="index.html">ELETROTECH<span>MARECHAL</span></a><p>$(T 'Sistemas elétricos, automação e soluções para piscicultura. Desde 2018, do motor ao controle do seu processo.' 'Sistemas eléctricos, automatización y soluciones para piscicultura. Desde 2018, del motor al control de su proceso.')</p></div>
<nav aria-label="Rodapé"><h3>$(T 'Explore' 'Explore')</h3>$($links -join '')</nav>
<div><h3>$(T 'Fale com a gente' 'Hable con nosotros')</h3><a data-whatsapp="Contato" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a><a href="tel:+554599241306">+55 45 9924-1306</a><a href="mailto:eletrotekc@outlook.com">eletrotekc@outlook.com</a><a href="https://instagram.com/eletrotechmarechal" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div>
</div><div class="wrap footer-bottom"><span>© <span data-year>2026</span> Eletrotech Marechal.</span><span>$(T 'OxiLife Fish é um projeto Eletrotech.' 'OxiLife Fish es un proyecto Eletrotech.')</span></div></footer>
<a class="floating-contact" data-whatsapp="Contato" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer">WhatsApp <span aria-hidden="true">↗</span></a>
"@
}
function Head($k,$ke,$t,$te,$d,$de){'<section class="page-intro"><div class="wrap"><p class="eyebrow">'+(T $k $ke)+'</p><h1>'+(T $t $te)+'</h1><p class="intro-copy">'+(T $d $de)+'</p></div></section>'}
function SectionHead($k,$ke,$t,$te,$d='',$de=''){ '<div class="section-heading"><div><p class="eyebrow">'+(T $k $ke)+'</p><h2>'+(T $t $te)+'</h2></div><p>'+(T $d $de)+'</p></div>'}
function SavePage($file,$title,$titleEs,$desc,$descEs,$body,$class=''){
 $schema=@{'@context'='https://schema.org';'@type'='Organization';name='Eletrotech Marechal';foundingDate='2018';email='eletrotekc@outlook.com';sameAs=@('https://instagram.com/eletrotechmarechal')}|ConvertTo-Json -Compress
 Write-Asset $file @"
<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title data-pt="$(E $title) | Eletrotech Marechal" data-es="$(E $titleEs) | Eletrotech Marechal">$(E $title) | Eletrotech Marechal</title>
<meta name="description" content="$(E $desc)" data-pt="$(E $desc)" data-es="$(E $descEs)" data-translate-attr="content">
<meta property="og:type" content="website"><meta property="og:site_name" content="Eletrotech Marechal">
<meta property="og:title" content="$(E $title) | Eletrotech Marechal" data-pt="$(E $title) | Eletrotech Marechal" data-es="$(E $titleEs) | Eletrotech Marechal" data-translate-attr="content">
<meta property="og:description" content="$(E $desc)" data-pt="$(E $desc)" data-es="$(E $descEs)" data-translate-attr="content">
<meta name="theme-color" content="#102c4d"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css">
<script type="application/ld+json">$schema</script><script src="i18n.js" defer></script><script src="script.js" defer></script></head>
<body class="$class">$(Nav $file)<main id="conteudo">$body</main>$(Footer)</body></html>
"@
}
$services=@(
 @('01','Painéis elétricos','Tableros eléctricos','Projeto e montagem sob medida para controle de motores, iluminação e processos.','Diseño y montaje a medida para controlar motores, iluminación y procesos.','Industrial · Rural','Industrial · Rural'),
 @('02','Automação industrial','Automatización industrial','Controle de processos para reduzir intervenções manuais e melhorar a operação.','Control de procesos para reducir intervenciones manuales y mejorar la operación.','Industrial · Rural','Industrial · Rural'),
 @('03','Instalações residenciais','Instalaciones residenciales','Instalações e serviços elétricos com atenção à segurança e ao acabamento.','Instalaciones y servicios eléctricos con atención a la seguridad y los acabados.','Residencial','Residencial'),
 @('04','Rebobinagem de motores','Rebobinado de motores','Diagnóstico, rebobinagem e manutenção de motores: o serviço que deu origem à Eletrotech.','Diagnóstico, rebobinado y mantenimiento de motores: el servicio que dio origen a Eletrotech.','Manutenção','Mantenimiento'),
 @('05',"Manutenção de bombas d'água",'Mantenimiento de bombas de agua','Avaliação e reparo de bombas para propriedades, instalações e abastecimento.','Evaluación y reparación de bombas para propiedades, instalaciones y abastecimiento.','Manutenção · Rural','Mantenimiento · Rural'),
 @('06','Instalação de produtos Zagonel','Instalación de productos Zagonel','Fornecimento e instalação de chuveiros e torneiras para o dia a dia da sua casa.','Suministro e instalación de duchas y grifos para su hogar.','Residencial','Residencial'))
function ServiceCards($count=6){
 ($services|Select-Object -First $count|ForEach-Object{'<article class="service-card"><div class="card-top"><span class="number">'+$_[0]+'</span><span class="tag">'+(T $_[5] $_[6])+'</span></div><h3>'+(T $_[1] $_[2])+'</h3><p>'+(T $_[3] $_[4])+'</p>'+(WA 'Solicitar orçamento' 'Solicitar presupuesto' $_[1] 'text-link')+'</article>'})-join ''
}
$products=@(
 @('motores','Motores Hércules','Motores Hércules','motores-hercules-1.jpeg','Motores elétricos novos para diferentes aplicações.','Motores eléctricos nuevos para distintas aplicaciones.','Modelos, potência, tensão e RPM sob consulta.','Modelos, potencia, tensión y RPM bajo consulta.'),
 @('materiais','Materiais para painéis','Materiales para tableros','materiais-paineis-1.jpeg','Componentes e materiais para montagem de painéis elétricos.','Componentes y materiales para montar tableros eléctricos.','Informe os componentes e quantidades do seu projeto.','Indique los componentes y cantidades de su proyecto.'),
 @('zagonel','Linha Zagonel','Línea Zagonel','produtos-zagonel.jpeg','Chuveiros e torneiras para o uso diário da casa.','Duchas y grifos para el uso diario del hogar.','Modelos e opções de instalação sob consulta.','Modelos y opciones de instalación bajo consulta.'),
 @('oxilife','Oxímetro portátil','Oxímetro portátil','oximetro-portatil.jpeg','Medição manual de oxigênio dissolvido, temperatura e saturação.','Medición manual de oxígeno disuelto, temperatura y saturación.','Uso portátil para checagens nos tanques.','Uso portátil para controles en estanques.'),
 @('oxilife','Painel da sonda','Tablero de sonda','painel-sonda-3.jpeg','Monitoramento e controle de aeração para piscicultura.','Monitoreo y control de aireación para piscicultura.','Até 3 sondas e 4 grupos de aeradores, conforme a configuração.','Hasta 3 sondas y 4 grupos de aireadores, según la configuración.'),
 @('oxilife','Alarme para piscicultura','Alarma para piscicultura','alarme-piscicultura.jpeg','Sistema de alerta para acompanhar ocorrências nos tanques.','Sistema de alertas para supervisar eventos en estanques.','Conexão sem fio e Wi-Fi. Consulte os requisitos de instalação.','Conexión inalámbrica y Wi-Fi. Consulte los requisitos de instalación.'))
function ProductCards($items=$products){
 ($items|ForEach-Object{'<article class="product-card" data-category="'+$_[0]+'"><div class="product-image">'+(Image $_[3] $_[1])+'</div><div class="product-body"><span class="tag">'+(T 'Sob consulta' 'Bajo consulta')+'</span><h2>'+(T $_[1] $_[2])+'</h2><p>'+(T $_[4] $_[5])+'</p><details><summary>'+(T 'Características e consulta' 'Características y consulta')+'</summary><p>'+(T $_[6] $_[7])+'</p><p>'+(T 'Consulte disponibilidade, valores, entrega e condições de garantia com a equipe.' 'Consulte disponibilidad, precios, entrega y condiciones de garantía con el equipo.')+'</p></details>'+(WA 'Consultar este produto' 'Consultar este producto' $_[1] 'btn btn-outline')+'</div></article>'})-join ''
}
function Steps{
 $items=@(
 @('01','Entendemos sua necessidade','Entendemos su necesidad','Você conta o que precisa. Avaliamos a aplicação e, quando necessário, o local.','Nos cuenta qué necesita. Evaluamos la aplicación y, cuando corresponde, el lugar.'),
 @('02','Definimos o orçamento','Definimos el presupuesto','Escopo, materiais, valores e prazo são alinhados antes de iniciar o serviço.','Alcance, materiales, precios y plazos se acuerdan antes de iniciar el servicio.'),
 @('03','Executamos e testamos','Ejecutamos y probamos','Montagem, instalação e verificação do funcionamento conforme o projeto.','Montaje, instalación y verificación del funcionamiento según el proyecto.'),
 @('04','Entregamos e orientamos','Entregamos y orientamos','Explicamos a operação e combinamos as necessidades de suporte e manutenção.','Explicamos la operación y acordamos las necesidades de soporte y mantenimiento.'))
 ($items|ForEach-Object{'<article class="step"><span class="step-num">'+$_[0]+'</span><h3>'+(T $_[1] $_[2])+'</h3><p>'+(T $_[3] $_[4])+'</p></article>'})-join ''
}