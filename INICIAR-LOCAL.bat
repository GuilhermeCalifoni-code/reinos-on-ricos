@echo off
setlocal EnableExtensions

REM Reinos Oníricos — inicializador exclusivamente local.
REM Este arquivo NAO publica, envia, faz deploy nem abre portas externas.
REM O sistema fica disponivel somente em http://127.0.0.1:3000

cd /d "%~dp0"
title Reinos Oniricos - Servidor Local
set "URL=http://127.0.0.1:3000"

echo.
echo ======================================================
echo   REINOS ONIRICOS - MODO LOCAL

echo   Nenhum dado sera publicado ou enviado.
echo   Endereco: %URL%
echo ======================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao foi encontrado.
  echo Instale o Node.js e execute este arquivo novamente.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao foi encontrado.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [1/2] Instalando dependencias locais. Isso acontece somente na primeira vez...
  call npm install --legacy-peer-deps --ignore-scripts --no-package-lock
  if errorlevel 1 (
    echo [ERRO] Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)

if not exist "node_modules\@rolldown\binding-win32-x64-msvc\" (
  echo [2/2] Preparando o motor local do Vite...
  call npm install --no-save --legacy-peer-deps --ignore-scripts @rolldown/binding-win32-x64-msvc@1.2.9
  if errorlevel 1 (
    echo [ERRO] Nao foi possivel preparar o Vite local.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando servidor local...
echo O navegador abrira automaticamente em alguns segundos.
echo Para encerrar, pressione Ctrl+C nesta janela.
echo.

start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process '%URL%'"
call npm run dev -- --host 127.0.0.1

endlocal
