# BrowserSelector

## What's this?

[BrowserSelctor](https://gitlab.com/clear-code/browserselector) is a
web-browser launcher for Microsoft Windows that aims to select an appropriate
browser for an URL. Since many traditional intranet web applications still
depend on Internet Explorer, so such enterprise users need to switch IE and
modern web-browsers (such as Mozilla Firefox or Google Chrome) according to
the situation. This application will do it automatically on clicking or
entering an URL.

This software consists of two modules:

  * BrowserSelector.exe:
    The web-browser launcher. Should be set as the default web-browser on
    your desktop.
  * BrowserSelectorBHO.dll:
    A BHO (Browser Helper Object) for IE. It will launch Mozilla Firefox
    or Google Chrome to open internet sites.

We provide integration addons for modern browsers:

 * [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ifghihgjehplhamcpkmgcfjehjhkijgp) ([Enterprise Developer Edition](https://microsoftedge.microsoft.com/addons/detail/browserselector-enterrpis/hogejpljgljkhmhmbclopmhfhhenepaf))
 * [Google Chrome](https://chrome.google.com/webstore/detail/nhcenbjbddlhdkdpfkbilmjpbkiigick) ([Enterprise Developer Edition](https://chrome.google.com/webstore/detail/browserselector-enterrpis/dhclbobglmheecflidcjeabiingfmcie))
 * [Mozilla Firefox](https://addons.mozilla.org/ja/firefox/addon/browserselector/)

## How to Build

### BrowserSelector.exe and BrowserSelectorBHO.dll

#### Prerequisites

  * Microsoft Visual Studio 2019
    * C++ MFC for v142 build tools (x86 & x64)
  * Visual Studio extension "Microsoft Visual Studio Installer Projects"
    * https://marketplace.visualstudio.com/items?itemName=VisualStudioClient.MicrosoftVisualStudio2017InstallerProjects

#### Build Steps

  * Open BrowserSelector.sln by Microsoft Visual Studio 2019
  * Select "Release" (or "Debug") from the toolbar
  * Press F7 key

or you can do it in command line:

  * Open "Developer Command Prompt for VS 2019" from the start menu
  * `cd \path\to\BrowserSelector`
  * `devenv.com BrowserSelector.sln /build Release`

### Versioning policy

* The BrowserSelector binary and browser addons have their own versions for each.
  (No need to synchronize versions between the BrowserSelector binary and browser addons.)
* Tags should be created only for releases of the BrowserSelector binary.
  (No need to create tag for releases of browser addons.)

### How to release

1. Open `BrowserSelector.sln` with Microsoft Visual Studio 2019.
2. Upadte version information via the resource view.
   (Or, edit `BrowserSelector.sln` directly.)
   - `BrowserSelector/BrowserSelector.rc/Version/VS_VERSION_INFO`
     - `FILEVERSION`
     - `PRODUCTVERSION`
   - `BrowserSelectorBHO/BrowserSelectorBHO.rc/Version/VS_VERSION_INFO`
     - `FILEVERSION`
     - `PRODUCTVERSION`
   - `BrowserSelectorTalk/BrowserSelectorTalk.rc/Version/VS_VERSION_INFO`
     - `FILEVERSION`
     - `PRODUCTVERSION`
3. Update following information via the solution explorer's property pane for `BrowserSelectorSetup`.
   (Or, edit `BrowserSelectorSetup/BrowserSelectorSetup.vdproj` directly.)
   - Update UUID
     - `DeployProject.Deployable.Product.PackageCode`
     - `DeployProject.Deployable.Product.PackageCode`
   - Update version number
     - `DeployProject.Configurations.Release.OutputFilename`
     - `DeployProject.Deployable.Product.ProductVersion`
     - `DeployProject.Deployable.Product.PostBuildEvent`
4. Commit changes.
5. (require permission) Create tag with the release version, like: `git tag -a v*.*.*`
6. (require permission) Push changes to the mirror on the GitHub, like: `git push git@github.com:git@github.com:clear-code/BrowserSelectorMirror.git master`
7. (require permission) Download installers from "Artifacts" under https://github.com/clear-code/BrowserSelectorMirror/actions
8. (require permission) Sign to downloaded installers.
9. (require permission) Create new release via GitLab's UI, and upload signed installers to the release.


### Addons for browsers

Do `make` at directories for each browser under the `webextensions`, then you'll get built packages.
For example:

```console
$ cd webextensions/edge
$ make
```

For Chrome and Edge, you need to run `make dev` to create development builds with special IDs for the Native Messaging Host.
For example:

```console
$ cd webextensions/edge
$ make dev
```

Then you'll get development build under the `dev/` directory, so load it as an unpacked extension.


#### Notes for Manifest V3

BrowserSelector addon works on Chrome and Edge as expected only if the addon is installed via group policy.
(Public addons cannot have `webRequestBlocking` permission, so the addon cannot redirect loading URL to other browsers.)
You need to load development version of addons with following steps, If you are a developer of this addon.

1. Copy the `webextensions` folder of this repository to the client environment.
   Assume that it is placed at `C:\Users\Public\webextensions` .
2. Create a development package for Chrome.
   1. Launch Chrome.
   2. Go to addons manager (`chrome:extensions`).
   3. Activate `Developer mode`.
   4. Choose the folder `webextensions¥chrome` to pack the addon with `Pack extension`. (Then you'll see `chrome.crx` and `chrome.pem` at the upper folder.)
   5. Drag `chrome.crx` and drop onto Chrome's window to install it, and memorise its generated ID. For example: `egoppdngdcoikeknmbgiakconmchahhf`
   6. Uninstall the addon.
   7. Add a URL entry with the generated ID, to the list of `"allowed_origins"` in `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelectorTalkChrome.json`. For example: `"chrome-extension://egoppdngdcoikeknmbgiakconmchahhf/"`
3. Create a development package for Edge.
   1. Launch Edge.
   2. Go to addons manager (`edge:extensions`).
   3. Activate `Developer mode`.
   4. Choose the folder `webextensions¥edge` to pack the addon with `Pack extension`. (Then you'll see `edge.crx` and `edge.pem` at the upper folder.)
   5. Drag `edge.crx` and drop onto Edge's window to install it, and memorise its generated ID. For example: `oapdkmbdgdcjpacbjpcdfhncifimimcj`
   6. Uninstall the addon.
   7. Add a URL entry with the generated ID, to the list of `"allowed_origins"` in `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelectorTalkEdge.json`. For example: `"chrome-extension://oapdkmbdgdcjpacbjpcdfhncifimimcj/"`
4. Create the manifest file for installation.
   Put an XML file into the folder `chrome.crx` and `edge.crx` exist in, with following contents including IDs of Chrome addon and Edge addon.
   Assume that it is placed at `C:\Users\Public\webextensions¥manifest.xml`.
   ```xml
   <?xml version='1.0' encoding='UTF-8'?>
   <gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
     <app appid='egoppdngdcoikeknmbgiakconmchahhf'><!-- The generated ID of Chrome addon -->
       <updatecheck codebase='file:///C:/Users/Public/webextensions/chrome.crx' version='1.0.0' /><!-- Put real File URL of the `chrome.crx`. -->
     </app>
     <app appid='oapdkmbdgdcjpacbjpcdfhncifimimcj'><!-- The generated ID of Edge addon -->
       <updatecheck codebase='file:///C:/Users/Public/webextensions/edge.crx' version='1.0.0' /><!-- Put real File URL of the `edge.crx`. -->
     </app>
   </gupdate>
   ```
   Please note that you need to synchronize the value of `version` with the one in the `manifest.json`.
4. Install group policy template for Chrome and configure Chrome to load the addon.
   1. Download "Google Chrome Bundle" via https://support.google.com/chrome/a/answer/187202?hl=en#zippy=%2Cwindows and extract contents of the saved zip file.
   2. Copy `Configuration\admx\*.admx`, `Configuration\admx\en-US` and `Configuration\admx\ja` to `C:\Windows\PolicyDefinitions`.
   3. Launch `gpedit.msc` and open `Local Computer Policy` => `Computer Configuration` => `Administrative Templates` => `Google` => `Google Chrome` => `Extensions` => `Configure the list of force-installed apps and extensions`.
   4. Switch to `Enabled`.
   5. Click `Show...`.
   6. Add `<Generated ID of Chrome addon>;<File URL of the manifest XML file>` to the list.
      Assume that it is `egoppdngdcoikeknmbgiakconmchahhf;file:///C:/Users/Public/webextensions/manifest.xml`.
6. Install group policy template for Edge and configure Edge to load the addon.
   1. Download group policy template via the `Get policy files` link in https://www.microsoft.com/en-us/edge/business/download , and extract contents of the saved zip file.
   2. Copy `windows\admx\*.admx`, `windows\admx\en-US` and `windows\admx\ja` to `C:\Windows\PolicyDefinitions`.
   3. Launch `gpedit.msc` and open `Local Computer Policy` => `Computer Configuration` => `Administrative Templates` => `Microsoft Edge` => `Extensions` => `Configure the list of force-installed apps and extensions`.
   4. Switch to `Enabled`.
   5. Click `Show...`.
   6. Add `<Generated ID of Edge addon>;<File URL of the manifest XML file>` to the list.
      Assume that it is `oapdkmbdgdcjpacbjpcdfhncifimimcj;file:///C:/Users/Public/webextensions/manifest.xml`.
7. Set up the client as a domain member if it is not joined to any Active Directory domain. For example, lauch `cmd.exe` as the system administrator and run following commands.
   (Ref: https://hitco.at/blog/apply-edge-policies-for-non-domain-joined-devices/ )
   ```
   reg add HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v EnrollmentState /t reg_dword /d 1 /f
   reg add HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v EnrollmentType /t reg_dword /d 0 /f
   reg add HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v IsFederated /t reg_dword /d 0 /f
   reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v Flags /t reg_dword /d 0xd6fb7f /f
   reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v AcctUId /t reg_sz /d "0x000000000000000000000000000000000000000000000000000000000000000000000000" /f
   reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v RoamingCount /t reg_dword /d 0 /f
   reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v SslClientCertReference /t reg_sz /d "MY;User;0000000000000000000000000000000000000000" /f
   reg add HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /v ProtoVer /t reg_sz /d "1.2" /f
   ```
8. Launch Chrome and confirm the Chrome addon is automatically installed.
   (You may need to inspect [debug log](#chrome-debug-log).)
9. Launch Edge and confirm the Edge addon is automatically installed.
   (You may need to inspect [debug log](#edge-debug-log).)

You need to update crx packages if you modify codes of addons. Steps:

1. Update new package of Chrome addon.
   1. Launch Chrome.
   2. Go to addons manager `chrome:extensions`.
   3. Choose the folder `webextensions¥chrome` to pack the addon with `Pack extension`. (Then you'll need to specify `chrome.pem` as the private key.)
2. Update new package of Edge addon.
   1. Launch Edge.
   2. Go to addons manager `edge:extensions`.
   3. Choose the folder `webextensions¥edge` to pack the addon with `Pack extension`. (Then you'll need to specify `edge.pem` as the private key.)
3. Edit group policy of Chrome and Edge to deactivate force-installed addons. For example: changing `<Generated ID of the addon>;<File URL of the manifest XML file>` to `#<Generated ID of the addon>;<File URL of the manifest XML file>`.
4. Launch Chrome and Edge to confirm that addons are successfully uninstalled.
5. Exit Chrome and Edge.
6. Edit group policy of Chrome and Edge to re-activate force-installed addons. For example: changing `#<Generated ID of the addon>;<File URL of the manifest XML file>` to `<Generated ID of the addon>;<File URL of the manifest XML file>`.
7. Launch Chrome and Edge to confirm that addons are successfully installed.

If you configured the client as a fake domain member, you should re-configure the client as a non-domain member. Steps:

1. Launch `cmd.exe` as the administrator and run following commands.
   (Ref: https://hitco.at/blog/apply-edge-policies-for-non-domain-joined-devices/ )
   ```
   reg delete HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /f
   reg delete HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /f
   ```


## How to Install

Run built BrowserSelectorSetup\Release\BrowserSelectorSetup.msi.

## Change the Default Browser

If you want to switch web browsers automatically from all applications, you
need to set BrowserSelector.exe as the default browser on your desktop.
How to do it depends on your OS and situation. For example:

  * https://support.microsoft.com/en-us/help/4028606/windows-10-change-your-default-browser
  * https://docs.microsoft.com/en-us/internet-explorer/ie11-deploy-guide/set-the-default-browser-using-group-policy

If you use only the BHO and don't use BrowserSelector.exe, it's not needed.

## How to Configure

This software doesn't have any UI. System administrators have to edit its
registry entries or INI files directly and shouldn't allow users to edit them.
Configurations are loaded from following locations by this order:

  * Registry: `HKEY_LOCAL_MACHINE` (`HKLM`)
    * HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\ClearCode\BrowserSelector
	* (For 32bit OS: HKEY_LOCAL_MACHINE\SOFTWARE\ClearCode\BrowserSelector)
  * INI file: BrowserSelector.ini under the application folder
    * e.g.) C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelector.ini
	* It doesn't exist by default. Please create it manually.
  * Registry: `HKEY_CURRENT_USER` (`HKCU`)
    * HKEY_CURRENT_USER\SOFTWARE\WOW6432Node\ClearCode\BrowserSelector
    * (For 32bit OS: HKEY_CURRENT_USER\SOFTWARE\ClearCode\BrowserSelector)
  * INI file: BrowserSelector.ini under a user's AppData folder
    * e.g.) C:\Users\[UserName]\AppData\Roaming\ClearCode\BrowserSelector\BrowserSelectror.ini
	* These folder or file don't exist by default. Please create them manually.

If two or more configurations exist, they are merged (overridden by later one).

Please see the following files by way of example:

  * [For 64bit OS](sample/BrowserSelectorWOW64Example.reg)
  * [For 32bit OS](sample/BrowserSelectorExample.reg)
  * [INI file](sample/BrowserSelector.ini)
  
Available config items are almost same.
One of difference between them is that the items which are placed at the top of
the registry key, are placed at `[Common]` section in INI file.

## Config items

### `URLPatterns` or `HostNamePatterns`

#### Simple Pattern Matching

You need to set URL or hostname patterns to open them by specific browsers.
They are stored under the registry key `URLPatterns` and `HostNamePatterns` as
string values. Although you can use any characters as the value names, we
recommend to use numbers such as `0001` to clarify the priority. The value is
hostname or URL pattern. Optionally you can add a browser name to open the URL
pattern by splitting the value by `|`.

e.g.)

  * `URLPatterns`
    * `0001` = `http://*.example.com|firefox`
  * `HostNamePatterns`
    * `0001` = `*.example.org|firefox`

The following wildcard characters are supported for specifying host names or
URLs:

  * `*`: matches any string
  * `?`: matches any single character

Only URLs starting with `http:` or `https:` are supported. URLs with any other
scheme will be processed by the current browser[^only-http-and-https].

[^only-http-and-https]: This is because [there is an limitation that an explicit operation by the user is always required to allow accessing to file URLs on Chrome](https://bugs.chromium.org/p/chromium/issues/detail?id=173640#c68).

For browser names, following values are supported:

  * `ie`
  * `firefox`
  * `chrome`

When the browser name is unspecified, `DefaultBrowser` or `SecondBrowser` will
be used as described later.

#### Regular Expression

You can use regular expression forURL patterns instead of wildcards, when you set
the following registry value under the top of `BrowserSelector` key:

  * `"UseRegex"` = `dword:00000001`

On this case all patterns must be valid regular expressions, so you cannot mix
regular expression patterns and wildcard patterns.

Regular expression patterns must match to the whole URL, not partially. Prealse
remind that you must put `.*` at the end of the pattern if the pattern needs to
be matched to arbitrary paths under a specific host.

Please see the following page for the grammar of the regular expression:

  https://en.cppreference.com/w/cpp/regex/ecmascript

A browser names can be added in this case too. Please add a browser name after
`$` assertion like this:

  * `0001` = `^http(s)?://(.+\\.)?example\\.(org|com)(/.*)?$firefox`

### `ZonePatterns`

Use this option to map browsers to security zones in Internet Explorer.
The configuration syntax is the same as `URLPatterns` and `HostNamePatterns`.

e.g.)

  * `0001` = `intra|ie`
  * `0002` = `internet`

The following security zone names are supported.

  * Type: String
    * `local`
    * `intra`
    * `trusted`
    * `internet`
    * `restricted`

Note that `URLPatterns` and `HostNamePatterns` take precedence over
`ZonePatterns`.

### `DefaultBrowser`

You can change the browser for opening unmatched URLs by setting the registry
value `DefaultBrowser` under the top of `BrowserSelector` key.

  * Type: String
    * `ie`
    * `firefox`
    * `chrome`

e.g)

The default value of `DefaultBrowser` is `ie`.

### `SecondBrowser`

If you leave the browser name empty for each URL patterns, the browser
specified by `DefaultBrowser` will be used for them. If you want to change the
browser for such URL patterns, you can do it by the registry value
`SecondBrowser` under the top of `BrowserSelector` key.

  * Type: String
    * Empty (Default)
    * `ie`
    * `firefox`
    * `chrome`

e.g.)

  * `SecondBrowser` = `chrome`
  * `URLPagtterns`
    * `0001` = `http://*.example.com`
    * `0002` = `http://*.example.org`
    * ...

### `FirefoxCommand`

If you have a multiple versions of Firefox installed on your system, you can
use this option to specify which Firefox you want to launch.

 * Type: String
   * Empty (Default)
   * Local Windows Path Fromat: C:\path\to\firefox.exe

### `CloseEmptyTab`

Whether or not to close the remaining empty tab after an alternate browser is
launched.

  * Type: DWORD
    * 1: Close (Default)
    * 0: Don't close

### `OnlyOnAnchorClick`

Whether or not to launch an alternate browser only on clicking an link.

  * Type: DWORD
    * 0: Launch an alternate browser on all navigations
    * 1: Launch an alternate browser only on clicking an link

### `Include`

The path of external INI file to load additionally. Note that it does not
support recursive loading (`Include` in the child config is ignored).

  * Type: String
    * Both following formats are available.
    * Local Windows Path Fromat: `C:\path\to\file.ini`
    * UNC Format: `\\HostName\ShareName\path\to\file.ini`

### `EnableIncludeCache`

Whether or not to use a cache file when a specified external INI file isn't
available.

  * Type: DWORD
    * 0: Don't Use (Default)
    * 1: Use

The cache files are stored under `%USERPROFILE%\AppData\LocalLow` (`shell:LocalAppDataLow`) folder.

Note that the filename of cache file should be replaced from `\`, `:` to `_` in `Include`.

e.g.)

* `Include="c:\\Users\\Public\\BrowserSelector.ini"` will be cached as:
  * `C:\Users\[UserName]\AppData\LocalLow\ClearCode\BrowserSelector\C__Users_Public_BrowserSelectror.ini`

* `Include="\\\\HostName\\ShareName\\path\\to\\BrowserSelector.ini"` will be cached as:
   * `C:\Users\[UserName]\AppData\LocalLow\ClearCode\BrowserSelector\__HostName_ShareName_path_to_BrowserSelectror.ini`

## How to collect logs

### BHO debug log

1. Set a common option `Debug` to `1`.
   For example, put `Debug=1` under the `[Common]` section in the file BrowserSelector.ini.
2. Download the debug log collection tool.
   https://docs.microsoft.com/en-us/sysinternals/downloads/debugview
   (Click the "Download DebugView" link.)
3. Extract files from the downloaded file.
4. Launch `Dbgview.exe`, an extracted file, with the administrator privilege.
5. Turn on both checkboxes `Capture Win32` and `Capture Global Win32` under the `Capture` menu.
6. Reproduce the problem you need to inspect.
7. Save log file as a file via the `Save As...` command under the `File` menu.

### Chrome debug log

1. Copy a shortcut to Chrome to the desktop (or anywhere).
2. Right click on the shortcut and choose "Property".
3. Add a command line option ` --enable-logging=1` at the end of the "link target" field.
   (Please note that you put a space between the path to the exe file and the added option.)
4. Launch Chrome with the shortcut.
5. Reproduce the problem you need to inspect.
6. Exit Chrome.
7. Get the log file generated at `%LocalAppData%\Google\Chrome\User Data\chrome_debug.log`.

### Edge debug log

1. Copy a shortcut to Edge to the desktop (or anywhere).
2. Right click on the shortcut and choose "Property".
3. Add a command line option ` --enable-logging=1` at the end of the "link target" field.
   (Please note that you put a space between the path to the exe file and the added option.)
4. Launch Edge with the shortcut.
5. Reproduce the problem you need to inspect.
6. Exit Edge.
7. Get the log file generated at `%LocalAppData%\Microsoft\Edge\User Data\chrome_debug.log`.

