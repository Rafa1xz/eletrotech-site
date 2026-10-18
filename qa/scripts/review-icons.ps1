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
 $tested=0
 foreach($size in @(@(1440,1000),@(390,844),@(320,740))){
  CDP 'Emulation.setDeviceMetricsOverride' @{width=$size[0];height=$size[1];deviceScaleFactor=1;mobile=($size[0]-lt 700)}|Out-Null
  foreach($file in @('index.html','servicos.html','produtos.html','como-trabalhamos.html','oxilife-fish.html','contato.html')){
   Navigate $file
   $checks=Eval 'JSON.stringify({overflow:document.documentElement.scrollWidth>innerWidth,count:document.querySelectorAll("svg.fa-icon").length,invalid:[...document.querySelectorAll("svg.fa-icon")].filter(e=>getComputedStyle(e).fill==="none"||getComputedStyle(e).stroke!=="none"||e.getAttribute("aria-hidden")!=="true"||e.getAttribute("focusable")!=="false").length,svgIcons:[...document.querySelectorAll("svg.fa-icon")].map(e=>({name:[...e.classList].find(c=>c!=="fa-icon").slice(3),viewBox:e.getAttribute("viewBox"),path:e.querySelector("path").getAttribute("d")}))})'
   $data=$checks|ConvertFrom-Json
   if($data.overflow -or $data.invalid -or $data.count -lt 12){throw ($file+': invalid icon rendering')}
   foreach($icon in $data.svgIcons){
    $xml=[xml][IO.File]::ReadAllText((Join-Path $root ('assets/icons/'+$icon.name+'.svg')))
    if($icon.viewBox -ne $xml.svg.viewBox -or $icon.path -ne $xml.svg.path.d){throw ($file+': changed geometry for '+$icon.name)}
   }
   $tested++
   if($file -eq 'index.html' -and $size[0] -eq 390){Screenshot 'inicio-mobile.png'}
   if($file -eq 'index.html' -and $size[0] -eq 1440){Screenshot 'inicio-desktop.png'; Eval 'document.querySelector(".cta-section").scrollIntoView({behavior:"instant"})'|Out-Null; Screenshot 'rodape-desktop.png'}
  }
 }
 Write-Output ('PASS: '+$tested+' page/viewport checks; original Font Awesome geometry, fill, accessibility and responsive rendering confirmed.')
} finally {
 if($socket){$socket.Dispose()}
 if($browser -and !$browser.HasExited){Stop-Process -Id $browser.Id -ErrorAction SilentlyContinue}
}