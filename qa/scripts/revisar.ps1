$ErrorActionPreference='Stop'
$root=(Get-Location).Path
$qa=Join-Path $root 'qa'
$screenshotsDir=Join-Path $qa 'screenshots'
$resultsDir=Join-Path $qa 'results'
$tempDir=Join-Path $qa 'temp'
foreach($dir in @($screenshotsDir,$resultsDir,$tempDir)){New-Item -ItemType Directory -Path $dir -Force | Out-Null}
$profile=Join-Path $tempDir 'edge-profile'
$browser=Start-Process -FilePath 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9224',('--user-data-dir="'+$profile+'"'),'about:blank') -WindowStyle Hidden -PassThru
$socket=$null
try {
 $tabs=$null
 for($attempt=0;$attempt -lt 30;$attempt++){try{$tabs=Invoke-RestMethod 'http://127.0.0.1:9224/json/list';break}catch{Start-Sleep -Milliseconds 300}}
 if(!$tabs){throw 'Edge não iniciou o protocolo de testes.'}
 $tab=$tabs|Where-Object{$_.type-eq 'page'}|Select-Object -First 1
 $socket=New-Object Net.WebSockets.ClientWebSocket
 $socket.ConnectAsync([Uri]$tab.webSocketDebuggerUrl,[Threading.CancellationToken]::None).Wait()
 $script:sequence=0
 $script:jsErrors=New-Object 'System.Collections.Generic.List[string]'
 function CDP($method,$params=@{}){
  $script:sequence++
  $id=$script:sequence
  $json=@{id=$id;method=$method;params=$params}|ConvertTo-Json -Depth 20 -Compress
  $bytes=[Text.Encoding]::UTF8.GetBytes($json)
  $socket.SendAsync((New-Object 'System.ArraySegment[byte]' -ArgumentList (,$bytes)),[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).Wait()
  while($true){
   $buffer=New-Object byte[] 1048576
   $stream=New-Object IO.MemoryStream
   do{
    $received=$socket.ReceiveAsync((New-Object 'System.ArraySegment[byte]' -ArgumentList (,$buffer)),[Threading.CancellationToken]::None).Result
    $stream.Write($buffer,0,$received.Count)
   }while(!$received.EndOfMessage)
   $response=[Text.Encoding]::UTF8.GetString($stream.ToArray())|ConvertFrom-Json
   $stream.Dispose()
   if($response.method-eq 'Runtime.exceptionThrown'){$script:jsErrors.Add(($response.params|ConvertTo-Json -Depth 8 -Compress))}
   if($response.id-eq $id){if($response.error){throw ($response.error|ConvertTo-Json -Compress)};return $response.result}
  }
 }
 function Eval($expression){
  $r=CDP 'Runtime.evaluate' @{expression=$expression;returnByValue=$true;awaitPromise=$true}
  if($r.exceptionDetails){throw ($r.exceptionDetails|ConvertTo-Json -Depth 8 -Compress)}
  return $r.result.value
 }
 function Navigate($file){
  $parts=$file -split '\?',2; $uri=New-Object Uri (Join-Path $root $parts[0]); $url=$uri.AbsoluteUri; if($parts.Length -gt 1){$url+='?'+$parts[1]}
  CDP 'Page.navigate' @{url=$url}|Out-Null
  for($i=0;$i-lt 30;$i++){
   Start-Sleep -Milliseconds 100
   if((Eval 'document.readyState')-eq 'complete'){break}
  }
 }
 function Screenshot($name){
  Eval 'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(resolve,300))))'|Out-Null
  $r=CDP 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
  [IO.File]::WriteAllBytes((Join-Path $screenshotsDir $name),[Convert]::FromBase64String($r.data))
 }
 CDP 'Page.enable'|Out-Null
 CDP 'Runtime.enable'|Out-Null
 $results=New-Object 'System.Collections.Generic.List[object]'
 foreach($size in @(@(1440,1000),@(1280,900),@(1040,900),@(1024,768),@(768,1024),@(390,844),@(320,740))){
  CDP 'Emulation.setDeviceMetricsOverride' @{width=$size[0];height=$size[1];deviceScaleFactor=1;mobile=($size[0]-lt 700)}|Out-Null
  foreach($file in @('index.html','servicos.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html')){
   Navigate $file
   $check=Eval 'JSON.stringify({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll("h1").length,brokenImages:[...document.images].filter(i=>i.loading!=="lazy"&&(!i.complete||!i.naturalWidth)).length,enhanced:document.body.classList.contains("enhanced"),title:document.title})'
   $data=$check|ConvertFrom-Json
   if($data.scrollWidth-gt $data.width){throw ($file+': overflow em '+$size[0]+'px: '+$data.scrollWidth)}
   if($data.h1-ne 1 -or $data.brokenImages-gt 0 -or !$data.enhanced){throw ($file+': falha de carregamento')}
   $results.Add(@{page=$file;viewport=$size[0];result='PASS'})
   if($size[0]-eq 1440 -and $file-eq 'index.html'){Screenshot 'inicio-desktop.png'}
   if($size[0]-eq 390 -and $file-eq 'index.html'){Screenshot 'inicio-mobile.png'}
   if($size[0]-eq 1440 -and $file-eq 'oxilife-fish.html'){Screenshot 'oxilife-desktop.png'}
   if($size[0]-eq 390 -and $file-eq 'contato.html'){Screenshot 'contato-mobile.png'}
   $semantics=Eval 'JSON.stringify({duplicateIds:[...document.querySelectorAll("[id]")].map(e=>e.id).filter((id,i,ids)=>ids.indexOf(id)!==i),unnamedControls:[...document.querySelectorAll("button,input:not([type=hidden]),select,textarea")].filter(e=>!e.textContent.trim()&&!e.getAttribute("aria-label")&&!e.getAttribute("aria-labelledby")&&!e.labels?.length).map(e=>e.id||e.className),missingTargets:[...document.querySelectorAll("[aria-controls]")].filter(e=>!document.getElementById(e.getAttribute("aria-controls"))).length})'
   $semanticData=$semantics|ConvertFrom-Json
   if($semanticData.duplicateIds.Count -or $semanticData.unnamedControls.Count -or $semanticData.missingTargets){throw ($file+': semântica de controles inválida: '+$semantics)}
  }
 }
 CDP 'Emulation.setDeviceMetricsOverride' @{width=1280;height=900;deviceScaleFactor=1;mobile=$false}|Out-Null
 Navigate 'index.html'
 Eval 'new Promise(resolve=>setTimeout(resolve,3200))'|Out-Null
 if(!(Eval 'document.querySelector(".floating-contact").classList.contains("is-expanded") && document.querySelector(".ww-float-whatsapp__typed").textContent==="Entre em contato" && getComputedStyle(document.querySelector(".floating-contact")).width==="205px"')){throw 'Ciclo digitado do WhatsApp falhou no desktop'}
 CDP 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=1;mobile=$true}|Out-Null
 Navigate 'index.html'
 Eval 'new Promise(resolve=>setTimeout(resolve,3200))'|Out-Null
 if(!(Eval 'document.querySelector(".floating-contact").classList.contains("is-expanded") && document.querySelector(".ww-float-whatsapp__typed").textContent==="Entre em contato" && getComputedStyle(document.querySelector(".floating-contact")).width==="184px" && document.documentElement.scrollWidth<=innerWidth')){throw 'Ciclo digitado do WhatsApp falhou no mobile'}
 $results.Add(@{test='WhatsApp flutuante: expansão e digitação no desktop e mobile';result='PASS'})
 Navigate 'produtos.html?categoria=oxilife'
 $count=Eval '[...document.querySelectorAll(".product-card")].filter(c=>!c.hidden).length'
 if($count-ne 3){throw 'Filtro OxiLife falhou'}
 Eval 'document.querySelector("[data-filter=todos]").click();document.querySelector("#product-search").value="hercules";document.querySelector("#product-search").dispatchEvent(new Event("input"))'|Out-Null
 if((Eval '[...document.querySelectorAll(".product-card")].filter(c=>!c.hidden).length')-ne 1){throw 'Busca sem acento falhou'}
 Eval 'document.querySelector("#product-search").value="zzzzz";document.querySelector("#product-search").dispatchEvent(new Event("input"))'|Out-Null
 if((Eval 'document.querySelector("#no-results").hidden')-ne $false){throw 'Estado vazio falhou'}
 Eval 'document.querySelector("#clear-filters").click();document.querySelector("[data-lang=es]").click()'|Out-Null
 if((Eval 'document.documentElement.lang')-ne 'es'){throw 'Idioma espanhol falhou'}
 if((Eval 'document.querySelector("#catalog-status").textContent')-ne '6 productos encontrados'){throw 'Contagem traduzida falhou'}
 if((Eval 'document.querySelectorAll("[data-pt][data-es]").length')-lt 20){throw 'Traduções ausentes'}
 Eval 'document.querySelector(".menu-toggle").click()'|Out-Null
 if((Eval 'document.querySelector(".menu-toggle").getAttribute("aria-expanded")')-ne 'true'){throw 'Menu não abriu'}
 Eval 'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))'|Out-Null
 if((Eval 'document.querySelector(".menu-toggle").getAttribute("aria-expanded")')-ne 'false'){throw 'Escape falhou'}
 Navigate 'contato.html'
 Eval 'document.querySelector("[data-lang=pt]").click();window.open=(url)=>{window.qaOpenedUrl=url;return null};document.querySelector("#contact-name").value="Cliente Teste";document.querySelector("#contact-city").value="Marechal";document.querySelector("#contact-message").value="Quero orçamento de um painel elétrico";document.querySelector("#quote-form").requestSubmit()'|Out-Null
 $url=Eval 'window.qaOpenedUrl'
 if(!$url -or !$url.StartsWith('https://wa.me/554599241306?text=')){throw 'Mensagem WhatsApp falhou'}
 if((Eval 'document.querySelector("#prepared-message").hidden')-ne $false){throw 'Link alternativo ausente'}
 $results.Add(@{test='Filtros, busca sem acento, estado vazio, limpar filtros, espanhol, menu, Escape e formulário sem envio externo';result='PASS'})
 CDP 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=1;mobile=$true}|Out-Null
 Navigate 'index.html'
 Eval 'document.querySelector("[data-lang=pt]").click();document.querySelector(".menu-toggle").click()'|Out-Null
 if(!(Eval 'document.querySelector("main").inert && !document.querySelector(".menu-backdrop").hidden && getComputedStyle(document.body).overflow === "hidden"')){throw 'Menu não isolou o conteúdo ou bloqueou rolagem'}
 Eval 'document.querySelector(".brand").focus();document.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",shiftKey:true,bubbles:true,cancelable:true}))'|Out-Null
 if(!(Eval 'document.activeElement.matches(".language-toggle")')){throw 'Foco não permaneceu no cabeçalho ao voltar'}
 Eval 'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true,cancelable:true}))'|Out-Null
 if(!(Eval 'document.activeElement.matches(".brand")')){throw 'Foco não permaneceu no cabeçalho ao avançar'}
 Screenshot 'menu-mobile.png'
 Eval 'document.querySelector(".menu-backdrop").click()'|Out-Null
 if(!(Eval 'document.activeElement.matches(".menu-toggle") && !document.querySelector("main").inert && !document.body.classList.contains("menu-open")')){throw 'Fechamento do menu não restaurou foco/conteúdo'}
 Eval 'document.querySelector(".search-toggle").click()'|Out-Null
 if(!(Eval 'document.activeElement.id === "site-search" && !document.querySelector("#header-search").hidden')){throw 'Busca não abriu com foco no campo'}
 Screenshot 'busca-mobile.png'
 Eval 'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}))'|Out-Null
 if(!(Eval 'document.querySelector("#header-search").hidden && document.activeElement.matches(".search-toggle")')){throw 'Escape na busca não restaurou foco'}
 Eval 'document.querySelector(".search-toggle").click();document.querySelector("#site-search").value="hercules";document.querySelector("#header-search form").requestSubmit()'|Out-Null
 Start-Sleep -Milliseconds 400
 if(!(Eval 'location.pathname.endsWith("produtos.html") && new URLSearchParams(location.search).get("q")==="hercules" && document.querySelectorAll(".product-card:not([hidden])").length===1')){throw 'Busca do cabeçalho não chegou ao catálogo filtrado'}
 Eval 'document.querySelector("[data-lang=es]").click()'|Out-Null
 if(!(Eval 'document.querySelectorAll(".product-card:not([hidden])").length===1')){throw 'Troca de idioma perdeu a busca em português'}
 Eval 'document.querySelector("[data-clear-filters]").click()'|Out-Null
 if(!(Eval 'document.querySelectorAll(".product-card:not([hidden])").length===6 && !new URLSearchParams(location.search).has("q") && document.activeElement.id==="product-search"')){throw 'Limpeza dos filtros não restaurou catálogo e foco'}
 Eval 'document.querySelector("#product-search").value="OxiLife Fish";document.querySelector("#product-search").dispatchEvent(new Event("input"))'|Out-Null
 if((Eval 'document.querySelectorAll(".product-card:not([hidden])").length')-ne 3){throw 'Busca de OxiLife não retornou toda a linha'}
 Eval 'document.querySelector("#product-search").value="hercules motor";document.querySelector("#product-search").dispatchEvent(new Event("input"))'|Out-Null
 if((Eval 'document.querySelectorAll(".product-card:not([hidden])").length')-ne 1){throw 'Busca com várias palavras fora de ordem falhou'}
 Eval 'document.querySelector("[data-clear-filters]").click()'|Out-Null
 Eval 'document.querySelector("[data-lang=pt]").click();document.activeElement.blur();window.scrollTo({top:document.querySelector(".catalog-controls").offsetTop-100,behavior:"instant"})'|Out-Null
 Screenshot 'catalogo-mobile.png'
 Eval 'document.querySelector(".site-footer").scrollIntoView({behavior:"instant"})'|Out-Null
 Screenshot 'rodape-mobile.png'
 CDP 'Emulation.setDeviceMetricsOverride' @{width=844;height=390;deviceScaleFactor=1;mobile=$true}|Out-Null
 Navigate 'index.html'
 Eval 'document.querySelector(".menu-toggle").click()'|Out-Null
 if(!(Eval 'getComputedStyle(document.querySelector("#main-nav")).overflowY==="auto" && document.querySelector("#main-nav").scrollHeight>document.querySelector("#main-nav").clientHeight')){throw 'Menu em tela baixa não permite rolagem'}
 Eval 'document.querySelector("#main-nav").scrollTop=9999'|Out-Null
 Screenshot 'menu-paisagem.png'
 CDP 'Emulation.setDeviceMetricsOverride' @{width=1280;height=900;deviceScaleFactor=1;mobile=$false}|Out-Null
 Eval 'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))'|Out-Null
 if(!(Eval '!document.querySelector("main").inert && !document.body.classList.contains("menu-open") && !document.querySelector("#main-nav").inert')){throw 'Mudança para desktop manteve bloqueio do menu'}
 CDP 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}|Out-Null
 if(!(Eval 'getComputedStyle(document.querySelector(".menu-icon span")).transitionDuration==="0s" && getComputedStyle(document.documentElement).scrollBehavior==="auto"')){throw 'Preferência por movimento reduzido ignorada'}
 CDP 'Emulation.setEmulatedMedia' @{features=@()}|Out-Null
 $results.Add(@{test='Busca do cabeçalho; consulta via URL; filtro entre idiomas; limpar filtros e foco; menu com isolamento, ciclo de foco, backdrop, rolagem em paisagem e retorno ao desktop; movimento reduzido';result='PASS'})
 foreach($size in @(@(1440,1000),@(390,844),@(320,740))){
  CDP 'Emulation.setDeviceMetricsOverride' @{width=$size[0];height=$size[1];deviceScaleFactor=1;mobile=($size[0]-lt 700)}|Out-Null
  foreach($file in @('index.html','servicos.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html')){
   Navigate $file
   Eval 'document.querySelector("[data-lang=es]").click()'|Out-Null
   $translated=Eval '[...document.querySelectorAll("[data-es]")].every(e=>(e.dataset.translateAttr?e.getAttribute(e.dataset.translateAttr):e.textContent)===e.dataset.es)'
   if(!$translated){throw ($file+': tradução incompleta')}
   if(!(Eval 'document.documentElement.scrollWidth<=innerWidth')){throw ($file+': overflow em espanhol '+$size[0])}
   Eval 'Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>null)}))'|Out-Null
   if((Eval '[...document.images].filter(i=>!i.naturalWidth).length')-ne 0){throw ($file+': imagem quebrada')}
   $results.Add(@{page=$file;viewport=$size[0];language='es';result='PASS'})
  }
 }
 CDP 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1000;deviceScaleFactor=1;mobile=$false}|Out-Null
 Navigate 'produtos.html'
 Eval 'document.querySelector("[data-lang=pt]").click();document.querySelector(".catalog-controls").scrollIntoView({behavior:"instant"})'|Out-Null
 Screenshot 'catalogo-desktop.png'
 Navigate 'index.html'
 Eval 'document.querySelector("[data-lang=pt]").click();document.querySelector(".cta-section").scrollIntoView({behavior:"instant"})'|Out-Null
 Screenshot 'rodape-desktop.png'
 CDP 'Emulation.setScriptExecutionDisabled' @{value=$true}|Out-Null
 Navigate 'index.html'
 if((Eval 'getComputedStyle(document.querySelector("#main-nav")).display')-eq 'none'){throw 'Navegação sem JS falhou'}
 Navigate 'produtos.html'
 if((Eval 'document.querySelectorAll(".product-card:not([hidden])").length')-ne 6){throw 'Catálogo sem JS falhou'}
 Navigate 'contato.html'
 if(!(Eval 'document.querySelector("#quote-form button[type=submit]").disabled')){throw 'Formulário sem JS não protegido'}
 CDP 'Emulation.setScriptExecutionDisabled' @{value=$false}|Out-Null
 $results.Add(@{test='Navegação e catálogo sem JavaScript; formulário sem submissão involuntária';result='PASS'})
 $blockStorage=CDP 'Page.addScriptToEvaluateOnNewDocument' @{source='Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage blocked for QA")}})'}
 Navigate 'index.html'
 if(!(Eval 'document.body.classList.contains("enhanced")')){throw 'Armazenamento bloqueado afetou o site'}
 Eval 'document.querySelector("[data-lang=es]").click()'|Out-Null
 if((Eval 'document.documentElement.lang')-ne 'es'){throw 'Idioma com armazenamento bloqueado falhou'}
 CDP 'Page.removeScriptToEvaluateOnNewDocument' @{identifier=$blockStorage.identifier}|Out-Null
 $results.Add(@{test='Idioma e scripts com armazenamento local bloqueado';result='PASS'})
 Navigate 'index.html'
 Eval 'location.hash="servicos";location.reload()'|Out-Null
 Start-Sleep -Milliseconds 500
 if(!(Eval 'location.pathname.endsWith("/servicos.html")')){throw 'Link legado falhou'}
 $results.Add(@{test='Redirecionamento de link antigo';result='PASS'})
 if($script:jsErrors.Count){throw ('Erros JavaScript: '+($script:jsErrors -join ','))}
 $report=@{status='PASS';results=$results;screenshots=@('inicio-desktop.png','inicio-mobile.png','oxilife-desktop.png','contato-mobile.png','catalogo-desktop.png','catalogo-mobile.png','rodape-desktop.png','rodape-mobile.png','menu-mobile.png','busca-mobile.png','menu-paisagem.png');externalMessagesSent=$false;jsErrors=0}
 [IO.File]::WriteAllText((Join-Path $resultsDir 'resultado.json'),($report|ConvertTo-Json -Depth 8),(New-Object Text.UTF8Encoding($false)))
 Write-Output ('PASS: '+$results.Count+' verificações; sem overflow em sete larguras entre 320 e 1440px; nenhuma mensagem externa enviada.')
} finally {
 if($socket){$socket.Dispose()}
 if($browser -and !$browser.HasExited){Stop-Process -Id $browser.Id -ErrorAction SilentlyContinue}
}
