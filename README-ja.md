# BrowserSelector

## これは何？

[BrowserSelctor](https://gitlab.com/clear-code/browserselector)はMicrosoft
Windows上で動作するウェブブラウザラウンチャーです。開くURLに応じて適切なウェブ
ブラウザを選択します。イントラネット用ウェブアプリケーションでは今なおInternet
Explorer（以下IE）のみを対象としたものが数多く存在するため、企業ユーザーは状況
に応じてIEとモダンブラウザ（Mozilla FirefoxやGoogle Chrome）を切り替えて使用す
る必要性に迫られています。このアプリケーションは、URLをクリックしたり、ロケーシ
ョンエントリにURLを入力したりする際に自動的に適切なウェブブラウザを選択します。

このソフトウェアは以下の2つのモジュールから成ります。

  * BrowserSelector.exe:
    ウェブブラウザラウンチャーです。
    既定のウェブブラウザとして設定して使用します。
  * BrowserSelectorBHO.dll:
    IE用のBHO（ブラウザーヘルパーオブジェクト）です。
    URLを開く際に、自動的にMozilla FirefoxやGoogle Chromeに切り替えます。

モダンブラウザ向けの連携アドオンも提供しています：

 * [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/ifghihgjehplhamcpkmgcfjehjhkijgp) ([Enterprise Developer Edition](https://microsoftedge.microsoft.com/addons/detail/browserselector-enterrpis/hogejpljgljkhmhmbclopmhfhhenepaf))
 * [Google Chrome](https://chrome.google.com/webstore/detail/nhcenbjbddlhdkdpfkbilmjpbkiigick) ([Enterprise Developer Edition](https://chrome.google.com/webstore/detail/browserselector-enterrpis/dhclbobglmheecflidcjeabiingfmcie))
 * [Mozilla Firefox](https://addons.mozilla.org/ja/firefox/addon/browserselector/)

## ビルド方法

### BrowserSelector.exe および BrowserSelectorBHO.dll

#### 必要なもの

  * Microsoft Visual Studio 2019
    * v142ビルドツール用C++ MFC (x86およびx64)
  * Visual Studio拡張機能「Microsoft Visual Studio Installer Projects」
    * https://marketplace.visualstudio.com/items?itemName=VisualStudioClient.MicrosoftVisualStudio2017InstallerProjects

#### ビルド手順

  * Microsoft Visual Studio 2010でBrowserSelector.slnを開きます
  * ツールバーの「ソリューション構成」で「リリース」を選択します
  * F7キーを押下してビルドします

あるいはコマンドラインで実行することもできます。

  * スタートメニューから「Developer Command Prompt for VS 2019」を開く
  * `cd \path\to\BrowserSelector`
  * `devenv.com BrowserSelector.sln /build Release`

### バージョン付けのポリシー

* BrowserSelector本体のバージョンとアドオンのバージョンは同期せず、それぞれ別々に管理する。
* tagはBrowserSelector本体のバージョンに対してのみ作成する。（アドオンの改修に対してはtagは作成しない）

### リリース手順

[StepsToRelease.md](./doc/StepsToRelease.md)を参照

### ブラウザー用アドオン

`webextensions` 配下の各ディレクトリーで `make` を実行すると、パッケージが作成されます。

```console
$ cd webextensions/edge
$ make
```

ChromeおよびEdgeにおいては、Native Messaging Hostとの通信の都合上、開発段階においては `make dev` で開発用のIDを伴ったビルドを作成する必要があります。

```console
$ cd webextensions/edge
$ make dev
```

このようにして `dev/` 配下に生成されたデバッグビルドを、パッケージ化されていない拡張機能として読み込んでください。

#### Manifest V3での注意点

ChromeおよびEdgeでは、BrowserSelectorのアドオンはグループポリシー経由で強制インストールされた場合のみ期待通りに機能します。
（一般公開のアドオンでは`webRequestBlocking`の権限が無効化されるため、リクエストを他のブラウザーにリダイレクトすることができません。）
開発段階での動作テストには、以下の手順を経る必要があります。


1. このリポジトリーの `webextensions` フォルダーを、端末上の任意の場所にコピーする。
   ここでは `C:\Users\Public\webextensions` の位置に置いたと仮定する。
2. Chrome用アドオンの開発版パッケージを用意する。
   1. Chromeを起動する。
   2. アドオンの管理画面（`chrome:extensions`）を開く。
   3. `デベロッパーモード` を有効化する。
   4. `拡張機能をパッケージ化` で `webextensions¥chrome` をパックする。（1つ上のディレクトリーに `chrome.crx` と `chrome.pem` が作られる）
   5. `chrome.crx` をChromeのアドオン管理画面にドラッグ＆ドロップし、インストールして、IDを控える。例：`egoppdngdcoikeknmbgiakconmchahhf`
   6. アドオンを一旦アンインストールする。
   7. `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelectorTalkChrome.json` の `"allowed_origins"` に、先ほど控えたIDに基づくURLを追加する。例：`"chrome-extension://egoppdngdcoikeknmbgiakconmchahhf/"`
3. Edgeアドオンの開発版パッケージを用意する。
   1. Edgeを起動する。
   2. アドオンの管理画面（`edge:extensions`）を開く。
   3. `開発者モード` を有効化する。
   4. `拡張機能のパック` で `webextensions¥edge` をパックする。（1つ上のディレクトリーに `edge.crx` と `edge.pem` が作られる）
   5. `edge.crx` をEdgeのアドオン管理画面にドラッグ＆ドロップし、インストールして、IDを控える。例：`oapdkmbdgdcjpacbjpcdfhncifimimcj`
   6. アドオンを一旦アンインストールする。
   7. `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelectorTalkEdge.json` の `"allowed_origins"` に、先ほど控えたIDに基づくURLを追加する。例：`"chrome-extension://oapdkmbdgdcjpacbjpcdfhncifimimcj/"`
4. インストール用マニフェストファイルを作成する。
   先ほど控えたChromeアドオンとEdgeアドオンのIDを含める形で、以下のような内容のXMLファイルを作成し、`chrome.crx` や `edge.crx` と同じ位置に置く。
   ここでは `C:\Users\Public\webextensions¥manifest.xml` の位置に置いたと仮定する。
   ```xml
   <?xml version='1.0' encoding='UTF-8'?>
   <gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
     <app appid='egoppdngdcoikeknmbgiakconmchahhf'><!-- 先ほど控えたChrome用アドオンのIDを書く -->
       <updatecheck codebase='file:///C:/Users/Public/webextension/chrome.crx' version='1.0.0' /><!-- `chrome.crx` の実際のFile URLを書く -->
     </app>
     <app appid='oapdkmbdgdcjpacbjpcdfhncifimimcj'><!-- 先ほど控えたEdge用アドオンのIDを書く -->
       <updatecheck codebase='file:///C:/Users/Public/webextension/edge.crx' version='1.0.0' /><!-- `edge.crx` の実際のFile URLを書く -->
     </app>
   </gupdate>
   ```
   このとき、`version` の値は `manifest.json` に記述された実際のバージョンに合わせる。
5. Chromeのグループポリシーテンプレートを導入し、Chromeでアドオンを読み込むための設定を行う。
   1. https://support.google.com/chrome/a/answer/187202?hl=ja#zippy=%2Cwindows
      から`Google Chromeバンドル`をダウンロードし、保存されたzipファイルを展開する。
   2. `Configuration\admx\*.admx` と、`Configuration\admx\en-US` や `Configuration\admx\ja` などを `C:\Windows\PolicyDefinitions` にコピーする。
   3. `gpedit.msc` を起動し、`Local Computer Policy` → `Computer Configuration` → `Administrative Templates` → `Google` → `Google Chrome` → `Extensions` → `Configure the list of force-installed apps and extensions` （`ローカル コンピューター ポリシー` → `コンピューターの構成` →` 管理用テンプレート` → `Google` → `Google Chrome` → `拡張機能` → `自動インストールするアプリと拡張機能のリストの設定`）を開く。
   4. 設定値を `Enabled`（有効）に切り替える。
   5. `Show...` （`表示...`）をクリックする。
   6. 設定のデータ一覧に `<ChromeアドオンのID>;<マニフェストファイルの位置>` を追加する。
      ここまでの例に倣った場合、`egoppdngdcoikeknmbgiakconmchahhf;file:///C:/Users/Public/webextension/manifest.xml` のようになる。
6. Edgeのグループポリシーテンプレートを導入し、Chromeでアドオンを読み込むための設定を行う。
   1. https://www.microsoft.com/ja-jp/edge/business/download
      の「ポリシー ファイルを取得」からポリシーテンプレートをダウンロードし、保存されたMicrosoftEdgePolicyTemplates.cabファイル(zipをcabで再圧縮されている)を展開する。
   2. `windows\admx\*.admx` と、`windows\admx\en-US` や `windows\admx\ja-JP` などを `C:\Windows\PolicyDefinitions` にコピーする。
   3. `gpedit.msc` を起動し、`Local Computer Policy` → `Computer Configuration` → `Administrative Templates` → `Microsoft Edge` → `Extensions` → `Configure the list of force-installed apps and extensions` （`ローカル コンピューター ポリシー` → `コンピューターの構成` →` 管理用テンプレート` → `Microsoft Edge` → `拡張機能` → `サイレント インストールされる拡張機能を制御する`）を開く。
   5. 設定値を `Enabled`（有効）に切り替える。
   6. `Show...` （`表示...`）をクリックする。
   7. 設定のデータ一覧に `<EdgeアドオンのID>;<マニフェストファイルの位置>` を追加する。
      ここまでの例に倣った場合、`oapdkmbdgdcjpacbjpcdfhncifimimcj;file:///C:/Users/Public/webextension/manifest.xml` のようになる。
7. 端末がドメイン参加状態でない場合、管理者権限で `cmd.exe` を開き、以下のコマンド群を実行してドメイン参加状態にする。
   （参考： https://hitco.at/blog/apply-edge-policies-for-non-domain-joined-devices/ ）
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
8. Chromeを起動し、アドオンが自動的にインストールされることを確認する。
   （もしインストールされなかった場合、[デバッグログ](#chrome-debug-log)を参照する。）
9. Edgeを起動し、アドオンが自動的にインストールされることを確認する。
   （もしインストールされなかった場合、[デバッグログ](#edge-debug-log)を参照する。）

アドオンの実装を変更した場合、以下の手順でパッケージを更新します。

1. Chrome用アドオンの開発版パッケージを用意する。
   1. Chromeを起動する。
   2. アドオンの管理画面（`chrome:extensions`）を開く。
   3. `拡張機能をパッケージ化` で `webextensions¥chrome` をパックする。（証明書ファイルにはⅠつ上のディレクトリーの `chrome.pem` を指定する。）
2. Edgeアドオンの開発版パッケージを用意する。
   1. Edgeを起動する。
   2. アドオンの管理画面（`edge:extensions`）を開く。
   3. `拡張機能のパック` で `webextensions¥edge` をパックする。（証明書ファイルにはⅠつ上のディレクトリーの `edge.pem` を指定する。）
3. ChromeとEdgeのグループポリシーを編集し、アドオンの強制インストールを無効化する。（`<アドオンのID>;<マニフェストファイルの位置>` を `#<アドオンのID>;<マニフェストファイルの位置>` と書き換えるなど。）
4. ChromeとEdgeを起動し、アドオンがアンインストールされたことを確認する。
5. ChromeとEdgeを終了する。
6. ChromeとEdgeのグループポリシーを編集し、アドオンの強制インストールを再度有効化する。（`#<アドオンのID>;<マニフェストファイルの位置>` を `<アドオンのID>;<マニフェストファイルの位置>` と書き換えるなど。）
7. ChromeとEdgeを起動し、アドオンがアンインストールされたことを確認する。

ドメイン非参加状態の端末で開発を行っていて、開発作業を終えた場合、以下の手順でドメイン非参加状態に戻します。

1. 管理者権限でコマンドプロンプトを開き、以下のコマンド群を実行する。
   （参考： https://hitco.at/blog/apply-edge-policies-for-non-domain-joined-devices/ ）
   ```
   reg delete HKLM\SOFTWARE\Microsoft\Enrollments\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /f
   reg delete HKLM\SOFTWARE\Microsoft\Provisioning\OMADM\Accounts\FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF /f
   ```



## インストール方法

インストーラは BrowserSelectorSetup\Release\BrowserSelectorSetup.msi にビルドさ
れています。これを実行してインストールします。

## 既定のウェブブラウザの変更

あらゆるアプリケーションから使用するウェブブラウザを自動選択したい場合は、デス
クトップの既定のウェブブラウザをBrowserSelector.exeに変更する必要があります。
その方法は使用するOSや管理方法によって異なりますので、以下のページ等を参考にし
て下さい。

  * https://support.microsoft.com/en-us/help/4028606/windows-10-change-your-default-browser
  * https://docs.microsoft.com/en-us/internet-explorer/ie11-deploy-guide/set-the-default-browser-using-group-policy

BHOのみを使用してBrowserSelector.exeが必要無い場合、この手順は必要ありません。

## 設定方法

このソフトウェアにはユーザーインターフェースがありません。システム管理者がレジ
ストリ設定あるいはINI形式の設定ファイルを直接管理し、ユーザーには設定を編集させ
ないことを想定しています。設定は以下の箇所から、以下の順番で読み込まれます。

  * `HKEY_LOCAL_MACHINE`（`HKLM`）レジストリ
    * HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\ClearCode\BrowserSelector
	* （32bit OSの場合: HKEY_LOCAL_MACHINE\SOFTWARE\ClearCode\BrowserSelector）
  * インストールフォルダのiniファイル
    * 例: C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelector.ini
    * デフォルトでは上記ファイルは存在しません。
	  手動で設置する必要があります。
  * `HKEY_CURRENT_USER`（`HKCU`）レジストリ
    * HKEY_CURRENT_USER\SOFTWARE\WOW6432Node\ClearCode\BrowserSelector
    * （32bit OSの場合: HKEY_CURRENT_USER\SOFTWARE\ClearCode\BrowserSelector）
  * ユーザーフォルダのAppData内のiniファイル
    * 例: C:\Users\[UserName]\AppData\Roaming\ClearCode\BrowserSelector\BrowserSelectror.ini
    * デフォルトでは上記フォルダやファイルは存在しません。
	  手動で設置する必要があります。

上記複数の設定が存在する場合、それらの設定は統合されます（後に読み込まれる設定
で上書きされます）。

設定例は以下のファイルを参照して下さい。

  * [レジストリ: 64ビットOSの場合](sample/BrowserSelectorWOW64Example.reg)
  * [レジストリ: 32ビットOSの場合](sample/BrowserSelectorExample.reg)
  * [INIファイル](sample/BrowserSelector.ini)

設定できる項目は、一部を除いて共通です。
レジストリ設定においてレジストリキー直下に設定する項目は、INIファイルの場合には
`[Common]`セクションに記述します。

## 設定項目

### `HostNamePatterns` および `URLPatterns`

#### 単純なワイルドカードによるパターンマッチング

特定のURLを指定したウェブブラウザで開かせるために、ホスト名やURLのパターンを設
定する必要があります。これらの設定はレジストリキー`HostNamePatterns`あるいは
`URLPatterns`配下に文字列値として格納します。文字列値の名前には任意の文字列を
使用できますが、適用順序を明確化するために`0001`といった数字を使用することをお
勧めします。文字列値のデータにはホスト名やURLのパターンをセットします。また、
「|」を区切り文字として、末尾に使用するブラウザ名を付加することもできます。

例)

  * `HostNamePatterns`
    * `0001` = `*.example.org|firefox`
  * URLPatterns
    * `0001` = `http://*.example.com|firefox`

ホスト名やURL名のパターンを指定するために、以下のワイルドカードがサポートされて
います。

  * `*`: 任意の文字列にマッチします
  * `?`: 任意の一文字にマッチします

URLは`http:`または`https:`で始まる物のみ対応しています。それ以外のスキーマのURLは、
常に現在のブラウザで処理されます[^only-http-and-https]。

[^only-http-and-https]: これは、[Chromeにおいてfile: URLへのアクセスにはユーザーの明示的な許可が常に必要である](https://bugs.chromium.org/p/chromium/issues/detail?id=173640#c68)という制限事項があるためです。

ブラウザ名としては、以下の値がサポートされています:

  * `ie`: Internet Explorer
  * `firefox`: Mozilla Firefox
  * `chrome`: Google Chrome

ブラウザ名を指定しない場合は後述の`DefaultBrowser`や`SecondBrowser`が使用されま
す。

### `ZonePatterns`

Internet Explorerのセキュリティゾーンごとに起動するブラウザを設定します。
記法は`URLPatterns`および`HostNamePatterns`と同様です。

例)

  * `0001` = `intra|ie`
  * `0002` = `internet`

以下のセキュリティゾーン名がサポートされています。　

  * Type: String
    * `local`
    * `intra`
    * `trusted`
    * `internet`
    * `restricted`

`URLPatterns`と`HostNamePatterns`のルールは`ZonePatterns`に優先することに
注意してください。

#### 正規表現

URLのパターンを指定する方法として、単純なワイルドカードの代わりに、正規表現を
使用することもできます。正規表現を使用したい場合は、BrowserSelectorのレジ
ストリキー直下に以下のDWORD値をセットします:

  * `"UseRegex"` = `dword:00000001`

この状態においては、すべてのパターンが正規表現での指定として解釈されます。
単純なワイルドカードのパターン指定は併用できず、すべての指定を妥当な正規表現で
記述する必要があることに注意して下さい。

正規表現は部分一致ではなく、URL文字列全体にマッチするかどうかで判定されます。
特定のホストの任意のパスにマッチするよう指定する場合、パターンの末尾に`.*`を指定
する必要があることにご注意下さい。

正規表現の具体的な文法については以下を参照して下さい:

  * https://ja.cppreference.com/w/cpp/regex/ecmascript

正規表現を使用する場合にも、使用するブラウザを個別に指定することができます。
以下のように、パターンの終端を表す`$`アサーションの直後にブラウザ名を記述して下さい:

  * `0001` = `^http(s)?://(.+\\.)?example\\.(org|com)(/.*)?$firefox`

### `DefaultBrowser`

`BrowserSelector`キー直下に文字列値`DefaultBrowser`をセットすることで、パターン
に一致しなかった場合に使用するブラウザを指定することができます。

  * 値の型: 文字列
    * `ie` （デフォルト）
    * `firefox`
    * `chrome`

例)

  * `DefaultBrowser` = `firefox`

### `SecondBrowser`

ホスト名やURLパターンでブラウザを指定しなかった場合、既定では`DefaultBrowser`で
指定したブラウザが使用されます。パターン毎に個別にブラウザを指定せずに、パター
ンにマッチしたURLに対して別のブラウザを使用したい場合は、`BrowserSelector`キー
直下に文字列値`SecondBrowser`をセットして下さい。

  * 値の型: 文字列
    * 空文字列 (デフォルト)
    * `ie`
    * `firefox`
    * `chrome`

例)

  * `SecondBrowser` = `chrome`
  * `URLPagtterns`
    * `0001` = `http://*.example.com`
    * `0002` = `http://*.example.org`
    * ...

### `FirefoxCommand`

システムに複数のバージョンのFirefoxをインストールしている場合に、どのFirefoxを
起動するかを指定できます。


 * 値の型: 文字列
   * 空文字列 (デフォルト)
   * 通常のWindowsパス形式: C:\path\to\firefox.exe

### `CloseEmptyTab`

外部ブラウザ起動後に残された空タブを閉じるか否かの設定です。

  * 値の型: DWORD
    * 1: 閉じる (デフォルト)
    * 0: 閉じない

### `OnlyOnAnchorClick`

リンクのクリックのみをブラウザ切り替えの対象とするか否かの設定です。

  * 値の型: DWORD
    * 0: すべてのページ遷移をブラウザ切り替えの対象とする（デフォルト）
    * 1: リンクのクリックのみをブラウザ切り替えの対象とする

### `Include`

追加で読み込む外部INIファイルのパスを指定します。読み込まれた外部INIファイルから
さらに外部INIファイルを読み込むことはできません。

  * 値の型: 文字列
    * 以下のいずれかの形式を使用可能
    * 通常のWindowsパス形式: C:\path\to\file.ini
    * UNC形式: \\HostName\ShareName\path\to\file.ini

### `EnableIncludeCache`

外部iniファイルにアクセスできない場合に、キャッシュを使用するかどうかを指定しま
す。

  * 値の型: DWORD
    * 0: 使用しない（デフォルト）
    * 1: 使用する

キャッシュはユーザーフォルダのLocalAppDataLow以下に保存されます。

  例) C:\Users\[UserName]\AppData\LocalLow\ClearCode\BrowserSelector\BrowserSelectror.ini

## ログの採取手順

### BHO debug log

1. 共通オプションの `Debug` を `1` に設定する。
   例えば、BrowserSelector.ini の `[Common]` セクションに `Debug=1` と追記する。
2. デバッグ情報収集用ツールをダウンロードする。
   https://docs.microsoft.com/en-us/sysinternals/downloads/debugview
   「Download DebugView」のリンク先をファイルとして保存する。
3. 保存したファイルを展開する。
4. 展開されたファイルの中の `Dbgview.exe` を管理者権限で実行して、DebugViewを起動する。
5. DebugViewの `Capture` メニューで `Capture Win32` `Capture Global Win32` の両方にチェックを入れた状態にする。
6. 調査したい現象を再現させる。
7. DebugViewの `File` メニューの `Save As...` でログを保存する。

### Chrome debug log

1. Chromeのショートカットをデスクトップ又は任意の場所にコピーする。
2. ショートカットを右クリックし、メニューから「プロパティ」を選ぶ。
3. リンクターゲット欄にコマンドライン引数 ` --enable-logging=1` を追加する。
   （実行ファイルへのパスとコマンドラインオプションの間にスペースを入れることを忘れないこと。）
4. 編集したショートカットからChromeを起動する。
5. 調査したい現象を再現させる。
6. Chromeを終了する。
7. `%LocalAppData%\Google\Chrome\User Data\chrome_debug.log` の位置に出力されたログを採取する。

### Edge debug log


1. Edgeのショートカットをデスクトップ又は任意の場所にコピーする。
2. ショートカットを右クリックし、メニューから「プロパティ」を選ぶ。
3. リンクターゲット欄にコマンドライン引数 ` --enable-logging=1` を追加する。
   （実行ファイルへのパスとコマンドラインオプションの間にスペースを入れることを忘れないこと。）
4. 編集したショートカットからEdgeを起動する。
5. 調査したい現象を再現させる。
6. Edgeを終了する。
7. `%LocalAppData%\Microsoft\Edge\User Data\chrome_debug.log` の位置に出力されたログを採取する。
