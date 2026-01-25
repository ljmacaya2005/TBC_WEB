@echo off
color 0A
title GitHub Deployment
echo ==============================================
echo        DEPLOYING WEBSITE TO GITHUB
echo ==============================================
echo.

:: Check git status
git status
echo.

:: Add all files
echo [1/3] Adding files...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Error adding files.
    pause
    exit /b
)

:: Commit
echo [2/3] Committing changes...
git diff-index --quiet HEAD --
if %ERRORLEVEL% EQU 0 (
    echo No changes to commit.
) else (
    :: Get timestamp for commit message
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%
    
    git commit -m "Auto-deploy: %timestamp%"
    if %ERRORLEVEL% NEQ 0 (
        echo Error committing changes.
        pause
        exit /b
    )
)

:: Push
echo [3/3] Pushing to Make sure your internet is connected...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to push to GitHub.
    echo Please check your internet connection and permissions.
    pause
    exit /b
)

echo.
echo ==============================================
echo           DEPLOYMENT SUCCESSFUL
echo ==============================================
echo.
echo Window will close in 5 seconds...
timeout /t 5 >nul
