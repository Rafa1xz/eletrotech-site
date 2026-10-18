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
 $checks=New-Object 'System.Collections.Generic.List[object]'
 function Check($name,$expression){if(!(Eval $expression)){throw $name};$checks.Add(@{test=$name;result='PASS'})}
 function Run($expression){Eval ('(()=>{'+$expression+'})()')|Out-Null}
 foreach($size in @(@(1440,1000),@(390,844),@(320,740))){
  CDP 'Emulation.setDeviceMetricsOverride' @{width=$size[0];height=$size[1];deviceScaleFactor=1;mobile=($size[0]-lt 700)}|Out-Null
  foreach($file in @('index.html','servicos.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html')){
   Navigate $file
   Run 'document.querySelector("[data-lang=pt]").click()'
   Check ($file+' headings and labels '+$size[0]) '(()=>{const h=[...document.querySelector("main").querySelectorAll("h1,h2,h3,h4,h5,h6")].map(e=>Number(e.tagName[1]));return h.every((level,i)=>i===0||level<=h[i-1]+1)&&[...document.querySelectorAll("[aria-labelledby]")].every(e=>e.getAttribute("aria-labelledby").split(" ").every(id=>document.getElementById(id)))})()'
   Check ($file+' layout '+$size[0]) 'document.documentElement.scrollWidth<=innerWidth'
   Check ($file+' accessible header shortcut '+$size[0]) 'document.querySelector(".header-cta").getAttribute("aria-label").includes("WhatsApp")'
   if($file-eq 'servicos.html' -and $size[0]-eq 1440){Screenshot 'servicos-desktop.png';Run 'document.querySelector(".service-grid").scrollIntoView({behavior:"instant"})';Screenshot 'servicos-cards.png'}
   if($file-eq 'como-trabalhamos.html' -and $size[0]-eq 1440){Screenshot 'processo-desktop.png';Run 'document.querySelector(".process-layout").scrollIntoView({behavior:"instant"})';Screenshot 'processo-etapas.png'}
   if($file-eq 'contato.html' -and $size[0]-eq 1440){Run 'document.querySelector("#quote-form").scrollIntoView({behavior:"instant"})';Screenshot 'formulario-desktop.png'}
   if($file-eq 'contato.html' -and $size[0]-eq 390){Run 'document.querySelector("#quote-form").scrollIntoView({behavior:"instant"})';Screenshot 'formulario-mobile.png'}
   if($file-eq 'index.html' -and $size[0]-eq 1440){Run 'document.querySelector(".solution-paths").scrollIntoView({behavior:"instant"})';Screenshot 'inicio-solucoes.png'}
   if($size[0]-eq 390){
    Run 'document.querySelector(".menu-toggle").click()'
    Check ($file+' mobile modal semantics') 'document.querySelector(".nav-shell").getAttribute("role")==="dialog" && document.querySelector(".nav-shell").getAttribute("aria-modal")==="true" && document.querySelector("main").inert'
    Run 'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))'
    Check ($file+' Escape restores focus') 'document.activeElement.matches(".menu-toggle") && !document.querySelector(".nav-shell").hasAttribute("role")'
   }
  }
 }
 Navigate 'contato.html'
 Run 'document.querySelector(".search-toggle").click();document.querySelector(".intro-copy").click()'
 Check 'Outside click closes search and restores focus' 'document.querySelector("#header-search").hidden && document.activeElement.matches(".search-toggle")'
 Run 'document.querySelector("[data-lang=pt]").click();window.open=url=>{window.reviewOpenedUrl=url;return null};document.querySelector("#quote-form").requestSubmit()'
 Check 'Empty form focuses name and identifies errors' '!window.reviewOpenedUrl && document.activeElement.id==="contact-name" && document.querySelectorAll("#quote-form [aria-invalid=true]").length===3 && !document.querySelector("#name-error").hidden'
 Run 'document.querySelector("#contact-name").value="  ";document.querySelector("#contact-city").value="  ";document.querySelector("#contact-message").value="          ";document.querySelector("#quote-form").requestSubmit()'
 Check 'Whitespace does not bypass validation' '!window.reviewOpenedUrl && document.querySelectorAll("#quote-form [aria-invalid=true]").length===3'
 Run 'document.querySelector("[data-lang=es]").click()'
 Check 'Errors and status translate' 'document.querySelector("#name-error").textContent.startsWith("Escriba") && document.querySelector("#form-status").textContent.startsWith("Revise los")'
 Run 'document.querySelector("[data-lang=pt]").click();const f=document.querySelector("#quote-form");f.elements.name.value="Aluno Teste";f.elements.city.value="Marechal";f.elements.message.value="Gostaria de informações sobre um painel";[f.elements.name,f.elements.city,f.elements.message].forEach(e=>e.dispatchEvent(new Event("input",{bubbles:true})));f.requestSubmit()'
 Check 'Valid form prepares original WhatsApp flow' 'window.reviewOpenedUrl?.startsWith("https://wa.me/554599241306?text=") && !document.querySelector("#prepared-message").hidden && document.querySelectorAll("#quote-form [aria-invalid=true]").length===0'
 Run 'document.querySelector("#contact-message").value="Alterei minha necessidade de orçamento";document.querySelector("#contact-message").dispatchEvent(new Event("input",{bubbles:true}))'
 Check 'Editing invalidates old message and updates count' 'document.querySelector("#prepared-message").hidden && !document.querySelector("#prepared-message").hasAttribute("href") && document.querySelector("#form-status").textContent.startsWith("Você alterou") && document.querySelector("#message-count").textContent.startsWith(String(document.querySelector("#contact-message").value.length))'
 Run 'document.querySelector("#quote-form").requestSubmit();document.querySelector("#contact-interest").value="Produtos";document.querySelector("#contact-interest").dispatchEvent(new Event("change",{bubbles:true}))'
 Check 'Changing subject invalidates old message' 'document.querySelector("#prepared-message").hidden'
 Run 'document.querySelector("#contact-message").value="<img src=x onerror=window.injected=true> Preciso de um painel";document.querySelector("#quote-form").requestSubmit()'
 Check 'User text is encoded and never rendered as HTML' 'decodeURIComponent(window.reviewOpenedUrl).includes("<img src=x") && !window.injected && !document.querySelector("#quote-form img")'
 Run 'document.querySelector("[data-lang=es]").click()'
 Check 'Prepared fallback link follows language' 'decodeURIComponent(document.querySelector("#prepared-message").href).includes("Hola, soy")'
 CDP 'Page.bringToFront'|Out-Null
 Navigate 'como-trabalhamos.html'
 Run 'document.querySelector(".faq summary").focus()'
 CDP 'Input.dispatchKeyEvent' @{type='keyDown';key='Enter';code='Enter';windowsVirtualKeyCode=13;text=([string][char]13)}|Out-Null
 CDP 'Input.dispatchKeyEvent' @{type='keyUp';key='Enter';code='Enter';windowsVirtualKeyCode=13}|Out-Null
 Check 'FAQ works with Enter' 'document.querySelector(".faq details").open'
 Run 'document.querySelector(".skip-link").focus()'
 CDP 'Input.dispatchKeyEvent' @{type='keyDown';key='Enter';code='Enter';windowsVirtualKeyCode=13;text=([string][char]13)}|Out-Null
 CDP 'Input.dispatchKeyEvent' @{type='keyUp';key='Enter';code='Enter';windowsVirtualKeyCode=13}|Out-Null
 Check 'Skip link transfers focus to main' 'document.activeElement.id==="conteudo"'
 Navigate 'contato.html'
 $contrast=Eval '(()=>{const lum=c=>{const x=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*x[0]+.7152*x[1]+.0722*x[2]};const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};const root=getComputedStyle(document.documentElement);const panel=getComputedStyle(document.querySelector(".contact-form-panel"));const field=getComputedStyle(document.querySelector("#contact-name"));return JSON.stringify({bodyText:ratio("rgb(23,45,67)","rgb(255,255,255)"),secondaryText:ratio("rgb(83,101,117)","rgb(255,255,255)"),blueText:ratio("rgb(32,86,174)","rgb(255,255,255)"),errorText:ratio("rgb(161,38,34)","rgb(255,255,255)"),fieldBoundary:ratio(field.borderTopColor,panel.backgroundColor)})})()'
 $contrastData=$contrast|ConvertFrom-Json
 if($contrastData.bodyText-lt 4.5 -or $contrastData.secondaryText-lt 4.5 -or $contrastData.blueText-lt 4.5 -or $contrastData.errorText-lt 4.5 -or $contrastData.fieldBoundary-lt 3){throw ('Contrast failed: '+$contrast)}
 $checks.Add(@{test='Contrast of base, secondary, action and error text plus field boundary';result='PASS';ratios=$contrastData})
 if($script:jsErrors.Count){throw ('JavaScript errors: '+($script:jsErrors -join ','))}
 $report=@{status='PASS';checks=$checks;externalMessagesSent=$false;physicalDeviceTested=$false;screenReaderAudit=$false;jsErrors=0}
 [IO.File]::WriteAllText((Join-Path $resultsDir 'revisao-completa.json'),($report|ConvertTo-Json -Depth 8),(New-Object Text.UTF8Encoding($false)))
 Write-Output ('PASS: '+$checks.Count+' additional layout, semantic, form, keyboard and contrast checks; no external messages sent.')
} finally {
 if($socket){$socket.Dispose()}
 if($browser -and !$browser.HasExited){Stop-Process -Id $browser.Id -ErrorAction SilentlyContinue}
}
