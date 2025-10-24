Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d ""C:\Moditha_DevHub\1-Portfolio_Worthy_Projects\git-tracker-v2"" && npx electron tracker/electron/main.js", 0, False
