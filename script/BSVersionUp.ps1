# Define Constants
Set-Variable -name VDPROJPATH -value "../BrowserSelectorSetup/BrowserSelectorSetup.vdproj" -Option Constant
# Path for Test
#Set-Variable -name VDPROJPATH -value "../work/BrowserSelectorSetup.vdproj" -Option Constant
Set-Variable -name VDPROJVERSIONPATTERN -value '\d{1,2}\.\d{1,2}\.\d{1,2}[\""\.]' -Option Constant
Set-Variable -name VDPROJVERSIONPATTERN_QUOTE -value '\d{1,2}\.\d{1,2}\.\d{1,2}"' -Option Constant
Set-Variable -name VDPROJVERSIONPATTERN_PERIOD -value '\d{1,2}\.\d{1,2}\.\d{1,2}\.' -Option Constant

Set-Variable -name GUIDPATTERN_TORENUM -value '("ProductCode"|"PackageCode")(.+)([0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12})(.+)' -Option Constant
Set-Variable -name GUIDPATTERN_PRODUCT -value '("ProductCode")(.+)([0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12})(.+)' -Option Constant
Set-Variable -name GUIDPATTERN_PACKAGE -value '("PackageCode")(.+)([0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12})(.+)' -Option Constant

$RCPATHARR = "../BrowserSelector/BrowserSelector.rc",
	"../BrowserSelectorBHO/BrowserSelectorBHO.rc",
	"../BrowserSelectorTalk/BrowserSelectorTalk.rc"
# Path for Test
#$RCPATHARR = "../work/BrowserSelector.rc",
#	"../work/BrowserSelectorBHO.rc",
#	"../work/BrowserSelectorTalk.rc"
Set-Variable -name RCVERSIONPATTERN -value '\d{1,2}[,\.]\d{1,2}[,\.]\d{1,2}' -Option Constant
Set-Variable -name RCVERSIONPERIOD -value '\d{1,2}\.\d{1,2}\.\d{1,2}' -Option Constant
Set-Variable -name RCVERSIONCOMMA -value '\d{1,2},\d{1,2},\d{1,2}' -Option Constant

# Define Variables
$newversion = '2.2.4'
$newversion_comma = $newversion -Replace '\.',','
$newversion_quote = $newversion + '"'
$newversion_period = $newversion + '.'

$newGuid0 = New-Guid
$newGuid1 = New-Guid

# Extract the lines including VersionNumber
#Get-Content -Path $VDPROJPATH | Select-String -Pattern $VDPROJVERSIONPATTERN
#ForEach ($item in $RCPATHARR) {
#	Get-Content -Path $item | Select-String -Pattern $RCVERSIONPATTERN
#}

# Prepare a new GUID for ProductCode and PackageCode
# *.vdproj
$newcode = (Get-Content -Path $VDPROJPATH) | Select-String -Pattern $GUIDPATTERN_TORENUM
$newcode = ForEach-Object {$newcode -Replace $GUIDPATTERN_TORENUM, '$1$2'}
$newcode[0] = $newcode[0].TrimStart() + $newGuid0 + '}"'
$newcode[1] = $newcode[1].TrimStart() + $newGuid1 + '}"'
Write-Host $newcode

# Replace the current version with the newversion
# *.vdproj
(Get-Content -Path $VDPROJPATH) |
	ForEach-Object {$_ -Replace $VDPROJVERSIONPATTERN_QUOTE, $newversion_quote} |
	ForEach-Object {$_ -Replace $VDPROJVERSIONPATTERN_PERIOD, $newversion_period} |
	# Set ProductCode and PackageCode with the new GUIDs 
	ForEach-Object {$_ -Replace $GUIDPATTERN_PRODUCT, $newcode[0]} |
	ForEach-Object {$_ -Replace $GUIDPATTERN_PACKAGE, $newcode[1]} |
	Set-Content -Path $VDPROJPATH -Encoding UTF8
# Show the result of replacement on the screen
Select-String -Path $VDPROJPATH -Pattern $VDPROJVERSIONPATTERN
Select-String -Path $VDPROJPATH -Pattern $GUIDPATTERN_TORENUM
Write-Host `n
# *.rc
ForEach ($item in $RCPATHARR) {
	$replacedcontent = (Get-Content -Path $item) |
		ForEach-Object {$_ -Replace $RCVERSIONPERIOD, $newversion} |
		ForEach-Object {$_ -Replace $RCVERSIONCOMMA, $newversion_comma}
	Set-Content -Path $item -Value $replacedcontent -Encoding Unicode
	# Show the result of replacement on the screen
	Select-String -Path $item -Pattern $RCVERSIONPATTERN
	Write-Host `n
}
