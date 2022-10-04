# BrowserSelector リリース手順

この文書では、次のプロダクトのリリース手順を記述する。

- BrowserSelector 本体
  - browserselector リポジトリのうち、後述のアドオンを除く部分
- BrowserSelector アドオン（ブラウザ拡張機能）
  - browserselector/webextension 配下の各ブラウザ向けリソース

以下、「本体」「アドオン」とする。

## 開始チェックリスト（事前の準備）

リリースは準備作業の完了後に行う。開始チェックリストは次のとおり。

- [開発者]
  - 自分が行った改修をテスト済みであること
  - master へのマージ・プッシュが完了したこと
- [開発者] （必要があれば）更新後の`/doc/`から PDF 生成済みであること  
  _【yashirot】バージョン番号を進める場合`/doc/BrowserSelectorGuide.md`のtitle: date:を更新するはずなので、PDF 生成も常に必要となるのでは？_  
  【yashirot】Issue提起しました： [Not that clear on when and how the user guide should be updated](https://gitlab.com/clear-code/browserselector/-/issues/8)
- **[対顧客] アドオンのリリースを顧客が了解済みであること**  
  （ストアでの公開が承認されると顧客環境に破壊的な変更を含む版が降ってきてしまうため。詳細は `#10899-53` を参照）

## 作業の流れ

事前準備の完了後、それぞれ次の手順に従ってリリースする。

### 番号付けのポリシー

次のとおり。

- 【バージョン番号の表記】`vx.y.z`と表記する（例：v2.2.3）
- 【番号の付与単位】本体とアドオンは別々に付与する。一致させなくてよい
- 【tag】本体のバージョンに対してのみ作成する（アドオンには不要）

### BrowserSelector 本体のリリース

1. [作業者のローカル環境] Visual StudioまたはUTF-16対応エディタを用いてバージョン情報を更新する
    - 【各プロジェクトのリソースファイルのバージョン番号】  
    BrowserSelector.sln を開き更新する
        - BrowserSelector/BrowserSelector.rc
          - `FILEVERSION`
          - `PRODUCTVERSION`
        - BrowserSelectorBHO/BrowserSelectorBHO.rc
          - `FILEVERSION`
          - `PRODUCTVERSION`
        - BrowserSelectorBHO/BrowserSelectorTalk.rc
          - `FILEVERSION`
          - `PRODUCTVERSION`
    - 【インストーラのバージョン番号】  
     BrowserSelectorSetup/BrowserSelectorSetup.vdproj に記載されている。GUI から更新する場合は、ソリューションエクスプローラで BrowserSelectorSetup を選択し、プロパティペインで各値を変更する。
        - `"ProductVersion" = "8:x.y.z"`
          - GUI 上の表記は`Version`
        - `"ProductCode" = "8:{55805B9F-BE3A-404D-972D-C91CEBBCB716}"`
          - `Version`を変更する際に、`ProductCode`の変更を促すダイアログが表示される。`はい`を選択すると自動で更新される
          - エディタ使用の場合は適当な GUID を生成して置き換える
        - `"PackageCode" = "8:{72E97651-B376-4553-994F-DD1B580AF80E}"`
          - ツール > GUID の作成 > 4. レジストリ形式で生成したものに更新する
        - `"OutputFilename" = "8:Release\\BrowserSelectorSetup-x.y.z.msi"`
          - セットアッププロジェクトでは上記をマクロ化することができない。面倒だが直接バージョンを埋め込む
        - `"PostBuildEvent" = "8:powershell Compress-Archive -Force -Path $(ProjectDir)/../$(Configuration)/BrowserSelector*.pdb,$(ProjectDir)/../x64/$(Configuration)/BrowserSelectorBHO64.pdb -DestinationPath $(ProjectDir)/$(Configuration)/BrowserSelectorDebug-x.y.z.zip"`
          - 同じく、直接バージョンを埋め込む
2. [作業者のローカル環境] 新しいバージョンのタグ `vx.y.z` を切り、プッシュする
3. [作業者のローカル環境] BrowserSelector インストーラの作成  
 GitLab の最新の状態に同期し、自動ビルドを行う
    - `git checkout master && git pull`
    - そのまま続けて `git push git@github.com:clear-code/BrowserSelectorMirror.git master`
    - （GitHub Actions により<https://github.com/clear-code/BrowserSelectorMirror/actions/workflows/build.yaml>が動作する）
    -  Artifactsから未署名版インストーラをダウンロードする
4. [GitLab] [Web UI](https://gitlab.com/clear-code/browserselector/-/releases) でリリースを作成し、作成したインストーラをアップロードする
5. （利用ガイド更新時）[ownCloud] BrowserSelector 顧客公開用フォルダ にPDFファイルをアップロードする
6. （利用ガイド更新時）[website] 更新したマニュアルのアップロード  
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

1. アドオンのパッケージを作成する
2. アドオンをストアにアップロードする
3. [広報担当者]作業者の配信依頼を受け、リリースアナウンスする

以上
