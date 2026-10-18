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
 function Key($key,$code,$vk,$text=''){
  $params=@{type='keyDown';key=$key;code=$code;windowsVirtualKeyCode=$vk}
  if($text){$params.text=$text}
  CDP 'Input.dispatchKeyEvent' $params|Out-Null
  CDP 'Input.dispatchKeyEvent' @{type='keyUp';key=$key;code=$code;windowsVirtualKeyCode=$vk}|Out-Null
 }
 foreach($width in @(1440,390,320)){
  CDP 'Emulation.setDeviceMetricsOverride' @{width=$width;height=900;deviceScaleFactor=1;mobile=($width-lt 700)}|Out-Null
  foreach($file in @('index.html','servicos.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html')){
   Navigate $file
   Run 'document.querySelector("[data-lang=pt]").click()'
   Check ($file+' fechado '+$width) 'document.querySelector(".language-options").hidden && document.querySelector(".language-toggle").getAttribute("aria-expanded")==="false" && document.querySelector("[data-current-language]").textContent==="PT" && document.documentElement.scrollWidth<=innerWidth'
   Run 'document.querySelector(".language-toggle").click()'
   Check ($file+' aberto '+$width) '(()=>{const t=document.querySelector(".language-toggle"),p=document.querySelector(".language-options"),r=p.getBoundingClientRect();return !p.hidden&&t.getAttribute("aria-expanded")==="true"&&document.activeElement.matches("[data-lang=pt]")&&r.left>=0&&r.right<=innerWidth&&t.getBoundingClientRect().height>=44})()'
   if($file-eq 'index.html'){Screenshot ('idioma-'+$width+'.png')}
   Run 'document.querySelector("[data-lang=es]").click()'
   Check ($file+' espanhol '+$width) 'document.documentElement.lang==="es" && document.querySelector(".language-options").hidden && document.activeElement.matches(".language-toggle") && document.querySelector("[data-current-language]").textContent==="ES" && document.querySelector(".language-toggle").getAttribute("aria-label").includes("Español") && document.querySelector("[data-lang=es]").getAttribute("aria-pressed")==="true" && document.querySelector("[data-lang=pt]").getAttribute("aria-pressed")==="false"'
  }
 }
 Navigate 'index.html'
 Check 'Idioma mantido ao navegar' 'document.documentElement.lang==="es" && document.querySelector("[data-current-language]").textContent==="ES"'
 CDP 'Page.bringToFront'|Out-Null
 Run 'document.querySelector(".language-toggle").focus()'
 Key 'Enter' 'Enter' 13 ([string][char]13)
 Check 'Enter abre opções e foca idioma ativo' '!document.querySelector(".language-options").hidden && document.activeElement.matches("[data-lang=es]")'
 Key 'ArrowUp' 'ArrowUp' 38
 Check 'Seta troca o foco sem aplicar idioma' 'document.activeElement.matches("[data-lang=pt]") && document.documentElement.lang==="es"'
 Key 'Enter' 'Enter' 13 ([string][char]13)
 Check 'Enter escolhe idioma e restaura foco' 'document.documentElement.lang==="pt-BR" && document.querySelector(".language-options").hidden && document.activeElement.matches(".language-toggle")'
 Key ' ' 'Space' 32 ' '
 Check 'Espaço abre opções' '!document.querySelector(".language-options").hidden'
 Key 'Escape' 'Escape' 27
 Check 'Escape fecha e restaura foco' 'document.querySelector(".language-options").hidden && document.activeElement.matches(".language-toggle")'
 Run 'document.querySelector(".language-toggle").click();document.querySelector("main").click()'
 Check 'Clique fora fecha opções' 'document.querySelector(".language-options").hidden'
 Run 'document.querySelector(".language-toggle").click();document.querySelector(".search-toggle").focus()'
 Check 'Sair pelo teclado fecha sem prender foco' 'document.querySelector(".language-options").hidden && document.activeElement.matches(".search-toggle")'
 Run 'document.querySelector(".menu-toggle").click();document.querySelector(".language-toggle").click()'
 Key 'Escape' 'Escape' 27
 Check 'Primeiro Escape fecha apenas idiomas no menu mobile' 'document.querySelector(".language-options").hidden && document.querySelector(".menu-toggle").getAttribute("aria-expanded")==="true" && document.activeElement.matches(".language-toggle")'
 Key 'Escape' 'Escape' 27
 Check 'Segundo Escape fecha menu mobile' 'document.querySelector(".menu-toggle").getAttribute("aria-expanded")==="false" && document.activeElement.matches(".menu-toggle")'
 CDP 'Emulation.setTouchEmulationEnabled' @{enabled=$true;maxTouchPoints=1}|Out-Null
 $point=(Eval 'JSON.stringify((()=>{const r=document.querySelector(".language-toggle").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})())')|ConvertFrom-Json
 CDP 'Input.dispatchTouchEvent' @{type='touchStart';touchPoints=@(@{x=$point.x;y=$point.y})}|Out-Null
 CDP 'Input.dispatchTouchEvent' @{type='touchEnd';touchPoints=@()}|Out-Null
 Check 'Toque abre seletor' '!document.querySelector(".language-options").hidden'
 $point=(Eval 'JSON.stringify((()=>{const r=document.querySelector("[data-lang=es]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})())')|ConvertFrom-Json
 CDP 'Input.dispatchTouchEvent' @{type='touchStart';touchPoints=@(@{x=$point.x;y=$point.y})}|Out-Null
 CDP 'Input.dispatchTouchEvent' @{type='touchEnd';touchPoints=@()}|Out-Null
 Check 'Toque escolhe espanhol' 'document.documentElement.lang==="es" && document.querySelector(".language-options").hidden'
 CDP 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}|Out-Null
 Check 'Movimento reduzido respeitado' 'parseFloat(getComputedStyle(document.querySelector(".language-toggle")).transitionDuration)<0.01 && parseFloat(getComputedStyle(document.querySelector(".language-chevron")).transitionDuration)<0.01'
 if($script:jsErrors.Count){throw ($script:jsErrors -join ',')}
 [IO.File]::WriteAllText((Join-Path $resultsDir 'resultado-idiomas.json'),(@{status='PASS';checks=$checks;jsErrors=0}|ConvertTo-Json -Depth 8),(New-Object Text.UTF8Encoding($false)))
 Write-Output ('PASS: '+$checks.Count+' verificações de idioma, teclado, toque e responsividade.')
} finally {
 if($socket){$socket.Dispose()}
 if($browser -and !$browser.HasExited){Stop-Process -Id $browser.Id -ErrorAction SilentlyContinue}
}