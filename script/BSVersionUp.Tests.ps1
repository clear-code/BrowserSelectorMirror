# Invoke these tests at '\browserselector\script' 

Describe "Check if the current version is proper" {
    Context "Compare the extracted current version to the expected" {
        $result = .\BSVersionUp.ps1
        It "Validity of the current version" {
            # Be sure to update this number according to the version it should be
            $result | Should Match "2.2.3"
            # 
        }
    }
}

Describe "Target files to be existent" {
    Context "For .vdproj file" {
        It "Exist BrowserSelectorSetup.vdproj" {
            "../BrowserSelectorSetup/BrowserSelectorSetup.vdproj" | Should Exist
        } 
    }
    Context "For .rc file" {
        It "Exist BrowserSelector.rc" {
            "../BrowserSelector/BrowserSelector.rc" | Should Exist
        } 
        It "Exist BrowserSelectorBHO.rc" {
            "../BrowserSelectorBHO/BrowserSelectorBHO.rc" | Should Exist
        } 
        It "Exist BrowserSelectorTalk.rc" {
            "../BrowserSelectorTalk/BrowserSelectorTalk.rc" | Should Exist
        } 
    }
}

Describe "Other BSVersionUp tests" {
    Context "Parameters to fail would include " {
        It "One that consists of more than 2 digits" {
            {.\BSVersionUp.ps1 -new_version 0.0.100} | Should Throw
        } 
        It "Negative number" {
            {.\BSVersionUp -new_version -1.0.0} | Should Throw
        } 
        It "More than 3 numbers in total" {
            {.\BSVersionUp -new_version 9.8.7.6} | Should Throw
        } 
        It "Any invalid separator other than period" {
            {.\BSVersionUp -new_version 1,2,3} | Should Throw
        } 
    }
}
