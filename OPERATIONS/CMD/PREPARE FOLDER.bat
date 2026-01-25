@echo off
cd /d "%~dp0"
cd ..\..
echo --- Initialize Git Repository ---
git init

:: Rename branch to 'main' to match modern GitHub standards
git branch -M main

cls
echo Repository initialized.
echo.
set /p "github_name=Enter GitHub Username: "
echo Host Github Account: https://github.com/%github_name%/
echo.
set /p "repo_name=Enter repository name: "

echo.
echo Adding remote origin...
:: The || echo... part handles cases where origin already exists
git remote add origin "https://github.com/%github_name%/%repo_name%.git" || echo Remote 'origin' already exists.

echo.
echo Done!
pause
"OPERATIONS_MENU.bat"