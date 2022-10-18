$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path) -replace '\.Tests\.ps1', '.psm1'
Import-Module "$here\$sut" -Force

Describe "BSVersionUp" {
    It "does something useful" {
        $true | Should Be $false
    }
}
