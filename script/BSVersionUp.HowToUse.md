# BSVersionUp の使い方

「BSVersionUp」は、BrowserSelector のバージョンアップ用スクリプトである

## 機能の概要

- パラメータで指定したバージョン番号`$new_version` の値へ一括更新する
- ProductCode と PackageCode の GUID を付け直す

### バージョン情報の付与ルール

- `vx.y.z`とする。先頭の「v」に続けて、0 以上の 3 つの整数 x y z を.（ピリオド）で区切って表記する
- x,y,z の値域はいずれも 0-99（数字 1 桁または 2 桁）とする
- 一部のファイルに、4 つの整数でバージョン情報を保持する行もある。4 つめは「0」固定とする

## 実行手順

1. エクスプローラー上で`script` フォルダを右クリックして「PowerShell ウィンドウをここで開く」を選択する
2. PowerShell ウィンドウで下記を実施する

```PowerShell
~\browserselector\script> .\BSVersionUp.ps1 [$new_version]
```

- 引数なしで`.\BSVersionUp.ps1` を実行した時は、リポジトリ内のバージョン情報の grep 結果を表示する
- `$new_version` は 0 以上の 3 つの整数 x y z を .（ピリオド）で区切って指定する（例：`.\BSVersionUp.ps1 2.2.4`）。「v」は不要
- 指定した`$new_version` が上記「バージョン情報の付与ルール」に違反している場合、エラーとする

### テストファイルの実行手順

PowerShell のテスティングフレームワーク「[Pester](https://pester.dev/)」にて実行する。手順は次のとおり

1. エクスプローラー上で`script` フォルダを右クリックして「PowerShell ウィンドウをここで開く」を選択する
2. PowerShell ウィンドウで下記を実施する

```PowerShell
~\browserselector\script> Invoke-Pester
```

フォルダ内のテストファイル`BSVersionUp.Tests.ps1` が実行される

- 上記テストは、`script` 以外のパスから Invoke すると一部"Failed" となる（`script` を基準として更新対象ファイルの存在チェックを行っているため）

### 実行前・実行後の注意事項

- 実行環境上で事前に PowerShell スクリプトの実行権限を付与しておくこと。詳細は<https://go.microsoft.com/fwlink/?LinkID=135170> を参照
- 当スクリプトによって変更したファイルのコミットの前に、diff を確認すること
