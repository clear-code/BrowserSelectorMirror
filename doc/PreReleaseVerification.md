---
CJKmainfont: Noto Sans CJK JP
CJKoptions:
  - BoldFont=Noto Sans CJK JP Bold
title: "BrowserSelector リリース前検証手順 v2.2.6"
author: "株式会社クリアコード"
date: "2024-05-16"
titlepage: true
logo: logo.png
logo-width: 250
colorlinks: true
toc-title: "目次"
toc-own-page: true
listings-disable-line-numbers: true
code-block-font-size: \footnotesize
footnotes-pretty: true
---

# 概要

本文書は、BrowserSelectorならびにそのブラウザ拡張機能のリリースの際に実施する検証の手順を説明する物である。


# 検証環境の用意

検証には原則として `/doc/verify/windows-10-21H2` の環境を使用する。
他の環境を使用する場合は、以下の条件を事前に整えておく。

* Active Directoryドメイン参加状態である。
  （または、`/doc/verify/windows-10-21H2/ansible/files/join-dummy-domain.bat` の内容を管理者権限で実行済みである。）
* Google Chrome、Microsoft Edgeをインストール済みである。
* Google Chrome、Microsoft EdgeのGPO用ポリシーテンプレートを導入済みである。
* `C:\Users\Public\webextensions` 配下に `/webextensions/` の内容を配置済みである。
* `C:\Users\Public\webextensions\manifest.xml` の位置に `/doc/verify/windows-10-21H2/ansible/files/manifest.xml` を配置済みである。

準備は以下の手順で行う。

1. https://gitlab.com/clear-code/browserselector/-/releases もしくは
   https://github.com/clear-code/BrowserSelectorMirror/actions/workflows/build.yaml （各ビルドの `Artifacts` の `Installer`）よりBrowserSelectorの最新のMSIをダウンロードし、実行、インストールする。
2. Chrome用アドオンの開発版パッケージを用意し、インストールするための設定を行う。
   1. Chromeを起動する。
   2. アドオンの管理画面（`chrome://extensions`）を開く。
   3. `デベロッパーモード` を有効化する。
   4. `拡張機能をパッケージ化` で `C:\Users\Public\webextensions\chrome` をパックする。（1つ上のディレクトリーに `chrome.crx` と `chrome.pem` が作られる）
   5. `chrome.crx` をChromeのアドオン管理画面にドラッグ＆ドロップし、インストールして、IDを控える。
      例：`egoppdngdcoikeknmbgiakconmchahhf`
   6. アドオンを一旦アンインストールする。
   7. `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelectorTalkChrome.json` の `"allowed_origins"` に、先ほど控えたIDに基づくURLを追加する。
      例：`"chrome-extension://egoppdngdcoikeknmbgiakconmchahhf/"`
   8. `C:\Users\Public\webextensions\manifest.xml` のChrome用アドオンのIDを、先程控えたIDで置き換える。
   9. `gpedit.msc` を起動する。
   10. `Computer Configuration\Administrative Templates\Google\Google Chrome\Extensions` （`コンピューターの構成\管理用テンプレート\Google\Google Chrome\拡張機能`）を開いて、以下のポリシーを設定する。
       * `Configure the list of force-installed apps and extensions`（`自動インストールするアプリと拡張機能のリストの設定`）
         * `Enabled`（`有効`）に設定して、`Show...`（`表示...`）をクリックし、以下の項目を追加する。
           * `<先程控えたID>;file:///C:/Users/Public/webextensions/manifest.xml`
             例：`egoppdngdcoikeknmbgiakconmchahhf;file:///C:/Users/Public/webextensions/manifest.xml`
   11. Chromeを再起動し、アドオンの管理画面（`chrome://extensions`）を開いて、BrowserSelectorの開発版が管理者によってインストールされた状態になっていることを確認する。
