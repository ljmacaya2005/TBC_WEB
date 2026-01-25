@echo off
cd /d "%~dp0"
cd .
echo Target Branch: [main]
echo.

echo Adding all files...
git add .

echo.
set /p "user_message=Enter commit message: "

:: specific check to ensure message isn't empty
if "%user_message%"=="" set user_message=Auto-update %date% %time%

git commit -m "%user_message%"

echo.
echo Pushing branch 'main' to origin...
git push -u origin main

echo.
if %errorlevel% neq 0 (
    echo [ERROR] Push failed. Check your internet or login credentials.
) else (
    echo [SUCCESS] Push complete!
)

pause
"OPERATIONS_MENU.bat"