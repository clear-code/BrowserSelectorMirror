$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path) -replace '\.Tests\.', '.'
Import-Module "$here\$sut" -Force

Describe "Target files to be existent" {
    Context "For .vdproj file" {
        It "Exist" {
            "../BrowserSelectorSetup/BrowserSelectorSetup.vdproj" | Should Exist
        } 
    }
    Context "For .rc file" {
        It "Exist" {
            "../BrowserSelector/BrowserSelector.rc" | Should Exist
        } 
        It "Exist" {
            "../BrowserSelectorBHO/BrowserSelectorBHO.rc" | Should Exist
        } 
        It "Exist" {
            "../BrowserSelectorTalk/BrowserSelectorTalk.rc" | Should Exist
        } 
    }
}
Describe "BSVersionUp" {
#    Context "Extract-current_version" {
#        It "Contain" {
#            "./testfiles/testfile.vdproj" | Should Contain "2.2.3"
#        } 
#        It "For .rc testfile" {
#            "./testfiles/testfile.rc" | Should Contain "2.2.3"
#        } 
#    }
    Context "Parameters to fail" {
        It "more than 2 digits" {
            {BSVersionUp -new_version "0.0.100"} | Should Throw
        } 
        It "negative number" {
            {BSVersionUp -new_version "-1.0.0"} | Should Throw
        } 
        It "more than 3 numbers" {
            {BSVersionUp -new_version "9.8.7.6"} | Should Throw
        } 
        It "separator is not period" {
            {BSVersionUp -new_version "1,2,3"} | Should Throw
        } 
    }
}
