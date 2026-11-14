@echo off
setlocal
cd /d "%~dp0"
set "TD_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "TD_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Install Node.js 22 or later to run this preview.
    pause
    exit /b 1
  )
)
"%TD_NODE%" scripts\serve.mjs
pause
