REM
REM ダミーのドメインに参加状態にする
REM See https://hitco.at/blog/apply-edge-policies-for-non-domain-joined-devices/

reg add HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v EnrollmentState /t reg_dword /d 1 /f
reg add HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v EnrollmentType /t reg_dword /d 0 /f
reg add HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v IsFederated /t reg_dword /d 0 /f
reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v Flags /t reg_dword /d 0xd6fb7f /f
reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v AcctUId /t reg_sz /d "0x000000000000000000000000000000000000000000000000000000000000000000000000" /f
reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v RoamingCount /t reg_dword /d 0 /f
reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v SslClientCertReference /t reg_sz /d "MY;User;0000000000000000000000000000000000000000" /f
reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v ProtoVer /t reg_sz /d "1.2" /f
