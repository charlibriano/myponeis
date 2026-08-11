<#
  gerar-lista.ps1
  Lê a pasta imagens\ e escreve js\personagens.js com o nome de cada
  personagem e o caminho da imagem. Não precisa de internet.
#>

$ErrorActionPreference = 'Stop'

# a pasta do projeto é a de cima, já que este script vive em ferramentas\
$Projeto = Split-Path -Parent $PSScriptRoot
if (-not $Projeto) { $Projeto = (Get-Location).Path }

$DirImg = Join-Path $Projeto 'imagens'
$DirJs  = Join-Path $Projeto 'js'
$Saida  = Join-Path $DirJs 'personagens.js'

Write-Host ''
Write-Host ' Gerando a lista de personagens...' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path $DirImg)) {
  Write-Host " ERRO: nao encontrei a pasta:" -ForegroundColor Red
  Write-Host "   $DirImg" -ForegroundColor Red
  Write-Host ''
  Write-Host " Coloque este script dentro da pasta ferramentas\ do projeto." -ForegroundColor Yellow
  Read-Host 'ENTER para fechar' | Out-Null
  exit
}

if (-not (Test-Path $DirJs)) { New-Item -ItemType Directory -Path $DirJs | Out-Null }

$arquivos = Get-ChildItem -Path $DirImg -File |
            Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|gif|webp)$' } |
            Sort-Object Name

if ($arquivos.Count -eq 0) {
  Write-Host " Nenhuma imagem encontrada em:" -ForegroundColor Yellow
  Write-Host "   $DirImg" -ForegroundColor Yellow
  Write-Host ''
  Write-Host " Copie as imagens para essa pasta e rode de novo." -ForegroundColor Yellow
  Read-Host 'ENTER para fechar' | Out-Null
  exit
}

$linhas = @('/* GERADO AUTOMATICAMENTE por ferramentas/gerar-lista.ps1 */',
            'const PERSONAGENS = [')

foreach ($a in $arquivos) {
  $nome = [IO.Path]::GetFileNameWithoutExtension($a.Name)
  $nome = $nome -replace '_', ' '
  $nome = $nome.Trim()
  # escapa aspas e barras para nao quebrar o JavaScript
  $nomeJs = $nome -replace '\\', '\\\\' -replace '"', '\"'
  $imgJs  = ($a.Name) -replace '\\', '\\\\' -replace '"', '\"'
  $linhas += ('  { nome: "' + $nomeJs + '", img: "imagens/' + $imgJs + '" },')
  Write-Host ("   + " + $nome) -ForegroundColor DarkGray
}

$linhas += '];'

# UTF-8 sem BOM, para o navegador ler os acentos certo
$texto = ($linhas -join "`r`n")
[IO.File]::WriteAllText($Saida, $texto, (New-Object Text.UTF8Encoding($false)))

Write-Host ''
Write-Host (" PRONTO: {0} personagens gravados." -f $arquivos.Count) -ForegroundColor Green
Write-Host (" Arquivo: {0}" -f $Saida) -ForegroundColor Green
Write-Host ''
Write-Host ' Agora abra o index.html e veja a linha embaixo dos botoes.' -ForegroundColor Cyan
Write-Host ''
Read-Host 'ENTER para fechar' | Out-Null
