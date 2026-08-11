@echo off
chcp 65001 >nul
title Baixar poneis da wiki
cd /d "%~dp0"

echo.
echo  ================================================
echo   BAIXAR PERSONAGENS - MLP Fandom (pt)
echo  ================================================
echo.
echo   1 - Listar personagens (gera personagens.txt)
echo   2 - Baixar imagens da lista
echo   3 - Testar com apenas 5 personagens
echo   4 - Fazer tudo de uma vez
echo.

set /p opcao="Escolha (1-4): "

if "%opcao%"=="1" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0baixar-poneis.ps1" -Listar
if "%opcao%"=="2" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0baixar-poneis.ps1" -Baixar
if "%opcao%"=="3" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0baixar-poneis.ps1" -Limite 5
if "%opcao%"=="4" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0baixar-poneis.ps1"
