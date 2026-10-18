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
 CDP 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1000;deviceScaleFactor=1;mobile=$false}|Out-Null
 CDP 'Emulation.setEmulatedMedia' @{features=@()}|Out-Null
 Navigate 'index.html'
 Eval 'document.querySelector("[data-lang=pt]").click();new Promise((resolve,reject)=>{let tries=0;const timer=setInterval(()=>{const v=document.querySelector("#hero-fish-video");if(v.readyState>=2&&!v.paused){clearInterval(timer);resolve()}else if(++tries>80){clearInterval(timer);reject(new Error("Video did not start: ready="+v.readyState+", error="+v.error?.code))}},40)})'|Out-Null
 if(!(Eval 'const v=document.querySelector("#hero-fish-video");v.muted&&!v.loop&&!v.hidden&&v.videoWidth===1280&&!document.querySelector(".hero-video-toggle")')){throw 'Desktop video or button removal failed'}
 Screenshot 'inicio-desktop.png'
 Eval 'new Promise(resolve=>setTimeout(resolve,4700))'|Out-Null
 if(!(Eval 'document.querySelector("#hero-fish-video").paused && document.querySelector("#hero-fish-video").currentTime>0')){throw 'Entrance animation did not stop automatically'}
 Navigate 'index.html'
 Eval 'new Promise((resolve,reject)=>{let tries=0;const timer=setInterval(()=>{if(!document.querySelector("#hero-fish-video").paused){clearInterval(timer);resolve()}else if(++tries>80){clearInterval(timer);reject(new Error("Video restart failed"))}},40)})'|Out-Null
 Eval 'window.scrollTo({top:document.body.scrollHeight,behavior:"instant"});new Promise(resolve=>setTimeout(resolve,250))'|Out-Null
 if(!(Eval 'document.querySelector("#hero-fish-video").paused')){throw 'Offscreen video did not pause'}
 Eval 'window.scrollTo({top:0,behavior:"instant"});new Promise(resolve=>setTimeout(resolve,250))'|Out-Null
 if(!(Eval '!document.querySelector("#hero-fish-video").paused')){throw 'Video did not resume within the entrance budget'}
 CDP 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=1;mobile=$true}|Out-Null
 Eval 'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))'|Out-Null
 if(!(Eval 'const v=document.querySelector("#hero-fish-video");v.hidden&&v.paused&&!v.hasAttribute("src")')){throw 'Mobile resize did not unload the video'}
 foreach($width in @(390,320)){
  CDP 'Emulation.setDeviceMetricsOverride' @{width=$width;height=844;deviceScaleFactor=1;mobile=$true}|Out-Null
  Navigate 'index.html'
  if(!(Eval 'const v=document.querySelector("#hero-fish-video");v.hidden&&!v.hasAttribute("src")&&document.documentElement.scrollWidth<=innerWidth&&getComputedStyle(document.querySelector(".home-hero")).backgroundImage.includes("fundo-peixes-poster.jpg")')){throw 'Mobile fallback or layout failed'}
  if($width-eq 390){Screenshot 'inicio-mobile.png'}
 }
 CDP 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1000;deviceScaleFactor=1;mobile=$false}|Out-Null
 CDP 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}|Out-Null
 Navigate 'index.html'
 if(!(Eval 'const v=document.querySelector("#hero-fish-video");v.hidden&&!v.hasAttribute("src")&&v.paused')){throw 'Reduced motion still downloaded or played the video'}
 Screenshot 'inicio-sem-movimento.png'
 CDP 'Emulation.setEmulatedMedia' @{features=@()}|Out-Null
 $saving=CDP 'Page.addScriptToEvaluateOnNewDocument' @{source='Object.defineProperty(navigator,"connection",{value:{saveData:true},configurable:true})'}
 Navigate 'index.html'
 if(!(Eval '!document.querySelector("#hero-fish-video").hasAttribute("src")')){throw 'Data saving ignored'}
 CDP 'Page.removeScriptToEvaluateOnNewDocument' @{identifier=$saving.identifier}|Out-Null
 $failing=CDP 'Page.addScriptToEvaluateOnNewDocument' @{source='HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException("Playback blocked","NotAllowedError"))}'}
 Navigate 'index.html'
 if(!(Eval 'const v=document.querySelector("#hero-fish-video");v.hidden&&!v.hasAttribute("src")&&document.body.classList.contains("enhanced")')){throw 'Blocked playback did not fall back safely'}
 CDP 'Page.removeScriptToEvaluateOnNewDocument' @{identifier=$failing.identifier}|Out-Null
 CDP 'Emulation.setScriptExecutionDisabled' @{value=$true}|Out-Null
 Navigate 'index.html'
 if(!(Eval '!document.querySelector("#hero-fish-video").hasAttribute("src")&&getComputedStyle(document.querySelector(".home-hero")).backgroundImage.includes("fundo-peixes-poster.jpg")')){throw 'No-JS fallback failed'}
 CDP 'Emulation.setScriptExecutionDisabled' @{value=$false}|Out-Null
 if($script:jsErrors.Count){throw ('Unexpected JavaScript errors: '+($script:jsErrors -join ','))}
 [IO.File]::WriteAllText((Join-Path $resultsDir 'resultado-peixes.json'),'{"status":"PASS","desktopVideo":true,"automaticStop":true,"offscreenPause":true,"mobileStatic":true,"reducedMotion":true,"dataSaving":true,"blockedPlaybackFallback":true,"noJavaScriptFallback":true,"pauseButtonRemoved":true}',(New-Object Text.UTF8Encoding($false)))
 Write-Output 'PASS: fish background; desktop playback and automatic stop; offscreen pause; mobile/static, reduced-motion, data-saving, blocked playback and no-JS fallbacks; no pause button.'
} finally {
 if($socket){$socket.Dispose()}
 if($browser -and !$browser.HasExited){Stop-Process -Id $browser.Id -ErrorAction SilentlyContinue}
}