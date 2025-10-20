@echo off
cd /d "C:\Moditha_DevHub\1-Portfolio_Worthy_Projects\git-tracker-v2\tracker"
echo [%date% %time%] Starting Git-Tracker...
node coreTracker.js
echo [%date% %time%] Git-Tracker finished with exit code %errorlevel%.
exit /b 0
