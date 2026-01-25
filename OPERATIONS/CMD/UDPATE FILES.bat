@echo off
cd /d "%~dp0"
cd ..\..
git fetch --all
git reset --hard origin/main

pause
"OPERATIONS_MENU.bat"