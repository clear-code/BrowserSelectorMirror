# バックログ

`BSVersionUp`スクリプトの「完成目標」です。

## 現バージョンが揃っているかをチェックする機能

- もしリポジトリ内の既存の各バージョン情報が一致していない場合は、更新せずに終了する

## 更新モード

第 2 引数に「更新モード」を指定できるようにする

### increment（デフォルト値・省略可）

- x,y,z のいずれかを 1 加算するとき
- 加算された後ろの値を「0」にする

  2.2.3  
  → 2.2.4  
  → 2.3.0  
  → 3.0.0

### leap

- 2 以上加算するとき
- 複数の値を同時に更新するとき

  2.2.3  
  → 2.2.5  
  → 2.3.1  
  → 3.0.2

### backward

- 任意のバージョンに戻すとき

  2.2.3  
  → 2.2.2  
  → 2.1.0  
  → 1.9.1