3. Edgeアドオンの開発版パッケージを用意し、インストールするための設定を行う。
   1. Edgeを起動する。
   2. アドオンの管理画面（`edge://extensions`）を開く。
   3. `開発者モード` を有効化する。
   4. `拡張機能のパック` で `C:\Users\Public\webextensions\edge` をパックする。（1つ上のディレクトリーに `edge.crx` と `edge.pem` が作られる）
   5. `edge.crx` をEdgeのアドオン管理画面にドラッグ＆ドロップし、インストールして、IDを控える。
      例：`oapdkmbdgdcjpacbjpcdfhncifimimcj`
   6. アドオンを一旦アンインストールする。
   7. `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelectorTalkEdge.json` の `"allowed_origins"` に、先ほど控えたIDに基づくURLを追加する。
      例：`"chrome-extension://oapdkmbdgdcjpacbjpcdfhncifimimcj/"`
   8. `C:\Users\Public\webextensions\manifest.xml` のEdge用アドオンのIDを、先程控えたIDで置き換える。
   9. `gpedit.msc` を起動する。
   10. `Computer Configuration\Administrative Templates\Microsoft Edge\Extensions`（`コンピューターの構成\管理用テンプレート\Microsoft Edge\拡張機能`）を開いて、以下のポリシーを設定する。
       * `Control which extensions are installed silently`（`サイレント インストールされる拡張機能を制御する`）
         * `Enabled`（`有効`）に設定して、`Show...`（`表示...`）をクリックし、以下の項目を追加する。
           * `<先程控えたID>;file:///C:/Users/Public/webextensions/manifest.xml`
             例：`oapdkmbdgdcjpacbjpcdfhncifimimcj;file:///C:/Users/Public/webextensions/manifest.xml`
   11. Edgeを再起動し、アドオンの管理画面（`edge://extensions`）を開いて、BrowserSelectorの開発版が管理者によってインストールされた状態になっていることを確認する。
4. BHOの管理のためのポリシー設定を行う。
   1. `gpedit.msc` を起動する。
   2. `Computer Configuration\Administrative Templates\Windows Components\Internet Explorer` （`コンピューターの構成\管理用テンプレート\Windows コンポーネント\Internet Explorer`）を開いて、以下のポリシーを設定する。
      * `Turn off add-on performance notifications`（`アドオンのパフォーマンスの通知を無効にする`）：`Enabled`（`有効`）
      * `Automatically activate newly installed add-ons`（`新たにインストールされたアドオンを自動的にアクティブ化する`）：`Enabled`（`有効`）
   3. `Computer Configuration\Administrative Templates\Windows Components\Internet Explorer\Internet Control Panel\Advance Page` （`コンピューターの構成\管理用テンプレート\Windows コンポーネント\Internet Explorer\インターネット コントロール パネル\[詳細設定]ページ`）を開いて、以下のポリシーを設定する。
      * `Allow third-party browser extensions`（`サード パーティ製のブラウザー拡張を許可する`）：`Enabled`（`有効`）
5. EdgeのIEモードタブの設定を行う。
   1. Edgeを起動する。
   2. `edge://settings/defaultBrowser` を開く。
   3. `Allow sites to be reloaded in Internet Explorer mode (IE mode)` を `Allow` に設定する。
   4. 以下のURLを `Add` で追加する。
      * https://piro.sakura.ne.jp/apps/jspanel.html
   5. `edge://settings/system` を開く。
   6. `Startup boost` をオフにする。
   7. `Continue running background extensions and apps when Microsoft Edge is closed` をオフにする。
   8. Edgeを終了する。

# 検証

## BHO無効時のIEモードのタブの挙動を含む、Manifest V3での動作

### 準備

以下の通り設定して検証を行う。

* `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelector.ini` を以下の内容に設定する。
  ```
  [Common]
  DefaultBrowser=chrome
  CloseEmptyTab=1
  
  [URLPatterns]
  0001=http*://example.com|edge
  0002=http*://example.com/*|edge
  0003=http*://*.example.com|edge
  0004=http*://*.example.com/*|edge
  0005=http*://piro.sakura.ne.jp|edge
  0006=http*://piro.sakura.ne.jp/*|edge
  0007=http*://groonga.org/ja|edge
  0008=http*://groonga.org/ja/*|edge
  ```
* `Computer Configuration\Administrative Templates\Windows Components\Internet Explorer\Security Features\Add-on Management` （`コンピューターの構成\管理用テンプレート\Windows コンポーネント\Internet Explorer\セキュリティの機能\アドオン管理`）を開いて、以下のポリシーを設定する。
  * `Add-on List`（`アドオンの一覧`）
    * `Enabled`（`有効`）に設定して、`Add-on List`→`Show...`（`アドオンの一覧`→`表示...`）をクリックし、以下の名前の項目を設定（項目がなければ追加）して、`OK` を押してダイアログを閉じ、`OK` を押して変更を保存する。
      * `Value name`（`値の名前`）：`{204D767E-FEA2-46DA-A88F-52F6C0C38EF1}`
      * `Value`（`値`）：`0`

