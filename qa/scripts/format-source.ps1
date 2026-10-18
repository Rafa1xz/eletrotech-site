$ErrorActionPreference = 'Stop'
$projectRoot = (Get-Location).Path
$utf8 = New-Object Text.UTF8Encoding($false)

function Format-Html($source) {
  # SVGs, scripts e textareas são preservados integralmente, incluindo espaços significativos.
  $script:protected = New-Object 'System.Collections.Generic.List[string]'
  $source = [regex]::Replace($source,'(?s)<svg\b.*?</svg>|<script\b.*?</script>|<textarea\b.*?</textarea>|<!--.*?-->',[Text.RegularExpressions.MatchEvaluator]{param($m) $index=$script:protected.Count; $script:protected.Add($m.Value); '@@HTML_BLOCK_'+$index+'@@'})
  $blocks=@('html','head','body','main','header','nav','section','div','article','aside','figure','figcaption','ol','ul','li','form','footer','p','h1','h2','h3','h4','h5','h6','title','button','label','select','option','details','summary','a','video','noscript','meta','link','input','img')
  $void=@('meta','link','input','img')
  $lines=New-Object 'System.Collections.Generic.List[string]'
  $level=0; $current=''
  foreach ($token in [regex]::Matches($source,'<[^>]+>|[^<]+')) {
    $value=$token.Value
    $tag=[regex]::Match($value,'^</?([a-zA-Z0-9]+)\b').Groups[1].Value.ToLower()
    if ($tag -and $blocks -contains $tag) {
      if ($current.Trim()) { $lines.Add(('  '*$level)+$current.Trim()); $current='' }
      if ($value.StartsWith('</')) { $level=[Math]::Max(0,$level-1) }
      $lines.Add(('  '*$level)+$value.Trim())
      if (!$value.StartsWith('</') -and $void -notcontains $tag -and !$value.EndsWith('/>')) { $level++ }
    } else {
      $value=[regex]::Replace($value,'[\r\n]+',' ')
      if ($value.Trim() -or $current) { $current+=$value }
    }
  }
  if ($current.Trim()) { $lines.Add(('  '*$level)+$current.Trim()) }
  $formatted=$lines -join "`n"
  for($index=0;$index-lt $script:protected.Count;$index++){ $formatted=$formatted.Replace('@@HTML_BLOCK_'+$index+'@@',$script:protected[$index]) }
  $formatted+"`n"
}

function Format-Css($source) {
  $lines=New-Object 'System.Collections.Generic.List[string]'
  $current=New-Object Text.StringBuilder
  $level=0; $quote=[char]0
  for($index=0;$index-lt $source.Length;$index++){
    $char=$source[$index]
    if ($quote -ne [char]0) {
      [void]$current.Append($char)
      if ($char -eq $quote -and ($index-eq 0 -or $source[$index-1]-ne '\')) { $quote=[char]0 }
      continue
    }
    if ($char -eq "'" -or $char -eq '"') { $quote=$char; [void]$current.Append($char); continue }
    if ($char-eq '/' -and $index+1-lt $source.Length -and $source[$index+1]-eq '*') {
      $end=$source.IndexOf('*/',$index)
      if ($end-lt 0) { throw 'Comentário CSS não fechado.' }
      if ($current.ToString().Trim()) { $lines.Add(('  '*$level)+$current.ToString().Trim()); [void]$current.Clear() }
      $lines.Add(('  '*$level)+$source.Substring($index,$end-$index+2).Trim())
      $index=$end+1; continue
    }
    if ($char-eq '{') {
      $lines.Add(('  '*$level)+$current.ToString().Trim()+' {'); [void]$current.Clear(); $level++
    } elseif ($char-eq ';') {
      $lines.Add(('  '*$level)+$current.ToString().Trim()+';'); [void]$current.Clear()
    } elseif ($char-eq '}') {
      if ($current.ToString().Trim()) { $lines.Add(('  '*$level)+$current.ToString().Trim()); [void]$current.Clear() }
      $level=[Math]::Max(0,$level-1); $lines.Add(('  '*$level)+'}')
    } elseif ([char]::IsWhiteSpace($char)) {
      if ($current.Length-gt 0 -and $current[$current.Length-1]-ne ' ') { [void]$current.Append(' ') }
    } else { [void]$current.Append($char) }
  }
  if ($level-ne 0 -or $quote-ne [char]0) { throw 'CSS desbalanceado.' }
  ($lines -join "`n")+"`n"
}

foreach($file in Get-ChildItem -LiteralPath $projectRoot -Filter '*.html' -File){
  [IO.File]::WriteAllText($file.FullName,(Format-Html ([IO.File]::ReadAllText($file.FullName))),$utf8)
}
$cssPath=Join-Path $projectRoot 'css\styles.css'
[IO.File]::WriteAllText($cssPath,(Format-Css ([IO.File]::ReadAllText($cssPath))),$utf8)
Write-Output 'HTML e CSS formatados para leitura; SVGs e conteúdo sensível a espaços preservados.'
