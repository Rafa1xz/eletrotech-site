$ErrorActionPreference = 'Stop'
$projectRoot = (Get-Location).Path
$voidTags = @('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr')
$issues = New-Object 'System.Collections.Generic.List[string]'
$linksChecked = 0

$htmlFiles = @(Get-ChildItem -LiteralPath $projectRoot -Filter '*.html' -File)
if (Test-Path (Join-Path $projectRoot 'produtos')) { $htmlFiles += @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'produtos') -Filter '*.html' -File) }
foreach ($file in $htmlFiles) {
  $html = [IO.File]::ReadAllText($file.FullName)
  $clean = [regex]::Replace($html,'(?s)<!--.*?-->','')
  $stack = New-Object 'System.Collections.Generic.List[string]'
  foreach ($tag in [regex]::Matches($clean,'</?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>')) {
    $name = $tag.Groups[1].Value.ToLower()
    if ($tag.Value.StartsWith('</')) {
      if (!$stack.Count -or $stack[$stack.Count-1] -ne $name) { $issues.Add($file.Name+': fechamento inesperado '+$name); break }
      $stack.RemoveAt($stack.Count-1)
    } elseif ($voidTags -notcontains $name -and !$tag.Value.EndsWith('/>')) { $stack.Add($name) }
  }
  if ($stack.Count) { $issues.Add($file.Name+': tags abertas '+($stack -join ', ')) }
  foreach ($reference in [regex]::Matches($html,'(?:src|href|action|poster)="([^"]+)"')) {
    $value = [Net.WebUtility]::HtmlDecode($reference.Groups[1].Value)
    if ($value -match '^(https?:|mailto:|tel:|data:)') { continue }
    $parts = $value -split '#',2
    $localPath = ($parts[0] -split '\?')[0]
    $target = $file.FullName
    if ($localPath) { $target = [IO.Path]::GetFullPath((Join-Path $file.DirectoryName $localPath)) }
    if (!(Test-Path -LiteralPath $target)) { $issues.Add($file.Name+': arquivo inexistente '+$value); continue }
    if ($parts.Length -gt 1 -and $parts[1] -and $target.EndsWith('.html')) {
      $targetHtml = [IO.File]::ReadAllText($target)
      if (!$targetHtml.Contains('id="'+$parts[1]+'"')) { $issues.Add($file.Name+': âncora inexistente '+$value) }
    }
    $linksChecked++
  }
}
$cssPath = Join-Path $projectRoot 'css\styles.css'
foreach ($url in [regex]::Matches([IO.File]::ReadAllText($cssPath),'url\([''"'']?([^''"'')]+)')) {
  if (!(Test-Path -LiteralPath (Join-Path (Split-Path $cssPath) $url.Groups[1].Value))) { $issues.Add('Imagem CSS inexistente: '+$url.Groups[1].Value) }
}
if ($issues.Count) { throw ($issues -join [Environment]::NewLine) }
Write-Output ('PASS: '+$htmlFiles.Count+' HTML balanceados; '+$linksChecked+' referências locais e âncoras verificadas; imagens CSS existentes.')
