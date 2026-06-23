# VFAP プロジェクト ── 開発ルール

## フォルダ構成

```
VFAP/
├── app.py               # メインアプリ（Streamlit）
├── make_clean_copy.py   # クリーンコピー生成スクリプト
├── input/
│   └── 樹脂指示書/      # 指示書Excelファイル置き場
├── output/
│   └── 提出用/          # 出力PDF等の生成先
└── 樹脂指示書_クリーン/ # クリーンコピー置き場
```

## Git ワークフロー（必須）

- **セッション開始時**: 必ず `git pull` を実行すること（「git pullしましたか？」と確認する）
- **ファイル編集後**: 必ず以下をセットで実行すること

```bash
git add .
git commit -m "変更内容を一言で"
git push
```

- リモート: `https://github.com/h2ec9629/VFAP.git`（branch: main）

## 開発環境

- **作業フォルダ（主軸）**: `C:\Users\<user>\Desktop\dev\VFAP`
- **GitHub**: `https://github.com/h2ec9629/VFAP`
- **OneDrive**: バックアップ置き場（`C:\Users\<user>\OneDrive\work\VFAP`）
  - DB・xlsm・json等のデータファイルはOneDriveにのみ存在する（Git管理外）
  - コード編集はdev側で完結し、OneDriveには同期しない

## ⚠️ 編集対象ファイルの原則

**編集は必ず `C:\Users\user\Desktop\dev\VFAP` 側のファイルで行うこと。**
OneDrive (`C:\Users\user\OneDrive\work\VFAP`) はレガシー兼バックアップであり、編集対象外。

## ファイル編集ルール

ローカル開発のため OneDrive 同期問題は発生しないが、
**Edit ツール使用後は必ず末尾チェックを行うこと**（Edit ツール自体が途中で切れるケースあり）。

```bash
python3 -c "
with open('対象ファイルのbashパス', encoding='utf-8') as f: c = f.read()
print('size:', len(c))
print(repr(c[-80:]))
"
```

- bashパス例: `/sessions/.../mnt/dev/VFAP/app.py`
- 末尾が正常な終端なら OK
- 切れていたら Python の `append` モードで補完する

## app.py 編集ルール

末尾切れ防止のため、大きな変更は Edit ツールより Python スクリプト（src.replace）での一括編集を推奨。

手順：
1. Read でファイル内容取得
2. replace で差分を適用
3. 末尾チェック
4. git commit & push

## HTMLのレイアウト・サイズ調整時の注意（全ページ共通）

サイズ変更が反映されない場合、キャッシュより先に**グローバル強制スタイルの競合**を疑うこと。

- `grep` で `!important|min-height:[0-9]|height:[0-9]` を検索して洗い出す
- セレクタは必ずクラス名で絞る（グローバルセレクタ乱用禁止）
- `display:flex` を `<td>`/`<th>` 直に当てない（セル内 `<div>` に付けること）
