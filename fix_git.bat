@echo off
echo ========================================
echo Fixing Git Repository for GitHub Desktop
echo ========================================
echo.

echo Step 1: Removing broken HEAD reference...
if exist .git\refs\remotes\origin\HEAD (
    del .git\refs\remotes\origin\HEAD
    echo   - Removed broken HEAD reference
) else (
    echo   - HEAD reference already clean
)

echo.
echo Step 2: Cleaning up Git objects...
git gc --prune=now
echo   - Git cleanup complete

echo.
echo Step 3: Fetching latest from GitHub...
git fetch origin --prune
echo   - Fetch complete

echo.
echo Step 4: Resetting remote HEAD...
git remote set-head origin main
echo   - Remote HEAD set to main

echo.
echo Step 5: Verifying status...
git status

echo.
echo ========================================
echo Git Fix Complete!
echo ========================================
echo.
echo You can now use GitHub Desktop normally.
echo.
pause
