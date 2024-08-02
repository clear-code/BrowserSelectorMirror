# BrowserSelector リリース手順

この文書では、次のプロダクトのリリース手順を記述する。

- BrowserSelector 本体
  - browserselector リポジトリのうち、後述のアドオンを除く部分
- BrowserSelector アドオン（ブラウザ拡張機能）
  - browserselector/webextensions 配下の各ブラウザ向けリソース
- 「BrowserSelector利用ガイド vx.y.z」（PDF文書）
  - `/doc/BrowserSelectorGuide.md` を元に生成するPDFファイル

以下、「本体」「アドオン」「利用ガイドPDF」とする。

## 開始チェックリスト（事前の準備）

リリースは準備作業の完了後に行う。開始チェックリストは次のとおり。

- [開発者]
  - 自分が行った改修をテスト済みであること
  - 改修内容に対する検証手順を[リリース前検証手順](./PreReleaseVerification.md)に追加済みであること
  - master へのマージ・プッシュが完了したこと
- [開発者] 更新後の`/doc/`から 利用ガイドPDF を生成済みであること  
  1. 本体リリース時は、**利用ガイドの内容に変更がない場合も**`/doc/BrowserSelectorGuide.md`のtitle: date:を更新し、利用ガイドPDF を生成する  
  2. アドオンリリース時は、**利用ガイドの内容に変更が生じる場合のみ**date:（と変更内容）を更新し、利用ガイドPDF を生成する（利用ガイドの内容に変更がない場合、利用ガイドPDFはそのままでよい）
  3. 利用ガイドPDF リリース時は、date: を更新し、生成する
  4. 【共通】いずれのケースでも、date:には（更新した日ではなく）リリースする年月日を記載する

- **[対顧客] アドオンのリリースを顧客が了解済みであること**  
  （ストアでの公開が承認されると顧客環境に破壊的な変更を含む版が降ってきてしまうため。詳細は `#10899-53` を参照）

## 作業の流れ

事前準備の完了後、それぞれ次の手順に従ってリリースする。

### リリース前検証

後退バグが発生していないことを確認するため、[リリース前検証手順](./PreReleaseVerification.md)に従って一通り検証を実施する。

### バージョン繰り上げ

番号付けのポリシーは次のとおり。

- 【バージョン番号の表記】`vx.y.z`と表記する（例：v2.2.3）
- 【番号の付与単位】
  - 本体とアドオンは別々に付与する。一致させなくてよい
  - 本体と利用ガイドPDF は一致させる
- 【tag】本体のバージョンに対しては`vx.y.z`、アドオンのバージョンに対しては`addon-vx.y.z`として作成する

### BrowserSelector 本体のリリース

1. [作業者のローカル環境] `BSVersionUp.ps1`スクリプトを使用してバージョン情報を更新する
    - 使用方法は`script`フォルダの[BSVersionUp.HowToUse.md](../script/BSVersionUp.HowToUse.md)を参照  
2. [作業者のローカル環境] 新しいバージョンのタグ `vx.y.z` を切り、プッシュする
3. [作業者のローカル環境] BrowserSelector インストーラの作成  
 GitLab の最新の状態に同期し、自動ビルドを行う
    - `git checkout master && git pull`
    - そのまま続けて `git push git@github.com:clear-code/BrowserSelectorMirror.git master`
    - （GitHub Actions により<https://github.com/clear-code/BrowserSelectorMirror/actions/workflows/build.yaml>が動作する）
    -  Artifactsから未署名版インストーラをダウンロードする
