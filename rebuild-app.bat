@echo off
echo ============================================
echo React Native Android Rebuild Script
echo ============================================
echo.

cd /d "%~dp0"

echo [1/6] Stopping any running Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/6] Cleaning Android build folders...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\build" rmdir /s /q "android\build"
if exist "android\.gradle" rmdir /s /q "android\.gradle"

echo.
echo [3/6] Running Gradle clean...
cd android
call gradlew clean
cd ..

echo.
echo [4/6] Cleaning Metro bundler cache...
call npx react-native start --reset-cache &
echo Waiting for Metro to start (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo [5/6] Building and installing the app...
call npx react-native run-android

echo.
echo [6/6] Done!
echo.
echo ============================================
echo If the app installed successfully, it should be running now.
echo If you see any errors, please check the output above.
echo ============================================
pause
