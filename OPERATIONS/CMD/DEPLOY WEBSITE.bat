@echo off
color 0A
title GitHub Deployment
echo ==============================================
echo        DEPLOYING WEBSITE TO GITHUB
echo ==============================================
echo.

:: Prompt for version
set /p VERSION=Enter Version (e.g., 4.0): 
if "%VERSION%"=="" (
    echo Version cannot be empty.
    pause
    exit /b
)

:: Define Paths
set "SOURCE_DIR=."
set "BACKUP_DIR=.\WORKSPACE\THEBREWCAVE%VERSION%"
set "DEPLOY_DIR=.\DEPLOYMENT"

echo [0/3] Backing up and Syncing files...

:: 1. Copy from Root to WORKSPACE/THEBREWCAVE<VERSION>
echo    - Creating Backup at %BACKUP_DIR%...
robocopy "%SOURCE_DIR%" "%BACKUP_DIR%" /MIR /XD WORKSPACE DEPLOYMENT .git /XF DEPLOY_TO_GITHUB.bat /R:3 /W:5
if %ERRORLEVEL% GEQ 8 (
    echo [ERROR] Backup failed. Robocopy exit code: %ERRORLEVEL%
    pause
    exit /b
)

:: 2. Copy from Backup to DEPLOYMENT (Current Folder)
echo    - Syncing to DEPLOYMENT folder...
robocopy "%BACKUP_DIR%" "%DEPLOY_DIR%" /MIR /XD .git /R:3 /W:5
if %ERRORLEVEL% GEQ 8 (
    echo [ERROR] Sync to Deployment failed. Robocopy exit code: %ERRORLEVEL%
    pause
    exit /b
)

echo.

cd DEPLOYMENT
echo Current Directory: %CD%

git status
echo.

:: Add all files
echo [1/3] Adding files...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Error adding files.
    pause
    cd ..
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
        cd ..
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
    cd ..
    exit /b
)

cd ..

echo.
echo ==============================================
echo           DEPLOYMENT SUCCESSFUL
echo ==============================================
echo.
echo Window will close in 5 seconds...
timeout /t 5 >nul
