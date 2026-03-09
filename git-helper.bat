@echo off
echo ========================================
echo   ProConnect - GitHub Push Helper
echo ========================================
echo.

:menu
echo Choose an option:
echo 1. Initialize Git (First time only)
echo 2. Add all files and commit
echo 3. Push to GitHub
echo 4. Full setup (Init + Add + Commit + Push)
echo 5. Check status
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto init
if "%choice%"=="2" goto commit
if "%choice%"=="3" goto push
if "%choice%"=="4" goto full
if "%choice%"=="5" goto status
if "%choice%"=="6" goto end

:init
echo.
echo Initializing Git repository...
git init
echo.
set /p name="Enter your name: "
set /p email="Enter your email: "
git config --global user.name "%name%"
git config --global user.email "%email%"
echo Git initialized successfully!
echo.
pause
goto menu

:commit
echo.
set /p message="Enter commit message: "
git add .
git commit -m "%message%"
echo.
echo Files committed successfully!
echo.
pause
goto menu

:push
echo.
echo Pushing to GitHub...
git push -u origin main
echo.
echo Pushed successfully!
echo.
pause
goto menu

:full
echo.
echo Step 1: Initializing Git...
git init
echo.
set /p name="Enter your name: "
set /p email="Enter your email: "
git config --global user.name "%name%"
git config --global user.email "%email%"
echo.
echo Step 2: Adding files...
git add .
echo.
echo Step 3: Committing...
set /p message="Enter commit message: "
git commit -m "%message%"
echo.
echo Step 4: Connecting to GitHub...
set /p repo="Enter GitHub repository URL (e.g., https://github.com/username/repo.git): "
git remote add origin %repo%
git branch -M main
echo.
echo Step 5: Pushing to GitHub...
git push -u origin main
echo.
echo All done! Your code is on GitHub!
echo.
pause
goto menu

:status
echo.
git status
echo.
pause
goto menu

:end
echo.
echo Goodbye!
exit
