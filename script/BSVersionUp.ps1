﻿<#
	.SYNOPSIS
		Replace the current version number and GUID of BrowserSelector with new ones.
	.PARAMETER new_version
		BSVersionUp [new_version]
	.EXAMPLE
		BSVersionUp
		with no parameter to get the current version
	.EXAMPLE
		BSVersionUp x.y.z
		update the version number to x.y.z	
#>
# Define parameter
Param (
	[ValidatePattern('^\d{1,2}\.\d{1,2}\.\d{1,2}$')]
	[string]$new_version = 'no_value'
)
# Define Constants
Set-Variable -name VDPROJ_PATH -value "../BrowserSelectorSetup/BrowserSelectorSetup.vdproj" -Option Constant
Set-Variable -name VDPROJ_VERSION_PATTERN -value '\d{1,2}\.\d{1,2}\.\d{1,2}[\""\.]' -Option Constant
Set-Variable -name VDPROJ_VERSION_PATTERN_QUOTE -value '\d{1,2}\.\d{1,2}\.\d{1,2}"' -Option Constant
Set-Variable -name VDPROJ_VERSION_PATTERN_PERIOD -value '\d{1,2}\.\d{1,2}\.\d{1,2}\.' -Option Constant

Set-Variable -name GUID_PATTERN_TO_RENUM -value '("ProductCode"|"PackageCode")(.+)([0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12})(.+)' -Option Constant
Set-Variable -name GUID_PATTERN_PRODUCT -value '("ProductCode")(.+)([0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12})(.+)' -Option Constant
Set-Variable -name GUID_PATTERN_PACKAGE -value '("PackageCode")(.+)([0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{12})(.+)' -Option Constant

Set-Variable -name INDEX_FOR_PRODUCTCODE -value 0 -Option Constant
Set-Variable -name INDEX_FOR_PACKAGECODE -value 1 -Option Constant

$RC_PATH_ARR = "../BrowserSelector/BrowserSelector.rc",
	"../BrowserSelectorBHO/BrowserSelectorBHO.rc",
	"../BrowserSelectorTalk/BrowserSelectorTalk.rc"

Set-Variable -name RC_VERSION_PATTERN -value '\d{1,2}[,\.]\d{1,2}[,\.]\d{1,2}' -Option Constant
Set-Variable -name RC_VERSION_PERIOD -value '\d{1,2}\.\d{1,2}\.\d{1,2}' -Option Constant
Set-Variable -name RC_VERSION_COMMA -value '\d{1,2},\d{1,2},\d{1,2}' -Option Constant

# Define Variables
$new_version_comma = $new_version -Replace '\.',','
$new_version_plus_quote = $new_version + '"'
$new_version_plus_period = $new_version + '.'

$new_Guid_for_ProductCode = New-Guid
$new_Guid_for_PackageCode = New-Guid

# 1. function to extract the lines including the version number
function Extract-current_version() {
	Get-Content -Path $VDPROJ_PATH | Select-String -Pattern $VDPROJ_VERSION_PATTERN
	ForEach ($item in $RC_PATH_ARR) {
		Get-Content -Path $item | Select-String -Pattern $RC_VERSION_PATTERN
	}
}

# 2. function to update the version number and GUID
function Update-version_number($new_version) {
	# Prepare a new GUID for ProductCode and PackageCode
	# *.vdproj
	$new_code_arr = (Get-Content -Path $VDPROJ_PATH) | Select-String -Pattern $GUID_PATTERN_TO_RENUM
	$new_code_arr = ForEach-Object {$new_code_arr -Replace $GUID_PATTERN_TO_RENUM, '$1$2'}
	$new_code_arr[$INDEX_FOR_PRODUCTCODE] = $new_code_arr[$INDEX_FOR_PRODUCTCODE].TrimStart() + $new_Guid_for_ProductCode + '}"'
	$new_code_arr[$INDEX_FOR_PACKAGECODE] = $new_code_arr[$INDEX_FOR_PACKAGECODE].TrimStart() + $new_Guid_for_PackageCode + '}"'
	Write-Host $new_code_arr

	# Replace the current version with the new_version
	# *.vdproj
	(Get-Content -Path $VDPROJ_PATH) |
		ForEach-Object {$_ -Replace $VDPROJ_VERSION_PATTERN_QUOTE, $new_version_plus_quote} |
		ForEach-Object {$_ -Replace $VDPROJ_VERSION_PATTERN_PERIOD, $new_version_plus_period} |
		# Set ProductCode and PackageCode with the new GUIDs 
		ForEach-Object {$_ -Replace $GUID_PATTERN_PRODUCT, $new_code_arr[$INDEX_FOR_PRODUCTCODE]} |
		ForEach-Object {$_ -Replace $GUID_PATTERN_PACKAGE, $new_code_arr[$INDEX_FOR_PACKAGECODE]} |
		Set-Content -Path $VDPROJ_PATH -Encoding UTF8
	# Show the result of replacement on the screen
	Select-String -Path $VDPROJ_PATH -Pattern $VDPROJ_VERSION_PATTERN
	Select-String -Path $VDPROJ_PATH -Pattern $GUID_PATTERN_TO_RENUM
	Write-Host `n
	# *.rc
	ForEach ($item in $RC_PATH_ARR) {
		$replaced_content = (Get-Content -Path $item) |
			ForEach-Object {$_ -Replace $RC_VERSION_PERIOD, $new_version} |
			ForEach-Object {$_ -Replace $RC_VERSION_COMMA, $new_version_comma}
		Set-Content -Path $item -Value $replaced_content -Encoding Unicode
	# Show the result of replacement on the screen
	Select-String -Path $item -Pattern $RC_VERSION_PATTERN
	Write-Host `n
	}
}

# Switch what to do depending on the parameter value
switch ($new_version) {
	'no_value' {Extract-current_version}
	Default {Update-version_number $new_version}
}