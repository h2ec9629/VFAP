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

### セッション開始時に自動実行すること

Claudeはセッション開始時、ユーザーからの指示を待たずに以下を自動実行する：

```bash
# ① PATを読み込む
PAT=$(cat /sessions/.../mnt/dev/VFAP/token/VFAPtoken.txt)

# ② sandbox内にclone（GitHubから最新版を取得）
git clone https://h2ec9629:${PAT}@github.com/h2ec9629/VFAP.git /tmp/VFAP-sandbox

# ③ cloneした最新版をmounted filesystemに反映（コードファイルのみ）
rsync -av --exclude='.git' --exclude='input/' --exclude='output/' --exclude='token/' \
  /tmp/VFAP-sandbox/ /sessions/.../mnt/dev/VFAP/
```

- PATは `token/VFAPtoken.txt` から読み込む
- ③のrsyncで他端末の変更がローカルに反映される
- 完了後「GitHub最新版を取得しましたわ！push準備OKです」と一言伝える

### ファイル編集後のpush手順

Claudeがファイルを編集したあと、push指示があれば以下を実行する：

```bash
# 編集ファイルをsandboxにコピーしてpush
cp /sessions/.../mnt/dev/VFAP/<編集ファイル> /tmp/VFAP-sandbox/
cd /tmp/VFAP-sandbox
git add .
git commit -m "変更内容を一言で"
git push
```

- リモート: `https://github.com/h2ec9629/VFAP.git`（branch: master）
- virtiofs（fuse）マウント上では git が動かないため、必ずsandbox内のcloneを経由すること

### 循環構造まとめ

```
GitHub
  ↓ clone → rsync（セッション開始時・自動）
mounted filesystem（Claude編集）
  ↓ cp → git push（編集後・push指示で実行）
GitHub
```

3端末どれから作業しても、セッション開始時に必ずGitHubの最新版を取得してから作業開始する。

## 開発環境

- **作業フォルダ（主軸）**: `C:\Users\mmtm9\Desktop\dev\VFAP`
- **bashパス**: `/sessions/.../mnt/dev/VFAP/`
- **GitHub**: `https://github.com/h2ec9629/VFAP`
- **PAT保存場所**: `token/VFAPtoken.txt`
- **OneDrive**: バックアップ置き場（`C:\Users\mmtm9\OneDrive\work\VFAP`）
  - DB・xlsm・json等のデータファイルはOneDriveにのみ存在する（Git管理外）
  - コード編集はdev側で完結し、OneDriveには同期しない

## ⚠️ 編集対象ファイルの原則

**編集は必ず `C:\Users\mmtm9\Desktop\dev\VFAP` 側のファイルで行うこと。**
OneDrive (`C:\Users\mmtm9\OneDrive\work\VFAP`