param([string]$BaseUrl='http://127.0.0.1:5500')
$ErrorActionPreference='Stop'
$testDir=Join-Path $env:TEMP ('eletrotech-admin-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testDir | Out-Null
$profile=Join-Path $testDir 'edge-profile'
$browser=Start-Process -FilePath 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9237',('--user-data-dir="'+$profile+'"'),'about:blank') -WindowStyle Hidden -PassThru
$socket=$null
try {
  $tabs=$null
  for($attempt=0;$attempt -lt 40;$attempt++){try{$tabs=Invoke-RestMethod 'http://127.0.0.1:9237/json/list';break}catch{Start-Sleep -Milliseconds 250}}
  if(!$tabs){throw 'Edge indisponivel'}
  $tab=$tabs|Where-Object{$_.type -eq 'page'}|Select-Object -First 1
  $socket=New-Object Net.WebSockets.ClientWebSocket
  $socket.ConnectAsync([Uri]$tab.webSocketDebuggerUrl,[Threading.CancellationToken]::None).Wait()
  $script:sequence=0
  $script:errors=New-Object 'System.Collections.Generic.List[string]'
  function CDP($method,$params=@{}){
    $script:sequence++;$id=$script:sequence
    $json=@{id=$id;method=$method;params=$params}|ConvertTo-Json -Depth 20 -Compress
    $bytes=[Text.Encoding]::UTF8.GetBytes($json)
    $socket.SendAsync((New-Object 'System.ArraySegment[byte]' -ArgumentList (,$bytes)),[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).Wait()
    while($true){
      $buffer=New-Object byte[] 1048576;$stream=New-Object IO.MemoryStream
      do{$received=$socket.ReceiveAsync((New-Object 'System.ArraySegment[byte]' -ArgumentList (,$buffer)),[Threading.CancellationToken]::None).Result;$stream.Write($buffer,0,$received.Count)}while(!$received.EndOfMessage)
      $response=[Text.Encoding]::UTF8.GetString($stream.ToArray())|ConvertFrom-Json;$stream.Dispose()
      if($response.method -eq 'Runtime.exceptionThrown'){$script:errors.Add(($response.params|ConvertTo-Json -Depth 8 -Compress))}
      if($response.id -eq $id){if($response.error){throw ($response.error|ConvertTo-Json -Compress)};return $response.result}
    }
  }
  function Eval($expression){$r=CDP 'Runtime.evaluate' @{expression=$expression;returnByValue=$true;awaitPromise=$true};if($r.exceptionDetails){throw ($r.exceptionDetails|ConvertTo-Json -Depth 8 -Compress)};return $r.result.value}
  function Assert($expression,$message){if(!(Eval $expression)){throw $message}}
  function Route($route){Eval ('location.hash="'+$route+'";new Promise(r=>setTimeout(r,100))')|Out-Null}
  CDP 'Page.enable'|Out-Null
  CDP 'Runtime.enable'|Out-Null
  CDP 'Page.navigate' @{url=($BaseUrl+'/admin/index.html')}|Out-Null
  for($i=0;$i -lt 50;$i++){Start-Sleep -Milliseconds 100;if(Eval 'document.querySelector("#view")?.getAttribute("aria-busy")==="false"'){break}}
  Assert 'document.querySelectorAll(".stat").length===4 && document.querySelector(".stat strong").textContent==="6"' 'Catalogo real nao importado'
  $checks=0
  foreach($width in @(1440,1024,768,390,320)){
    CDP 'Emulation.setDeviceMetricsOverride' @{width=$width;height=900;deviceScaleFactor=1;mobile=($width -lt 700)}|Out-Null
    foreach($route in @('dashboard','products','banners','content','pages','media','settings','access')){
      Route $route
      Assert 'document.documentElement.scrollWidth<=innerWidth' ('Overflow: '+$route+' '+$width)
      Assert 'document.querySelectorAll("h1").length===1 && document.querySelectorAll("nav a[aria-current=page]").length===1' 'Navegacao invalida'
      $checks++
    }
    Route 'products'
    Eval 'document.querySelector("tbody button").click()'|Out-Null
    Assert 'document.querySelector("dialog").open && document.querySelector("dialog").scrollWidth<=document.querySelector("dialog").clientWidth' 'Editor nao cabe na tela'
    Eval 'document.querySelector("#cancel-editor").click()'|Out-Null
    if($width -eq 1440 -or $width -eq 390){
      Route 'dashboard'
      $shot=CDP 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
      [IO.File]::WriteAllBytes((Join-Path $testDir ('admin-'+$width+'.png')),[Convert]::FromBase64String($shot.data))
    }
  }
  Route 'products'
  Eval 'const search=document.querySelector("input[type=search]");search.value="inexistenteXYZ";search.dispatchEvent(new Event("input"))'|Out-Null
  Assert 'document.querySelectorAll("tbody tr").length===0 && document.querySelector(".empty")!==null' 'Busca vazia falhou'
  Eval 'const search2=document.querySelector("input[type=search]");search2.value="";search2.dispatchEvent(new Event("input"));document.querySelector("tbody button").click()'|Out-Null
  Eval 'const f=document.querySelector("#editor-form");f.elements.name.value="Teste <img src=x onerror=alert(1)>";f.elements.price.value="100";f.elements.salePrice.value="150";f.dispatchEvent(new Event("input",{bubbles:true}));f.requestSubmit()'|Out-Null
  Assert '!document.querySelector("#editor-form").elements.salePrice.checkValidity() && document.querySelector("dialog").open' 'Validacao de preco falhou'
  Eval 'const f2=document.querySelector("#editor-form");f2.elements.salePrice.value="80";f2.dispatchEvent(new Event("input",{bubbles:true}));f2.requestSubmit()'|Out-Null
  Assert '!document.querySelector("dialog").open && document.querySelector("tbody strong").textContent.includes("<img") && !document.querySelector("img[src=x]")' 'Previa segura falhou'
  Route 'content'
  Assert 'document.querySelectorAll(".section-row").length===12' 'Paginacao de textos falhou'
  Route 'media'
  Eval 'const transfer=new DataTransfer();transfer.items.add(new File(["invalid"],"arquivo.svg",{type:"image/svg+xml"}));const picker=document.querySelector("#view input[type=file]");picker.files=transfer.files;picker.dispatchEvent(new Event("change"));new Promise(r=>setTimeout(r,100))'|Out-Null
  Assert 'document.querySelector("#feedback").textContent.includes("0 imagem") && document.querySelectorAll(".card").length===13' 'Arquivo invalido foi aceito'
  Eval 'const canvas=document.createElement("canvas");canvas.width=20;canvas.height=20;new Promise(resolve=>canvas.toBlob(blob=>{const dt=new DataTransfer();dt.items.add(new File([blob],"teste.png",{type:"image/png"}));const picker=document.querySelector("#view input[type=file]");picker.files=dt.files;picker.dispatchEvent(new Event("change"));setTimeout(resolve,200)},"image/png"))'|Out-Null
  Assert 'document.querySelectorAll(".card").length===14 && document.querySelector("#feedback").textContent.includes("1 imagem")' 'Previa de PNG falhou'
  Eval 'window.draftPayload=null;const originalUrl=URL.createObjectURL;URL.createObjectURL=blob=>{if(blob.type==="application/json")blob.text().then(text=>window.draftPayload=JSON.parse(text));return originalUrl.call(URL,blob)};HTMLAnchorElement.prototype.click=function(){};document.querySelector("#export").click();new Promise(r=>setTimeout(r,100))'|Out-Null
  Assert 'window.draftPayload.mode==="frontend-draft-not-published" && window.draftPayload.products.length===1 && window.draftPayload.products[0].salePrice==="80"' 'Exportacao do rascunho incorreta'
  Route 'access'
  Assert 'document.querySelectorAll("input[type=password]").length===0 && document.querySelector("#view button").disabled' 'Acesso deveria estar explicitamente desconectado'
  Assert 'document.querySelectorAll("button").length>0 && !document.querySelector("#export").disabled' 'Exportacao indisponivel'
  if($script:errors.Count){throw ($script:errors -join ',')}
  Write-Output ('PASS: '+$checks+' telas/larguras; editores responsivos; busca; validacao de preco; previa sem HTML executavel; paginacao; acesso desconectado; sem erros JS.')
  Write-Output ('Capturas: '+$testDir)
} finally {
  if($socket){$socket.Dispose()}
  if($browser -and !$browser.HasExited){Stop-Process -Id $browser.Id -ErrorAction SilentlyContinue}
}
