@echo off
chcp 65001 >nul
title Subir para o GitHub
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\subir.ps1"