### 検証

1. Edgeを起動する。
2. リンクによるEdgeからChromeへのページ遷移の検証：
   1. Edge→Chromeの検証のため、Edgeで新しいタブで https://groonga.org/ja/ を開く。
      * 期待される結果：
        * Edge上で https://groonga.org/ja/ が読み込まれる。
   2. `English` のリンクをクリックする。
      * 期待される結果：
        * 空白のページが現在のタブに読み込まれ、すぐに元のページに戻る。
        * Chromeでタブが開かれ、https://groonga.org/ が読み込まれる。
   3. Edge（IEモード）→Chromeの検証のため、Edgeで新しいタブで https://piro.sakura.ne.jp/apps/jspanel.html を開く。
      （最初のタブのまま操作すると、ハンドリングの例外に該当して動作しないため）
      * 期待される結果：
        * EdgeのタブがIEモードに切り替わる。
   4. 以下のスクリプトを貼り付けて実行する。
      ```
      location.href='https://groonga.org/ja/';
      ```
      * 期待される結果：
        * EdgeのIEモードのタブで https://groonga.org/ja/ が読み込まれる。
   5. `English` のリンクをクリックする。
      * 期待される結果：
        * EdgeのIEモードのタブで https://groonga.org/ が読み込まれる。（Manifest V2版と非互換の動作だが、仕様上不可避な挙動）
        * Chromeでタブが開かれ、https://groonga.org/ が読み込まれる。
3. JavaScriptによるEdgeからChromeへのページ遷移の検証：
   1. Edge→Chromeの検証のため、Edgeで新しいタブで https://piro.sakura.ne.jp/apps/jspanel を開く。
      * 期待される結果：
        * Edge上で https://piro.sakura.ne.jp/apps/jspanel が読み込まれる。
   2. 以下のスクリプトを貼り付けて実行する。
      ```
      window.open('https://example.net/', '_blank');
      ```
      * 期待される結果：
        * Chromeでタブが開かれ、https://example.net/ が読み込まれる。
        * 空白のタブがEdge上に残っていない。
   3. 以下のスクリプトを貼り付けて実行する。
      ```
      window.open('https://example.net/', '_blank', 'toolbar=no');
      ```
      * 期待される結果：
        * Chromeでタブが開かれ、https://example.net/ が読み込まれる。
        * 空白のポップアップウィンドウがEdge上に残っていない。
4. リンクによるChromeからEdgeへのページ遷移の検証：
   1. Chrome→Edgeの検証のため、Chromeで新しいタブで https://groonga.org/ を開く。
      * 期待される結果：
        * Chrome上で https://groonga.org/ が読み込まれる。
   2. `日本語` リンクをクリックする。
      * 期待される結果：
        * 空白のページが現在のタブに読み込まれ、すぐに元のページに戻る。
        * Edgeでタブが開かれ、https://groonga.org/ja/ が読み込まれる。
5. JavaScriptによるChromeからEdgeへのページ遷移の検証：
   1. Chrome→Edgeの検証のため、Chromeで新しいタブで https://www.piro.sakura.ne.jp/apps/jspanel.html を開く。
      * 期待される結果：
        * 証明書の警告が表示される。
        * 警告を無視して先に進むと、Chrome上で https://www.piro.sakura.ne.jp/apps/jspanel.html が読み込まれる。
   2. 以下のスクリプトを貼り付けて実行する。
      ```
      window.open('https://example.com/', '_blank');
      ```
      * 期待される結果：
        * Edgeでタブが開かれ、 https://example.com/ が読み込まれる。
        * 空白のタブがChrome上に残っていない。
   3. 以下のスクリプトを貼り付けて実行する。
      ```
      window.open('https://example.com/', '_blank', 'toolbar=no');
      ```
      * 期待される結果：
        * Edgeでタブが開かれ、https://example.com/ が読み込まれる。
        * 空白のポップアップウィンドウがChrome上に残っていない。
