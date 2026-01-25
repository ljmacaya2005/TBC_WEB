@echo off
:menu
cls
echo ====================================================
echo           THE BREW CAVE OPERATIONS MENU
echo ====================================================
echo 1. PREPARE GITHUB
echo 2. PREPARE FOLDER
echo 3. SAVE FILES
echo 4. CHECK COMMITS
echo 5. UPDATE FILES
echo 6. EXIT
echo ====================================================
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    "OPERATIONS\CMD\PREPARE GITHUB.bat"
)
if "%choice%"=="2" (
    "OPERATIONS\CMD\PREPARE FOLDER.bat"
)
if "%choice%"=="3" (
    "OPERATIONS\CMD\SAVE FILES.bat"
)
if "%choice%"=="4" (
    "OPERATIONS\CMD\CHECK COMMITS.bat"
)
if "%choice%"=="5" (
    "OPERATIONS\CMD\UDPATE FILES.bat"
)
if "%choice%"=="6" (
    exit
)
echo Invalid choice.
pause
