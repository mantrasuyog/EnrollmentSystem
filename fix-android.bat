@echo off
echo Cleaning React Native Android Build...

cd /d "%~dp0"

echo Step 1: Cleaning Android build folders...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\build" rmdir /s /q "android\build"
if exist "android\.gradle" rmdir /s /q "android\.gradle"

echo Step 2: Cleaning Gradle cache...
cd android
call gradlew clean
cd ..

echo Step 3: Removing node_modules...
if exist "node_modules" rmdir /s /q "node_modules"

echo Step 4: Removing package-lock.json...
if exist "package-lock.json" del /f /q "package-lock.json"

echo Step 5: Reinstalling dependencies...
call npm install

echo Step 6: Starting Metro with cache reset...
echo Run this in a separate terminal: npm start -- --reset-cache

echo Step 7: Building Android app...
echo After Metro starts, run: npm run android

echo.
echo Cleanup complete! Now:
echo 1. Open a terminal and run: npm start -- --reset-cache
echo 2. Open another terminal and run: npm run android
pause
