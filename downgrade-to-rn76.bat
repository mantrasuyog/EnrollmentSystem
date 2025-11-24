@echo off
echo =====================================================
echo React Native 0.76 Downgrade Script
echo This will fix the StyleSheet.create error
echo =====================================================
echo.

cd /d "%~dp0"

echo [1/8] Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/8] Cleaning node_modules...
if exist "node_modules" rmdir /s /q "node_modules"

echo.
echo [3/8] Cleaning Android build...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\build" rmdir /s /q "android\build"
if exist "android\.gradle" rmdir /s /q "android\.gradle"

echo.
echo [4/8] Removing package-lock.json...
if exist "package-lock.json" del /f /q "package-lock.json"

echo.
echo [5/8] Updating to React Native 0.76.9...
call npm install react@18.3.1 react-native@0.76.9

echo.
echo [6/8] Installing dependencies...
call npm install

echo.
echo [7/8] Cleaning Gradle...
cd android
call gradlew clean
cd ..

echo.
echo [8/8] Done! Now run these commands:
echo.
echo Terminal 1:
echo   npx react-native start --reset-cache
echo.
echo Terminal 2:
echo   npx react-native run-android
echo.
echo =====================================================
pause