4. [GitLab] [Web UI](https://gitlab.com/clear-code/browserselector/-/releases) でリリースを作成し、作成したインストーラをアップロードする
5. [ownCloud] 更新したPDFファイルをBrowserSelector 顧客公開用フォルダにアップロードする
6. [website] 更新したPDFファイルをアップロードする  
    - `git clone git@gitlab.com:clear-code/website.git`
    - `cd website`
    - `cp /path/to/manual/BrowserSelectorGuide.pdf services/browserselector/`
    - `git commit services/browserselector/`
    - `git push`
7. [リリース担当者のローカル環境] 署名済み版インストーラを作成する
    - 具体的な作成手順は下記を参照
8. [作業者のローカル環境] 署名済み版インストーラのバージョンと署名を確認する
    - 具体的な確認手順は下記を参照
9. [ownCloud] 署名済み版インストーラを顧客公開用フォルダにアップロードする
10. [広報担当者] 作業者の配信依頼を受け、リリースアナウンスする

#### 署名版インストーラの作成手順

インストーラのリリースにはクリアコードのコードサイニング証明書が必要です。

- [コマンドプロンプト] 下記を実施する

```bat
% git clone https://gitlab.com/clear-code/BrowserSelector
% cd BrowserSelector
% .\make.bat
```

- 証明書のセットアップ手順については、`#12080` を参照

#### 署名版インストーラのバージョン／署名確認手順

BrowserSelector の動作環境で、「新規インストール」「上書きインストール」の 2 パターンとも行う。

インストール後、以下を確認する

- [Windows 設定 > アプリと機能] BrowserSelector のバージョン
  - 今回リリースの番号となっていること
- [エクスプローラー] 各 exe と dll のバージョンと署名  
ファイルごとに右クリックし表示させる
  - 今回リリースの番号となっていること
  - クリアコードの署名があること

### BrowserSelector アドオンのリリース

1. 前のバージョンのアドオンのリリースの完了を確認する。
   1. 前のバージョンのアドオンのCRXファイルがバックアップされていない場合、ストア公開版のCRXファイルを取得する。
      * Chrome: `curl -L -o BrowserSelectorChrome-vx.y.z.crx "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=90.0.0&acceptformat=crx2,crx3&x=id%3Dnhcenbjbddlhdkdpfkbilmjpbkiigick%26uc"`
      * Edge: `curl -L -o BrowserSelectorEdge-vx.y.z.crx "https://edge.microsoft.com/extensionwebstorebase/v1/crx?response=redirect&prod=chromiumcrx&prodchannel=&x=id%3Difghihgjehplhamcpkmgcfjehjhkijgp%26installsource%3Dondemand%26uc"`
   2. https://gitlab.com/clear-code/browserselector/-/releases から前のバージョンのアドオンのリリースを探し、「リリースを編集」をクリックする。
   3. 「CRX backup from stores」の見出し配下に、先にダウンロードした `BrowserSelectorChrome-vx.y.z.crx` と `BrowserSelectorEdge-vx.y.z.crx` をドラッグ＆ドロップし、ファイルを添付する。
   4. 「変更を保存」をクリックする。
2. アドオンのパッケージを作成する。
   1. `cd webextensions && make` を実行して、アップロード用のZIPファイルを作成する。以下のファイルが作成される。
      * BrowserSelectorChrome.zip
      * BrowserSelectorChromeDev.zip
      * BrowserSelectorChromeEnterpriseDev.zip
      * BrowserSelectorEdge.zip
      * BrowserSelectorEdgeDev.zip
      * BrowserSelectorEdgeEnterpriseDev.zip
   2. 正式版リリースにおいては、この中から、アップロード用として以下の2ファイルを確保する。
      （それ以外のファイルは使用しない。）
      * BrowserSelectorChrome.zip
      * BrowserSelectorEdge.zip
3. アドオンをストアにアップロードする。
   * Chrome Web Store管理画面: https://chrome.google.com/webstore/devconsole/b9700d17-8a54-41dd-9916-8f6a6ca91c0d
   * Microsoft Web Store管理画面: https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview
     * Edge用アドオンの公開申請時には、検証手順の入力を求められるので、以下の要領で記述する。
       ```
       This extension requires its native messaging host.
       https://gitlab.com/clear-code/browserselector/-/releases#msi-installer-debug-symbols
       And this extension needs to be installed to Active Directory managed environments, via GPO. Steps:
       https://gitlab.com/clear-code/browserselector/-/blob/master/README.md?ref_type=heads#notes-for-manifest-v3
       ```
4. 新しいバージョンのリリースを作成する。
   1. `tig`、`git log`などを使用して、このバージョンでの変更点を洗い出す。
   2. `git tag -a addon-vx.y.z` でタグを作成する。本文部分には1で調べた変更点を列挙する。
   3. `git push --tags`で、作成したタグをプッシュする。
   4. https://gitlab.com/clear-code/browserselector/-/releases を開き、「新しいリリース」をクリックする。
   5. 「タグ名」で先程作成・pushしたタグを選択する。
   6. 「リリースタイトル」にタグ名と同じ文字列を記入する。
   7. 「リリースノート」に、以下を記載する。
      * タグ作成時に記入した変更点の説明。`git show addon-vx.y.z`の結果をコピー＆ペーストするとよい。
      * 「CRX backup from stores」という見出しを設け、CRXのバックアップを添付するための場所のみ用意しておく。
   8. 「リリースを作成」をクリックする。
5. ストアの審査が終了するまで待つ。（Chrome Web Store：1～数日、Microsoft Store：約1週間）
6. CRXファイルをバックアップする。
   1. ストア公開版のCRXファイルを取得する。
      * Chrome: `curl -L -o BrowserSelectorChrome-vx.y.z.crx "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=90.0.0&acceptformat=crx2,crx3&x=id%3Dnhcenbjbddlhdkdpfkbilmjpbkiigick%26uc"`
      * Edge: `curl -L -o BrowserSelectorEdge-vx.y.z.crx "https://edge.microsoft.com/extensionwebstorebase/v1/crx?response=redirect&prod=chromiumcrx&prodchannel=&x=id%3Difghihgjehplhamcpkmgcfjehjhkijgp%26installsource%3Dondemand%26uc"`
   2. https://gitlab.com/clear-code/browserselector/-/releases からアドオンのリリースを探し、「リリースを編集」をクリックする。
   3. 「CRX backup from stores」の見出し配下に、先にダウンロードした `BrowserSelectorChrome-vx.y.z.crx` と `BrowserSelectorEdge-vx.y.z.crx` をドラッグ＆ドロップし、ファイルを添付する。
   4. 「変更を保存」をクリックする。
7. [広報担当者]作業者の配信依頼を受け、リリースアナウンスする。

### 「BrowserSelector利用ガイド」のリリース

「近い将来の仕様変更を事前にアナウンスする」ケースなど、PDF のみをリリースする場合は次の手順で行う

1. [ownCloud] 更新したPDFファイルをBrowserSelector 顧客公開用フォルダにアップロードする
2. [website] 更新したPDFファイルをアップロードする（詳細はBrowserSelector 本体のリリースを参照）
3. [広報担当者]作業者の配信依頼を受け、リリースアナウンスする

以上
