Set fso = CreateObject("Scripting.FileSystemObject")
dossier = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = dossier
sh.Run "cmd /c npm.cmd start", 0