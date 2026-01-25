@echo off
cls
cd /d "%~dp0"
cd .
echo --- Initialize Git Repository ---
git init

:: Rename branch to 'main' to match modern GitHub standards
git branch -M main

cls
echo Repository initialized.
echo.

echo Adding remote origin...
:: The || echo... part handles cases where origin already exists
git remote add origin "https://github.com/ljmacaya2005/TBC_WEB.git" || echo Remote 'origin' already exists.
cd .
git fetch --all
git reset --hard origin/main
git clean -fd


echo.
echo Done!
pause
