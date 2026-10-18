$ErrorActionPreference = 'Stop'
$projectRoot = (Get-Location).Path
$iconsPath = Join-Path $projectRoot 'assets\icons'
$utf8 = New-Object Text.UTF8Encoding($false)
New-Item -ItemType Directory -Path $iconsPath -Force | Out-Null
$icons = @(
  @('whatsapp','brands'), @('instagram','brands'),
  @('magnifying-glass','solid'), @('envelope','solid'),
  @('phone-flip','solid'), @('table-cells-large','solid'),
  @('arrow-up','solid'), @('rotate-left','solid')
)
$inlineIcons = @{}
foreach ($icon in $icons) {
  $name = $icon[0]
  $filePath = Join-Path $iconsPath ($name+'.svg')
  if (!(Test-Path -LiteralPath $filePath)) {
    Invoke-WebRequest -UseBasicParsing -Uri ('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.7.2/svgs/'+$icon[1]+'/'+$name+'.svg') -OutFile $filePath
  }
  $svg = [IO.File]::ReadAllText($filePath)
  if ($svg -notmatch '^<svg\b' -or $svg -notmatch 'viewBox="[^"]+"' -or $svg -notmatch '<path\b') { throw ('Invalid SVG: '+$name) }
  $inlineIcons[$name] = $svg.Replace('<svg ','<svg class="fa-icon fa-'+$name+'" aria-hidden="true" focusable="false" ').Trim()
}
$licensePath = Join-Path $iconsPath 'LICENSE-FONT-AWESOME.txt'
if (!(Test-Path -LiteralPath $licensePath)) {
  Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.7.2/LICENSE.txt' -OutFile $licensePath
}
$sourceNote = "Font Awesome Free 6.7.2`nSource: https://github.com/FortAwesome/Font-Awesome/tree/6.7.2/svgs`nSVG icons: CC BY 4.0. See LICENSE-FONT-AWESOME.txt.`nIcon paths and viewBox are unchanged; decorative accessibility attributes and CSS classes are added to inline copies.`n"
[IO.File]::WriteAllText((Join-Path $iconsPath 'SOURCE.txt'),$sourceNote,$utf8)
$script:replaced = 0
$replaceSVG = [Text.RegularExpressions.MatchEvaluator] {
  param($match)
  $markup = $match.Value
  $name = $null
  if ($markup.Contains('M21 11.5a8.5')) { $name = 'whatsapp' }
  elseif ($markup.Contains('<rect x="3" y="3" width="18" height="18"')) { $name = 'instagram' }
  elseif ($markup.Contains('<circle cx="10.5"')) { $name = 'magnifying-glass' }
  elseif ($markup.Contains('<rect x="3" y="5"')) { $name = 'envelope' }
  elseif ($markup.Contains('m8 3 3 5-3 3')) { $name = 'phone-flip' }
  elseif ($markup.Contains('<rect x="3" y="3" width="7"')) { $name = 'table-cells-large' }
  elseif ($markup.Contains('m7 14 5-5 5 5M12 9v12')) { $name = 'arrow-up' }
  elseif ($markup.Contains('M3 10a9 9 0 1 1')) { $name = 'rotate-left' }
  if (!$name) { return $markup }
  $script:replaced++
  return $inlineIcons[$name]
}
foreach ($file in Get-ChildItem -LiteralPath $projectRoot -Filter '*.html' -File) {
  $html = [IO.File]::ReadAllText($file.FullName)
  $html = [regex]::Replace($html,'(?s)<svg\b[^>]*>.*?</svg>',$replaceSVG)
  [IO.File]::WriteAllText($file.FullName,$html,$utf8)
}
Write-Output ('Updated '+$script:replaced+' icons across six pages using original Font Awesome SVG paths.')
