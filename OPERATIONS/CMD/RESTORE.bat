@echo off
setlocal

echo --- RECENT COMMITS ---
pushd "..\.."
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Could not find TheBrewCave folder.
    echo Please make sure you are running this from OPERATIONS\CMD
    pause
    exit /b
)

git log -n 10 --oneline
echo.

set /p commit_id="Enter the Commit ID (Hash) you want to restore to: "

echo.
echo WARNING: This will set your files to the state of commit %commit_id%.
echo Choose an option:
echo [1] Soft Restore (Keeps your current work, just moves the 'pointer')
echo [2] Hard Restore (DELETES uncommitted changes and forces folder to match that ID)
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    git reset --soft %commit_id%
    echo State moved. Your files are still intact but ready to be re-committed.
) else if "%choice%"=="2" (
    git reset --hard %commit_id%
    echo Folder state fully restored to %commit_id%.
    
    echo.
    echo [RESTORE TO LIVE SITE]
    set /p apply="Do you want to apply this restored state to the main website folder? (Y/N): "
    if /i "%apply%"=="Y" (
        echo Restoring files to Project Root...
        :: Copy from Current (DEPLOYMENT) to Parent (TheBrewCave)
        :: /E = Recursive, /XO = Exclude Older (Only overwrite if source is different/newer? No, we want exact restore. Actually standard copy is fine).
        :: We use /IS (Include Same) to force overwrite or just standard robocopy defaults (overwrites if different).
        robocopy . .. /E /XD .git WORKSPACE DEPLOYMENT /XF DEPLOY_TO_GITHUB.bat /R:3 /W:1
        echo Restore Complete.
    )
) else (
    echo Invalid choice. Exiting.
)

popd
pause