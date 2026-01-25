@echo off
cd /d "%~dp0"
cd ..\..
echo Checking commits...
echo.

:: --graph shows the tree lines, --decorate shows branch names/tags
git log --oneline --graph --all --decorate

echo.
pause
"OPERATIONS_MENU.bat"