6. [!65](https://gitlab.com/clear-code/browserselector/-/merge_requests/65)（EdgeのIEモードのタブから開かれたポップアップウィンドウからのページ遷移）の検証：
   1. Edgeで新しいタブで https://piro.sakura.ne.jp/apps/jspanel.html を開く。
      * 期待される結果：
        * タブがIEモードに切り替わる。
   2. 以下のスクリプトを貼り付けて実行する。
      ```
      window.open('https://example.net/', '_blank', 'toolbar=no');
      ```
      * 期待される結果：
        * IEモードのポップアップウィンドウが開かれ、 https://example.net/ が読み込まれる。
   3. そのまま1分から2分待つ。
      * 期待される結果：
        * IEモードのポップアップウィンドウが残っている。
        * https://example.net/ がChromeへリダイレクトされない。
7. [!68](https://gitlab.com/clear-code/browserselector/-/merge_requests/68)（リダイレクト対象のURLを新規タブで開いた際の挙動）の検証：
   1. Edgeで新しいタブで https://example.com/ を開く。
      * 期待される結果：
        * Edge上で https://example.com/ が読み込まれる。
   2. `More information...` のリンクをミドルクリックする。
      * 期待される結果：
        * Chrome上で https://www.iana.org/help/example-domains が開かれる。
        * 空白のタブがEdge上に残っていない。
   3. Chromeで新しいタブで https://www.piro.sakura.ne.jp/ を開く。
      * 期待される結果：
        * Chrome上で https://www.piro.sakura.ne.jp/ が読み込まれる。
   4. ページ最下部の `outsider reflex` のリンクをミドルクリックする。
      * 期待される結果：
        * Edge上で https://piro.sakura.ne.jp/ が開かれる。
        * 空白のタブがChrome上に残っていない。
8. Edge、Chromeを終了する。

## BHO有効時のIEモードのタブの挙動を含む、Manifest V3での動作

### 準備

以下の通り設定して検証を行う。

* `C:\Program Files (x86)\ClearCode\BrowserSelector\BrowserSelector.ini` を以下の内容に設定する。
  ```
  [Common]
  DefaultBrowser=chrome
  CloseEmptyTab=1
  
  [URLPatterns]
  0001=http*://example.com|edge
  0002=http*://example.com/*|edge
  0003=http*://*.example.com|edge
  0004=http*://*.example.com/*|edge
  0005=http*://piro.sakura.ne.jp|edge
  0006=http*://piro.sakura.ne.jp/*|edge
  0007=http*://groonga.org/ja|edge
  0008=http*://groonga.org/ja/*|edge
  ```
* `Computer Configuration\Administrative Templates\Windows Components\Internet Explorer\Security Features\Add-on Management` （`コンピューターの構成\管理用テンプレート\Windows コンポーネント\Internet Explorer\セキュリティの機能\アドオン管理`）を開いて、以下のポリシーを設定する。
  * `Add-on List`（`アドオンの一覧`）
    * `Enabled`（`有効`）に設定して、`Add-on List`→`Show...`（`アドオンの一覧`→`表示...`）をクリックし、以下の名前の項目を設定（項目がなければ追加）して、`OK` を押してダイアログを閉じ、`OK` を押して変更を保存する。
      * `Value name`（`値の名前`）：`{204D767E-FEA2-46DA-A88F-52F6C0C38EF1}`
      * `Value`（`値`）：`1`

### 検証

1. Edgeを起動する。
2. リンクによるEdgeからChromeへのページ遷移の検証：
   1. Edge（IEモード）→Chromeの検証のため、Edgeで新しいタブで https://piro.sakura.ne.jp/apps/jspanel.html を開く。
      * 期待される結果：
        * EdgeのタブがIEモードに切り替わる。
   2. 以下のスクリプトを貼り付けて実行する。
      ```
      location.href='https://groonga.org/ja/';
      ```
      * 期待される結果：
        * EdgeのIEモードのタブで https://groonga.org/ja/ が読み込まれる。
   3. `English` のリンクをクリックする。
      * 期待される結果：
        * EdgeのIEモードのタブがページ遷移しないでそのまま維持される。
        * Chromeでタブが開かれ、https://groonga.org/ が読み込まれる。
2. [!65](https://gitlab.com/clear-code/browserselector/-/merge_requests/65)（EdgeのIEモードのタブから開かれたポップアップウィンドウからのページ遷移）の検証：
   1. Edgeで新しいタブで https://piro.sakura.ne.jp/apps/jspanel.html を開く。
      * 期待される結果：
        * タブがIEモードに切り替わる。
   2. 以下のスクリプトを貼り付けて実行する。
      ```
      window.open('https://example.net/', '_blank', 'toolbar=no');
      ```
      * 期待される結果：
        * Chromeでタブが開かれ、https://example.net/ が読み込まれる。
        * IEモードのポップアップウィンドウが残っていない。
3. Edge、Chromeを終了する。



