REM
REM ダミーのドメインから離脱する
REM See https://hitco.at/blog/apply-edge-policies-for-non-domain-joined-devices/

reg delete HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /f
reg delete HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /f
