$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path) -replace '\.Tests\.', '.'
Import-Module "$here\$sut" -Force

Describe "BSVersionUp" {
    Context "Extract-current_version" {
        It "For .vdproj testfile" {
            "./testfile.vdproj" | Should Be "2.2.3"
        } 
        It "For .rc testfile" {
            "./testfile.rc" | Should Be "2.2.3"
        } 
    }
    It "does something useful" {
        $true | Should Be $false
    }
}
