<#
  subir.ps1 — envia tudo para o GitHub mostrando cada etapa na tela.
  Se algo falhar, diz exatamente onde e por que.
#>

$ErrorActionPreference = 'Continue'
$Projeto = Split-Path -Parent $PSScriptRoot
if (-not $Projeto) { $Projeto = (Get-Location).Path }
Set-Location $Projeto

function Titulo($t){ Write-Host ''; Write-Host (" " + $t) -ForegroundColor Cyan; Write-Host (" " + ('-' * 50)) -ForegroundColor DarkGray }
function Ok($t){ Write-Host ("   OK  " + $t) -ForegroundColor Green }
function Falha($t){ Write-Host ("   ERRO  " + $t) -ForegroundColor Red }
function Aviso($t){ Write-Host ("   !  " + $t) -ForegroundColor Yellow }

Write-Host ''
Write-Host "  Pasta: $Projeto" -ForegroundColor White

# ---------- 1. o git existe? ----------
Titulo '1. Verificando o Git'
$v = & git --version 2>&1
if ($LASTEXITCODE -ne 0) { Falha 'Git nao instalado. Baixe em git-scm.com'; Read-Host 'ENTER'; exit }
Ok $v

# ---------- 2. estamos num repositorio? ----------
Titulo '2. Verificando o repositorio'
& git rev-parse --is-inside-work-tree 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Falha 'Esta pasta nao e um repositorio git.'
  Aviso 'Coloque este script dentro da pasta do projeto (a que tem o index.html).'
  Read-Host 'ENTER'; exit
}
Ok 'repositorio encontrado'

# repositorio aninhado dentro de subpasta engole arquivos silenciosamente
$aninhados = Get-ChildItem -Path $Projeto -Recurse -Force -Directory -Filter '.git' -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -ne (Join-Path $Projeto '.git') }
if ($aninhados) {
  Aviso 'ACHEI O PROBLEMA: existe um repositorio git dentro de uma subpasta.'
  foreach ($a in $aninhados) { Write-Host ('      ' + $a.FullName) -ForegroundColor Yellow }
  Write-Host ''
  $r = Read-Host '   Apagar esses .git internos e continuar? (S/N)'
  if ($r -eq 'S' -or $r -eq 's') {
    foreach ($a in $aninhados) { Remove-Item $a.FullName -Recurse -Force -ErrorAction SilentlyContinue }
    Ok 'removidos'
  }
}

# ---------- 3. o que tem na pasta imagens ----------
Titulo '3. Conferindo a pasta imagens'
$DirImg = Join-Path $Projeto 'imagens'
if (-not (Test-Path $DirImg)) {
  Falha 'A pasta imagens nao existe.'
} else {
  $imgs = Get-ChildItem $DirImg -File | Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|gif|webp)$' }
  if ($imgs.Count -eq 0) {
    Falha 'A pasta imagens esta VAZIA - por isso nada sobe.'
    Aviso 'As imagens precisam ser copiadas para:'
    Write-Host ("      " + $DirImg) -ForegroundColor Yellow
    Write-Host ''
    $origem = Read-Host '   Cole aqui a pasta onde estao as imagens (ou ENTER para pular)'
    if ($origem -and (Test-Path $origem)) {
      Copy-Item (Join-Path $origem '*') $DirImg -Include *.png,*.jpg,*.jpeg,*.gif,*.webp -Force
      $imgs = Get-ChildItem $DirImg -File | Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|gif|webp)$' }
      Ok ("copiadas: " + $imgs.Count)
    }
  } else {
    Ok ("" + $imgs.Count + " imagens na pasta")
  }
}

# ---------- 4. marcar tudo ----------
Titulo '4. Marcando os arquivos (git add)'
$saida = & git add -A --verbose 2>&1
if ($LASTEXITCODE -ne 0) { Falha 'o git add falhou:'; $saida | ForEach-Object { Write-Host ('      ' + $_) -ForegroundColor Red } }
else {
  $n = ($saida | Measure-Object).Count
  if ($n -eq 0) { Aviso 'nenhum arquivo novo para marcar' } else { Ok ("$n arquivos marcados") }
}

Titulo '5. O que sera enviado'
$fila = & git diff --cached --name-only 2>&1
if (-not $fila) {
  Aviso 'Nada na fila. Talvez ja esteja tudo enviado.'
} else {
  $t = ($fila | Measure-Object).Count
  Ok "$t arquivos na fila:"
  $fila | Select-Object -First 15 | ForEach-Object { Write-Host ('      ' + $_) -ForegroundColor DarkGray }
  if ($t -gt 15) { Write-Host ("      ... e mais " + ($t - 15)) -ForegroundColor DarkGray }
}

# ---------- 6. commit ----------
if ($fila) {
  Titulo '6. Salvando (git commit)'
  $saida = & git commit -m "Adiciona imagens dos personagens" 2>&1
  if ($LASTEXITCODE -ne 0) {
    Falha 'o commit falhou:'
    $saida | ForEach-Object { Write-Host ('      ' + $_) -ForegroundColor Red }
    if ($saida -match 'user.email|user.name') {
      Write-Host ''
      Aviso 'Falta configurar seu nome e email. Rode:'
      Write-Host '      git config --global user.name "Felipe"' -ForegroundColor Yellow
      Write-Host '      git config --global user.email "seu@email.com"' -ForegroundColor Yellow
    }
    Read-Host 'ENTER'; exit
  }
  Ok 'salvo'
}

# ---------- 7. push ----------
Titulo '7. Enviando para o GitHub (git push)'
$remoto = & git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
  Falha 'nenhum repositorio remoto configurado. Rode:'
  Write-Host '      git remote add origin https://github.com/charlibriano/myponeis.git' -ForegroundColor Yellow
  Read-Host 'ENTER'; exit
}
Ok ("destino: " + $remoto)
Write-Host '   enviando, aguarde...' -ForegroundColor DarkGray

$saida = & git push -u origin main 2>&1
if ($LASTEXITCODE -ne 0) {
  Falha 'o push falhou:'
  $saida | ForEach-Object { Write-Host ('      ' + $_) -ForegroundColor Red }
  Write-Host ''
  if ($saida -match 'Authentication|credential|403|denied') {
    Aviso 'E problema de login. Rode isto e tente de novo:'
    Write-Host '      git credential-manager github login' -ForegroundColor Yellow
  }
  if ($saida -match 'rejected|non-fast-forward|behind') {
    Aviso 'O GitHub tem algo que voce nao tem local. Rode:'
    Write-Host '      git pull origin main --allow-unrelated-histories' -ForegroundColor Yellow
  }
  if ($saida -match 'src refspec|does not match') {
    Aviso 'O ramo se chama diferente. Rode:'
    Write-Host '      git branch -M main' -ForegroundColor Yellow
  }
} else {
  $saida | ForEach-Object { Write-Host ('      ' + $_) -ForegroundColor DarkGray }
  Write-Host ''
  Ok 'ENVIADO COM SUCESSO'
  Write-Host '   Confira em: https://github.com/charlibriano/myponeis/tree/main/imagens' -ForegroundColor Green
}

Write-Host ''
Read-Host 'ENTER para fechar' | Out-Null
