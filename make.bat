@REM Defines the certificate to use for signatures.
@REM Use Powershell to find the available certs:
@REM
@REM PS> Get-ChildItem -Path Cert:CurrentUser\My
@REM
set cert=1F02225E5C681EFACE0520494285DAF0D24987DF
set timestamp=http://timestamp.digicert.com
set VSAPPIDDIR=
set VSAPPIDNAME=devenv.exe

@REM ==================
@REM Compile C# sources
@REM ==================
msbuild BrowserSelector.sln /p:Configuration=Release /p:Platform=Win32

@REM ==================
@REM Sign source code
@REM ==================
signtool sign /t %timestamp% /fd SHA1 /sha1 %cert% Release\BrowserSelectorBHO.dll
signtool sign /t %timestamp% /fd SHA1 /sha1 %cert% x64\Release\BrowserSelectorBHO64.dll
signtool sign /t %timestamp% /fd SHA1 /sha1 %cert% Release\BrowserSelector.exe
signtool sign /t %timestamp% /fd SHA1 /sha1 %cert% Release\BrowserSelectorTalk.exe

@REM ==================
@REM Create Installer
@REM ==================
devenv BrowserSelectorSetup/BrowserSelectorSetup.vdproj /Build "Release|Win32"
signtool sign /t %timestamp% /fd SHA1 /sha1 %cert% BrowserSelectorSetup\Release\*.msi