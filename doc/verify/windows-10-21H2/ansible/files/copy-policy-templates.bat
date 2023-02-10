REM
REM c:\Users\Public配下にchrome,edgeのポリシーテンプレートがある想定
REM

REM MicrosoftEdgePolicyTemplates.zipがedgeとして展開されている想定
xcopy /F /E /Y /V edge\windows\admx\*.admx c:\Windows\PolicyDefinitions\
xcopy /F /E /Y /V edge\windows\admx\en-US c:\Windows\PolicyDefinitions\en-US
xcopy /F /E /Y /V edge\windows\admx\ja-JP c:\Windows\PolicyDefinitions\ja-JP

REM policy_templates.zipがchromeとして展開されている想定
xcopy /F /E /Y /V chrome\windows\admx\*.admx c:\Windows\PolicyDefinitions\
xcopy /F /E /Y /V chrome\windows\admx\en-US c:\Windows\PolicyDefinitions\en-US
xcopy /F /E /Y /V chrome\windows\admx\ja-JP c:\Windows\PolicyDefinitions\ja-JP


