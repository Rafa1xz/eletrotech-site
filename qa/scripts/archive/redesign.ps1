$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$utf8 = New-Object Text.UTF8Encoding($false)
function T($pt,$es) { '<span data-pt="'+[Net.WebUtility]::HtmlEncode($pt)+'" data-es="'+[Net.WebUtility]::HtmlEncode($es)+'">'+[Net.WebUtility]::HtmlEncode($pt)+'</span>' }
function Icon($path) { '<svg viewBox="0 0 24 24" aria-hidden="true">'+$path+'</svg>' }
$searchIcon = Icon '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'
$whatsappIcon = Icon '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 7.5c0 4 3 7 7 7l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2Z"/>'
$mailIcon = Icon '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 6 9 7 9-7"/>'
$phoneIcon = Icon '<path d="m8 3 3 5-3 3c1.2 2.5 2.8 4.1 5 5l3-3 5 3c0 3-2 5-5 5C9 21 3 15 3 8c0-3 2-5 5-5Z"/>'
$instagramIcon = Icon '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'
$catalogIcon = Icon '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
$arrowIcon = Icon '<path d="m7 14 5-5 5 5M12 9v12"/>'
$resetIcon = Icon '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>'
$pages = @(@('index.html','Início','Inicio'),@('servicos.html','Serviços','Servicios'),@('produtos.html','Produtos','Productos'),@('como-trabalhamos.html','Como trabalhamos','Cómo trabajamos'),@('oxilife-fish.html','OxiLife Fish','OxiLife Fish'),@('contato.html','Contato','Contacto'))
$headerSearch = @"
<section id="header-search" class="header-search" aria-label="Busca no catálogo" data-pt="Busca no catálogo" data-es="Búsqueda en el catálogo" data-translate-attr="aria-label" hidden><div class="wrap">
<form action="produtos.html" method="get" role="search"><label for="site-search">$(T 'O que você está procurando?' '¿Qué está buscando?')<input id="site-search" type="search" name="q" maxlength="100" placeholder="Motores, painéis, OxiLife..." data-pt="Motores, painéis, OxiLife..." data-es="Motores, tableros, OxiLife..." data-translate-attr="placeholder" autocomplete="off" enterkeyhint="search"></label><button type="submit" class="btn btn-primary" aria-label="Buscar produtos" data-pt="Buscar produtos" data-es="Buscar productos" data-translate-attr="aria-label">$searchIcon $(T 'Buscar' 'Buscar')</button><p class="search-hint">$(T 'Busque equipamentos e materiais no nosso catálogo.' 'Busque equipos y materiales en nuestro catálogo.')</p></form>
</div></section>
"@
$footer = @"
<footer class="site-footer"><div class="wrap footer-grid"><div><a class="footer-name" href="index.html">ELETROTECH<span>MARECHAL</span></a><p>$(T 'Sistemas elétricos, automação e soluções para piscicultura. Desde 2018, do motor ao controle do seu processo.' 'Sistemas eléctricos, automatización y soluciones para piscicultura. Desde 2018, del motor al control de su proceso.')</p><div class="footer-socials"><a href="https://instagram.com/eletrotechmarechal" target="_blank" rel="noopener noreferrer">$instagramIcon Instagram <span aria-hidden="true">↗</span></a><a href="oxilife-fish.html">$(T 'Conheça OxiLife Fish' 'Conozca OxiLife Fish') <span aria-hidden="true">→</span></a></div></div>
<nav aria-label="Rodapé" data-pt="Rodapé" data-es="Pie de página" data-translate-attr="aria-label"><h3>$(T 'Explore' 'Explore')</h3>$(($pages | ForEach-Object {'<a href="'+$_[0]+'">'+(T $_[1] $_[2])+'</a>'}) -join '')</nav>
<div><h3>$(T 'Converse com a equipe' 'Hable con el equipo')</h3><div class="footer-contact"><a data-whatsapp="Contato" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer"><span class="contact-icon">$whatsappIcon</span><span class="contact-copy"><small>WhatsApp</small>$(T 'Vamos falar do seu projeto' 'Hablemos de su proyecto') ↗</span></a><a href="tel:+554599241306"><span class="contact-icon">$phoneIcon</span><span class="contact-copy"><small>$(T 'Telefone' 'Teléfono')</small>+55 45 9924-1306</span></a><a href="mailto:eletrotekc@outlook.com"><span class="contact-icon">$mailIcon</span><span class="contact-copy"><small>E-mail</small>eletrotekc@outlook.com</span></a></div></div>
</div><div class="wrap footer-bottom"><span>© <span data-year>2026</span> Eletrotech Marechal.</span><span>$(T 'OxiLife Fish é um projeto Eletrotech.' 'OxiLife Fish es un proyecto Eletrotech.')</span><a class="back-to-top" href="#topo">$(T 'Voltar ao topo' 'Volver arriba') $arrowIcon</a></div></footer>
<a class="floating-contact" data-whatsapp="Contato" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer">$whatsappIcon WhatsApp <span aria-hidden="true">↗</span></a>
<nav class="mobile-dock" aria-label="Atalhos" data-pt="Atalhos" data-es="Accesos rápidos" data-translate-attr="aria-label"><a href="produtos.html">$catalogIcon $(T 'Catálogo' 'Catálogo')</a><a data-whatsapp="Orçamento" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer">$whatsappIcon $(T 'Falar com a equipe' 'Hablar con el equipo')</a></nav>
"@
foreach ($page in $pages) {
  $path = Join-Path $root ('assets/'+$page[0])
  $html = [IO.File]::ReadAllText($path)
  if ($html.Contains('id="header-search"')) { throw 'Este script aplica a transformação uma vez. Restaure o snapshot antes de executar novamente.' }
  $html = $html.Replace('width=device-width, initial-scale=1','width=device-width, initial-scale=1, viewport-fit=cover')
  $html = [regex]::Replace($html,'<body class="([^"]*)">','<body id="topo" class="$1">')
  $html = $html.Replace('<main id="conteudo">','<main id="conteudo" tabindex="-1">')
  $html = $html.Replace('<span aria-hidden="true">☰</span>','<span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>')
  $fullCTA = '<a class="btn btn-small header-cta" data-whatsapp="Orçamento" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer"><span class="cta-icon">'+$whatsappIcon+'</span><span class="cta-content"><small>'+(T 'Atendimento rápido' 'Atención rápida')+'</small><strong>'+(T 'Fale conosco' 'Hable con nosotros')+'</strong></span><span class="cta-arrow" aria-hidden="true">→</span></a>'
  $html = [regex]::Replace($html,'(?s)<a class="btn btn-small".*?</a>',$fullCTA)
  $html = $html.Replace('aria-label="Eletrotech Marechal"','aria-label="Página inicial — Eletrotech Marechal" data-pt="Página inicial — Eletrotech Marechal" data-es="Página de inicio — Eletrotech Marechal" data-translate-attr="aria-label"')
  $html = $html.Replace('<button class="menu-toggle" type="button" aria-controls="main-nav" aria-expanded="false">','<button class="menu-toggle" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="Abrir menu">')
  $html = $html.Replace('<nav id="main-nav" aria-label="Principal">','<nav id="main-nav" aria-label="Principal" data-pt="Principal" data-es="Principal" data-translate-attr="aria-label"><p class="nav-panel-label">'+(T 'Explore a Eletrotech' 'Explore Eletrotech')+'</p>')
  $mobileCTA = '<a class="btn btn-primary mobile-menu-cta" data-whatsapp="Orçamento" href="https://wa.me/554599241306" target="_blank" rel="noopener noreferrer">'+$whatsappIcon+(T 'Falar com a equipe' 'Hablar con el equipo')+'</a>'
  $html = [regex]::Replace($html,'(?s)(<nav id="main-nav".*?)(</nav>)','$1'+$mobileCTA+'$2')
  $html = $html.Replace('<div class="header-actions">','<div class="header-actions"><button class="icon-button search-toggle" type="button" aria-controls="header-search" aria-expanded="false" aria-label="Buscar no catálogo">'+$searchIcon+'</button>')
  $html = $html.Replace('role="group" aria-label="Idioma"','role="group" aria-label="Idioma" data-pt="Idioma" data-es="Idioma" data-translate-attr="aria-label"')
  $html = $html.Replace('data-lang="pt" aria-pressed="true"','data-lang="pt" aria-pressed="true" lang="pt-BR" aria-label="Português"')
  $html = $html.Replace('data-lang="es" aria-pressed="false"','data-lang="es" aria-pressed="false" lang="es" aria-label="Español"')
  $html = $html.Replace('</div></header>','</div>'+$headerSearch+'</header><button type="button" class="menu-backdrop" aria-label="Fechar menu" tabindex="-1" hidden></button>')
  if ($page[0] -ne 'index.html' -and $page[0] -ne 'oxilife-fish.html') {
    $crumb = '<nav class="breadcrumb" aria-label="Caminho da página" data-pt="Caminho da página" data-es="Ruta de la página" data-translate-attr="aria-label"><a href="index.html">'+(T 'Início' 'Inicio')+'</a><span aria-hidden="true">/</span><span aria-current="page">'+(T $page[1] $page[2])+'</span></nav>'
    $html = $html.Replace('<section class="page-intro"><div class="wrap">','<section class="page-intro"><div class="wrap">'+$crumb)
  }
  $html = [regex]::Replace($html,'(?s)<footer class="site-footer">.*?</body>',$footer+'</body>')
  if ($page[0] -eq 'produtos.html') {
    $html = $html.Replace('<div class="filter-list"','<div class="filter-group"><span class="filter-heading">'+(T 'Explore por categoria' 'Explore por categoría')+'</span><div class="filter-list"')
    $html = $html.Replace('</div><label class="search-label">','</div></div><label class="search-label" for="product-search">')
    $html = $html.Replace('<input type="search" id="product-search"','<span class="search-field">'+$searchIcon+'<input type="search" id="product-search"')
    $html = $html.Replace('data-translate-attr="placeholder"></label></div>','data-translate-attr="placeholder" enterkeyhint="search" aria-describedby="catalog-status"></span></label></div>')
    $html = $html.Replace('<p id="catalog-status" class="catalog-status" role="status" aria-live="polite"></p>','<div class="catalog-status"><p id="catalog-status" role="status" aria-live="polite" aria-atomic="true"></p><button class="catalog-reset" type="button" data-clear-filters hidden>'+$resetIcon+(T 'Limpar filtros' 'Limpiar filtros')+'</button></div>')
    $html = $html.Replace('id="clear-filters"','id="clear-filters" data-clear-filters')
  }
  $html = $html.Replace('</span> ↗</span></a><a href="tel:+554599241306">','</span></span></a><a href="tel:+554599241306">')
  [IO.File]::WriteAllText($path,$html,$utf8)
}
Write-Output 'Cabeçalho, rodapé, navegação mobile e catálogo atualizados nas seis páginas.'
& (Join-Path $PSScriptRoot 'update-icons.ps1')
