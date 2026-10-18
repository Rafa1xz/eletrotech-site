$ErrorActionPreference = 'Stop'
$projectRoot = (Get-Location).Path
$utf8 = New-Object Text.UTF8Encoding($false)
function T($pt, $es) { '<span data-pt="'+[Net.WebUtility]::HtmlEncode($pt)+'" data-es="'+[Net.WebUtility]::HtmlEncode($es)+'">'+[Net.WebUtility]::HtmlEncode($pt)+'</span>' }
function Icon($name) {
  $svg = [IO.File]::ReadAllText((Join-Path $projectRoot ('assets/icons/'+$name+'.svg'))).Trim()
  $svg.Replace('<svg ','<svg class="fa-icon fa-'+$name+'" aria-hidden="true" focusable="false" ')
}
function Photo($name,$pt,$es) {
  '<img src="../images/'+$name+'" alt="'+[Net.WebUtility]::HtmlEncode($pt)+'" data-pt="'+[Net.WebUtility]::HtmlEncode($pt)+'" data-es="'+[Net.WebUtility]::HtmlEncode($es)+'" data-translate-attr="alt" loading="eager" decoding="async">'
}
$serviceIcons = @('bolt','sliders','house','gears','droplet','shower')
$pages = @('index.html','servicos.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html')
$classes = @('home-page','services-page','catalog-page','process-page','ox-page','contact-page')
$paths = @"
<section class="solution-paths" aria-labelledby="solutions-title"><div class="wrap"><h2 id="solutions-title" class="visually-hidden">$(T 'Escolha a solução para sua aplicação' 'Elija la solución para su aplicación')</h2><div class="solution-grid">
<a class="solution-path" href="servicos.html"><span class="solution-icon">$(Icon 'bolt')</span><div><span class="solution-label">$(T 'ENERGIA E CONTROLE' 'ENERGÍA Y CONTROL')</span><h3>$(T 'Elétrica e automação' 'Electricidad y automatización')</h3><p>$(T 'Montagem, instalação e manutenção para diferentes aplicações.' 'Montaje, instalación y mantenimiento para distintas aplicaciones.')</p><span class="solution-link">$(T 'Explorar serviços' 'Explorar servicios') <span aria-hidden="true">→</span></span></div></a>
<a class="solution-path solution-path--water" href="oxilife-fish.html"><span class="solution-icon">$(Icon 'fish')</span><div><span class="solution-label">$(T 'TECNOLOGIA NA ÁGUA' 'TECNOLOGÍA EN EL AGUA')</span><h3>$(T 'Piscicultura com OxiLife Fish' 'Piscicultura con OxiLife Fish')</h3><p>$(T 'Sondas, painéis e alarmes para acompanhar seus tanques.' 'Sondas, tableros y alarmas para supervisar sus estanques.')</p><span class="solution-link">$(T 'Conhecer OxiLife Fish' 'Conocer OxiLife Fish') <span aria-hidden="true">→</span></span></div></a>
</div></div></section>
"@
$processAside = @"
<aside class="process-aside" aria-labelledby="process-help-title"><p class="eyebrow">$(T 'PRIMEIRO CONTATO' 'PRIMER CONTACTO')</p><h3 id="process-help-title">$(T 'O que ajuda a começar?' '¿Qué ayuda a empezar?')</h3><p>$(T 'Reúna as informações da sua aplicação para conversar com a equipe.' 'Reúna la información de su aplicación para hablar con el equipo.')</p><ul class="check-list"><li>$(T 'Cidade e descrição da necessidade.' 'Ciudad y descripción de la necesidad.')</li><li>$(T 'Fotos do equipamento ou do local.' 'Fotos del equipo o del lugar.')</li><li>$(T 'Modelo, tensão e potência, quando disponíveis.' 'Modelo, tensión y potencia, cuando estén disponibles.')</li></ul><a class="btn btn-primary" href="contato.html#quote-form">$(T 'Preparar minha mensagem' 'Preparar mi mensaje') <span aria-hidden="true">→</span></a></aside>
"@
$quoteForm = @"
<form id="quote-form" aria-describedby="quote-privacy"><p class="form-required-note">$(T '* Campos obrigatórios' '* Campos obligatorios')</p>
<div class="form-row"><div class="form-field"><label for="contact-name">$(T 'Seu nome' 'Su nombre') <span class="field-required" aria-hidden="true">*</span></label><input id="contact-name" name="name" autocomplete="name" minlength="2" maxlength="80" required aria-describedby="name-error" placeholder="Como podemos chamar você?" data-pt="Como podemos chamar você?" data-es="¿Cómo podemos llamarle?" data-translate-attr="placeholder"><p class="field-error" id="name-error" hidden></p></div>
<div class="form-field"><label for="contact-city">$(T 'Cidade' 'Ciudad') <span class="field-required" aria-hidden="true">*</span></label><input id="contact-city" name="city" autocomplete="address-level2" minlength="2" maxlength="100" required aria-describedby="city-error" placeholder="Sua cidade" data-pt="Sua cidade" data-es="Su ciudad" data-translate-attr="placeholder"><p class="field-error" id="city-error" hidden></p></div></div>
<div class="form-field"><label for="contact-interest">$(T 'Tenho interesse em' 'Me interesa')</label><select id="contact-interest" name="interest"><option value="Serviços elétricos" data-pt="Serviços elétricos" data-es="Servicios eléctricos">Serviços elétricos</option><option value="Produtos" data-pt="Produtos" data-es="Productos">Produtos</option><option value="OxiLife Fish" data-pt="OxiLife Fish" data-es="OxiLife Fish">OxiLife Fish</option><option value="Manutenção" data-pt="Manutenção" data-es="Mantenimiento">Manutenção</option></select></div>
<div class="form-field"><label for="contact-message">$(T 'Como podemos ajudar?' '¿Cómo podemos ayudar?') <span class="field-required" aria-hidden="true">*</span></label><textarea id="contact-message" name="message" rows="5" minlength="10" maxlength="1500" required aria-describedby="message-help message-error" placeholder="Conte qual serviço ou equipamento você procura." data-pt="Conte qual serviço ou equipamento você procura." data-es="Cuéntenos qué servicio o equipo necesita." data-translate-attr="placeholder"></textarea><div class="field-meta"><p id="message-help">$(T 'Descreva sua necessidade com pelo menos 10 caracteres.' 'Describa su necesidad con al menos 10 caracteres.')</p><span id="message-count" aria-hidden="true">0 / 1500</span></div><p class="field-error" id="message-error" hidden></p></div>
<button class="btn btn-primary" type="submit" disabled>$(Icon 'whatsapp') $(T 'Preparar mensagem no WhatsApp' 'Preparar mensaje en WhatsApp') <span aria-hidden="true">↗</span></button>
<p id="quote-privacy" class="form-note">$(T 'Os dados não são armazenados neste site. Você revisa e confirma o envio no WhatsApp.' 'Los datos no se almacenan en este sitio. Usted revisa y confirma el envío en WhatsApp.')</p><p id="form-status" role="status" aria-live="polite" aria-atomic="true"></p><a id="prepared-message" class="btn btn-outline prepared-message" target="_blank" rel="noopener noreferrer" hidden>$(T 'Abrir mensagem preparada' 'Abrir mensaje preparado') <span aria-hidden="true">↗</span></a><noscript><p>$(T 'Para solicitar um orçamento, use o link direto do WhatsApp nesta página.' 'Para solicitar un presupuesto, use el enlace directo de WhatsApp de esta página.')</p></noscript></form>
"@
for ($index=0; $index -lt $pages.Count; $index++) {
  $name=$pages[$index]
  $path=Join-Path $projectRoot ('assets/'+$name)
  $html=[IO.File]::ReadAllText($path)
  if ($html.Contains('solution-paths') -or $html.Contains('intro-layout')) { throw 'Esta transformação já foi aplicada.' }
  $html=[regex]::Replace($html,'<body id="topo" class="[^"]*">','<body id="topo" class="'+$classes[$index]+'">')
  # Hierarquia semântica: cada conjunto tem um título antes dos itens.
  $html=[regex]::Replace($html,'(?s)(<div class="product-body">.*?)<h2>(.*?)</h2>','$1<h3>$2</h3>')
  $html=[regex]::Replace($html,'(?s)<div class="steps-grid([^"]*)">(.*?)</div>',[Text.RegularExpressions.MatchEvaluator]{param($m) '<ol class="steps-grid'+$m.Groups[1].Value+'">'+$m.Groups[2].Value.Replace('<article class="step">','<li class="step">').Replace('</article>','</li>').Replace('<span class="step-num">','<span class="step-num" aria-hidden="true">')+'</ol>'})
  $html=[regex]::Replace($html,'<p><span data-pt="" data-es=""></span></p>','')
  $html=$html.Replace('<a class="footer-name" href="index.html">ELETROTECH<span>MARECHAL</span></a>','<a class="footer-brand" href="index.html" aria-label="Página inicial — Eletrotech Marechal" data-pt="Página inicial — Eletrotech Marechal" data-es="Página de inicio — Eletrotech Marechal" data-translate-attr="aria-label"><img src="../images/logo-eletrotech-marechal-otimizada.png" alt="Eletrotech Marechal" width="333" height="96" loading="lazy" decoding="async"></a>')
  # Cabeçalho e busca permanecem iguais em todas as páginas.
  $html=$html.Replace('Atendimento rápido','Fale sobre seu projeto').Replace('Atención rápida','Hable de su proyecto')
  if ($name -eq 'index.html') {
    $strip=[regex]::Match($html,'(?s)<div class="sector-strip">.*?</div></div>').Value
    $html=$html.Replace($strip,$strip+$paths)
  }
  if ($name -in @('servicos.html','produtos.html','como-trabalhamos.html')) {
    $intro=[regex]::Match($html,'(?s)<section class="page-intro"><div class="wrap">(.*?)</div></section>')
    $caption=''; $image=''
    if ($name -eq 'servicos.html') { $image=Photo 'painel-eletrico-2.jpeg' 'Montagem real de painel elétrico Eletrotech' 'Montaje real de tablero eléctrico Eletrotech'; $caption=T 'Do projeto à instalação.' 'Del proyecto a la instalación.' }
    if ($name -eq 'produtos.html') { $image=Photo 'materiais-paineis-1.jpeg' 'Materiais para montagem de painéis elétricos' 'Materiales para montaje de tableros eléctricos'; $caption=T 'Equipamentos e materiais para sua aplicação.' 'Equipos y materiales para su aplicación.' }
    if ($name -eq 'como-trabalhamos.html') { $image=Photo 'painel-sonda-campo.jpeg' 'Painel instalado em campo' 'Tablero instalado en campo'; $caption=T 'Da avaliação ao acompanhamento.' 'De la evaluación al seguimiento.' }
    $html=$html.Replace($intro.Value,'<section class="page-intro"><div class="wrap intro-layout"><div class="intro-content">'+$intro.Groups[1].Value+'</div><figure class="intro-visual">'+$image+'<figcaption>'+$caption+'</figcaption></figure></div></section>')
  }
  if ($name -in @('index.html','servicos.html')) {
    $script:serviceIndex=0
    $html=[regex]::Replace($html,'<div class="card-top"><span class="number">([0-9]+)</span>',[Text.RegularExpressions.MatchEvaluator]{param($m) $icon=Icon $serviceIcons[$script:serviceIndex]; $script:serviceIndex++; '<div class="card-top"><span class="service-symbol">'+$icon+'</span><span class="number" aria-hidden="true">'+$m.Groups[1].Value+'</span>'})
  }
  if ($name -eq 'servicos.html') {
    $heading='<div class="section-heading"><div><p class="eyebrow">'+(T 'NOSSAS ESPECIALIDADES' 'NUESTRAS ESPECIALIDADES')+'</p><h2>'+(T 'Um serviço para cada necessidade.' 'Un servicio para cada necesidad.')+'</h2></div><p>'+(T 'Conheça as aplicações e converse com a equipe sobre o seu projeto.' 'Conozca las aplicaciones y hable con el equipo sobre su proyecto.')+'</p></div>'
    $html=$html.Replace('<div class="wrap"><div class="service-grid">','<div class="wrap">'+$heading+'<div class="service-grid">')
  }
  if ($name -eq 'produtos.html') {
    $html=$html.Replace('<div class="wrap"><div class="catalog-controls"','<div class="wrap"><h2 class="visually-hidden" id="catalog-title">'+(T 'Catálogo de equipamentos e materiais' 'Catálogo de equipos y materiales')+'</h2><div class="catalog-controls"')
    $counts=@{todos=6;motores=1;materiais=1;zagonel=1;oxilife=3}
    $html=[regex]::Replace($html,'(?s)(<button[^>]*data-filter="([^"]+)"[^>]*>.*?)(</button>)',[Text.RegularExpressions.MatchEvaluator]{param($m) $m.Groups[1].Value+'<span class="filter-count" aria-hidden="true">'+$counts[$m.Groups[2].Value]+'</span>'+$m.Groups[3].Value})
  }
  if ($name -eq 'como-trabalhamos.html') {
    $steps=[regex]::Match($html,'(?s)<ol class="steps-grid process-steps">.*?</ol>').Value
    $heading='<div class="section-heading"><div><p class="eyebrow">'+(T 'NOSSO PROCESSO' 'NUESTRO PROCESO')+'</p><h2>'+(T 'Quatro etapas. Um projeto acompanhado.' 'Cuatro etapas. Un proyecto acompañado.')+'</h2></div></div>'
    $html=$html.Replace($steps,$heading+'<div class="process-layout">'+$steps+$processAside+'</div>')
  }
  if ($name -eq 'oxilife-fish.html') {
    $html=$html.Replace('<div class="hero-copy"><p class="eyebrow light">','<div class="hero-copy"><nav class="breadcrumb breadcrumb-light" aria-label="Caminho da página" data-pt="Caminho da página" data-es="Ruta de la página" data-translate-attr="aria-label"><a href="index.html">'+(T 'Início' 'Inicio')+'</a><span aria-hidden="true">/</span><span aria-current="page">OxiLife Fish</span></nav><p class="eyebrow light">')
  }
  if ($name -eq 'contato.html') {
    $html=$html.Replace('<section class="page-intro">','<section class="page-intro intro-compact">').Replace('<div class="wrap contact-grid"><div>','<div class="wrap contact-grid"><div class="contact-channels">')
    $html=[regex]::Replace($html,'(?s)<form id="quote-form">.*?</form>',$quoteForm)
    $html=$html.Replace('<div class="contact-form-panel"><p','<div class="contact-form-panel" aria-labelledby="quote-title"><p').Replace('<h2><span data-pt="O que','<h2 id="quote-title"><span data-pt="O que')
    $contactIcons=@('whatsapp','envelope','instagram'); $script:contactIndex=0
    $html=[regex]::Replace($html,'(<div class="contact-cards">)?(<a[^>]*>)(<span>0[123] / [^<]+</span>)',[Text.RegularExpressions.MatchEvaluator]{param($m) $icon=Icon $contactIcons[$script:contactIndex]; $script:contactIndex++; $m.Groups[1].Value+$m.Groups[2].Value+'<span class="contact-card-icon">'+$icon+'</span>'+$m.Groups[3].Value})
  }
  # As fotos novas preservam suas dimensões; os arquivos originais não são alterados.
  Add-Type -AssemblyName System.Drawing
  $html=[regex]::Replace($html,'<img[^>]*src="\.\./images/([^"]+)"[^>]*>',[Text.RegularExpressions.MatchEvaluator]{param($m) if ($m.Value.Contains(' width=')) { return $m.Value }; $photo=[Drawing.Image]::FromFile((Join-Path $projectRoot ('images/'+$m.Groups[1].Value))); $size=' width="'+$photo.Width+'" height="'+$photo.Height+'"'; $photo.Dispose(); $m.Value.TrimEnd('>')+$size+'>'})
  [IO.File]::WriteAllText($path,$html,$utf8)
}
Write-Output 'Composição das seis páginas, conteúdo, ícones e formulário atualizados.'
