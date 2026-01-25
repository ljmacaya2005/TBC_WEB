@echo off
cls
cd /d "%~dp0"
cd .
echo --- Git Global Configuration ---
set /p "user_name=Enter Git user.name (e.g. John Doe): "
set /p "user_email=Enter Git user.email (e.g. email@example.com): "

echo.
echo Setting Git global configs...
git config --global user.name "%user_name%"
git config --global user.email "%user_email%"

echo.
echo --- Verification ---
git config --global user.name
git config --global user.email
echo.
echo Git config saved!
pause
"OPERATIONS_MENU.bat"