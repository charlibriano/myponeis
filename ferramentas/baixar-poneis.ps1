<#
  baixar-poneis.ps1
  Baixa nome + imagem principal dos personagens da MLP Fandom (pt).

  Uso:
    .\baixar-poneis.ps1 -Listar     -> so gera personagens.txt (a lista, pra voce editar)
    .\baixar-poneis.ps1 -Baixar     -> le personagens.txt e baixa as imagens
    .\baixar-poneis.ps1             -> faz os dois
    .\baixar-poneis.ps1 -Limite 5   -> testa com so 5 personagens antes de rodar tudo
#>

param(
  [switch]$Listar,
  [switch]$Baixar,
  [int]$Limite = 0,
  [string]$Pagina = 'Personagens'
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$API      = 'https://mlp.fandom.com/pt/api.php'
$UA       = 'JogoDaFilha/1.0 (projeto pessoal)'
$Cabecalho = @{ 'User-Agent' = $UA }
$Base     = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$DirImg   = Join-Path $Base 'imagens'
$ArqLista = Join-Path $Base 'personagens.txt'
$ArqJson  = Join-Path $Base 'personagens.json'
$ArqJs    = Join-Path $Base 'personagens.js'
$ArqLog   = Join-Path $Base 'log.txt'

if (-not $Listar -and -not $Baixar) { $Listar = $true; $Baixar = $true }

function Log($txt, $cor = 'Gray') {
  Write-Host $txt -ForegroundColor $cor
  Add-Content -Path $ArqLog -Value ("[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $txt) -Encoding UTF8
}

function PegaJson($url) {
  return Invoke-RestMethod -Uri $url -Headers $Cabecalho -TimeoutSec 40
}

# ------------------------------------------------------------------
# ETAPA 1 - montar a lista de personagens a partir da pagina indice
# ------------------------------------------------------------------
function MontaLista {
  Log "Lendo a pagina '$Pagina' da wiki..." 'Cyan'
  $url = $API + '?action=parse&format=json&formatversion=2&prop=text&page=' + [uri]::EscapeDataString($Pagina)
  $r = PegaJson $url

  if (-not $r.parse) { Log "ERRO: a API nao devolveu conteudo para a pagina '$Pagina'." 'Red'; return @() }
  $html = $r.parse.text

  # todo link interno /pt/wiki/Alguma_Coisa vira candidato
  $achados = [regex]::Matches($html, 'href="/pt/wiki/([^"#?]+)"')
  $lixo = '^(Lista|Galeria|Categoria|Arquivo|Predefini|Ajuda|Usu|Especial|My Little Pony|Personagens|Equestria Girls|Temporada|Epis|Filme|Blog|MLP)'
  $mapa = @{}

  foreach ($a in $achados) {
    $t = [uri]::UnescapeDataString($a.Groups[1].Value) -replace '_', ' '
    if ($t -match ':')      { continue }   # namespaces (Arquivo:, Categoria:...)
    if ($t -match $lixo)    { continue }
    if ($t.Length -gt 40)   { continue }
    if ($t.Trim() -eq '')   { continue }
    $mapa[$t] = $true
  }

  $lista = $mapa.Keys | Sort-Object
  Log ("Encontrados {0} personagens candidatos." -f $lista.Count) 'Green'
  Set-Content -Path $ArqLista -Value $lista -Encoding UTF8
  Log "Lista salva em: $ArqLista" 'Green'
  Log "ABRA ESSE ARQUIVO e apague as linhas que nao interessam antes de baixar." 'Yellow'
  return $lista
}

# ------------------------------------------------------------------
# ETAPA 2 - descobrir a imagem principal de cada personagem
# ------------------------------------------------------------------
function LimpaUrl($u) {
  if (-not $u) { return $null }
  $u = $u -replace '/revision/.*$', ''    # tira o sufixo de miniatura da Fandom
  $u = $u -replace '\?cb=.*$', ''
  return $u
}

# rapido: pega ate 50 de uma vez pela extensao PageImages
function ImagensEmLote($titulos) {
  $res = @{}
  $join = ($titulos -join '|')
  $url = $API + '?action=query&format=json&formatversion=2&prop=pageimages&piprop=original&titles=' + [uri]::EscapeDataString($join)
  try {
    $r = PegaJson $url
    foreach ($p in $r.query.pages) {
      if ($p.original -and $p.original.source) { $res[$p.title] = LimpaUrl $p.original.source }
    }
    # a API normaliza titulos (acentos, underscore) - refaz o de-para
    if ($r.query.normalized) {
      foreach ($n in $r.query.normalized) {
        if ($res.ContainsKey($n.to)) { $res[$n.from] = $res[$n.to] }
      }
    }
  } catch {
    Log ("Lote falhou ({0}). Vou tentar um a um." -f $_.Exception.Message) 'Yellow'
  }
  return $res
}

# reserva: le a pagina e pega a imagem da infobox
function ImagemDaInfobox($titulo) {
  $url = $API + '?action=parse&format=json&formatversion=2&prop=text&page=' + [uri]::EscapeDataString($titulo)
  try { $r = PegaJson $url } catch { return $null }
  if (-not $r.parse) { return $null }
  $html = $r.parse.text

  $padroes = @(
    'class="pi-image-thumbnail"[^>]*src="([^"]+)"',
    'src="([^"]+)"[^>]*class="pi-image-thumbnail"',
    '<img[^>]+(?:data-src|src)="(https://static\.wikia\.nocookie\.net/[^"]+\.(?:png|jpg|jpeg|gif))'
  )
  foreach ($p in $padroes) {
    $m = [regex]::Match($html, $p)
    if ($m.Success) { return LimpaUrl $m.Groups[1].Value }
  }
  return $null
}

function NomeDeArquivo($nome, $url) {
  $limpo = ($nome -replace '[\\/:*?"<>|]', '').Trim()
  $ext = '.png'
  if ($url -match '\.(png|jpg|jpeg|gif|webp)$') { $ext = '.' + $Matches[1] }
  return "$limpo$ext"
}

function BaixaTudo {
  if (-not (Test-Path $ArqLista)) { Log "ERRO: nao achei $ArqLista. Rode com -Listar primeiro." 'Red'; return }
  $titulos = @(Get-Content $ArqLista -Encoding UTF8 | Where-Object { $_.Trim() -ne '' })
  if ($Limite -gt 0) { $titulos = $titulos | Select-Object -First $Limite; Log "MODO TESTE: so os $Limite primeiros." 'Yellow' }
  if (-not (Test-Path $DirImg)) { New-Item -ItemType Directory -Path $DirImg | Out-Null }

  Log ("Buscando as imagens de {0} personagens..." -f $titulos.Count) 'Cyan'

  # 1) tenta em lotes de 50
  $urls = @{}
  for ($i = 0; $i -lt $titulos.Count; $i += 50) {
    $lote = $titulos[$i..([Math]::Min($i + 49, $titulos.Count - 1))]
    $achou = ImagensEmLote $lote
    foreach ($k in $achou.Keys) { $urls[$k] = $achou[$k] }
    Start-Sleep -Milliseconds 300
  }
  Log ("Lote rapido resolveu {0} de {1}." -f $urls.Count, $titulos.Count) 'Green'

  # 2) quem sobrou, tenta pela infobox
  $sobraram = $titulos | Where-Object { -not $urls.ContainsKey($_) }
  if ($sobraram.Count -gt 0) {
    Log ("Buscando os {0} restantes pela infobox (mais lento)..." -f $sobraram.Count) 'Cyan'
    foreach ($t in $sobraram) {
      $u = ImagemDaInfobox $t
      if ($u) { $urls[$t] = $u }
      Start-Sleep -Milliseconds 250
    }
  }

  # 3) baixa
  $ok = 0; $pulados = 0; $falhas = @()
  $registro = @()
  $n = 0
  foreach ($t in $titulos) {
    $n++
    if (-not $urls.ContainsKey($t)) { $falhas += "$t  ->  nenhuma imagem encontrada"; continue }
    $url = $urls[$t]
    $arq = NomeDeArquivo $t $url
    $destino = Join-Path $DirImg $arq

    if (Test-Path $destino) {
      $pulados++
      $registro += [pscustomobject]@{ nome = $t; img = "imagens/$arq" }
      continue
    }
    try {
      Invoke-WebRequest -Uri $url -OutFile $destino -Headers $Cabecalho -TimeoutSec 60 -UseBasicParsing
      $ok++
      $registro += [pscustomobject]@{ nome = $t; img = "imagens/$arq" }
      Write-Host ("  [{0}/{1}] {2}" -f $n, $titulos.Count, $t) -ForegroundColor DarkGray
    } catch {
      $falhas += ("{0}  ->  {1}" -f $t, $_.Exception.Message)
    }
    Start-Sleep -Milliseconds 250
  }

  # 4) arquivos de saida prontos pro jogo
  $registro | ConvertTo-Json -Depth 3 | Set-Content -Path $ArqJson -Encoding UTF8

  $linhas = $registro | ForEach-Object { '  { nome: "' + $_.nome + '", img: "' + $_.img + '" },' }
  $js = @('const PERSONAGENS = [') + $linhas + @('];')
  Set-Content -Path $ArqJs -Value $js -Encoding UTF8

  Log '' 
  Log ("PRONTO. Baixadas: {0} | Ja existiam: {1} | Falharam: {2}" -f $ok, $pulados, $falhas.Count) 'Green'
  Log ("Imagens em: {0}" -f $DirImg) 'Green'
  Log ("Lista pro jogo em: {0}" -f $ArqJs) 'Green'
  if ($falhas.Count -gt 0) {
    $arqFalhas = Join-Path $Base 'falhas.txt'
    Set-Content -Path $arqFalhas -Value $falhas -Encoding UTF8
    Log ("Quem falhou e por que: {0}" -f $arqFalhas) 'Yellow'
  }
}

# ------------------------------------------------------------------
Set-Content -Path $ArqLog -Value ("=== {0} ===" -f (Get-Date)) -Encoding UTF8
try {
  if ($Listar) { MontaLista | Out-Null }
  if ($Baixar) { BaixaTudo }
} catch {
  Log ("ERRO GERAL: " + $_.Exception.Message) 'Red'
  Log ("Detalhe: " + $_.ScriptStackTrace) 'Red'
}
Write-Host ''
Write-Host 'Pressione ENTER para fechar.' -ForegroundColor Cyan
Read-Host | Out-Null
