@echo off
chcp 65001 >nul
title Gerar lista de personagens
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\gerar-lista.ps1"
