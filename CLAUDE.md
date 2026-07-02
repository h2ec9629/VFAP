# VFAP プロジェクト ── 開発ルール

## フォルダ構成

```
VFAP/
├── app.py               # メインアプリ（Streamlit）
├── nittei.js            # 日程JSロジック（1300行超）
├── nittei.html          # 日程ページHTML（504行）
├── mobile_viewer.html   # モバイル閲覧用 GitHub Pages HTML
├── github_push.py       # GitHub API経由でpushするスクリプト
├── nittei_to_gist.py    # gantt_render.jsonをGistにpushするスクリプト
├── token/
│   └── VFAPtoken.txt    # PAT（Git管理除外・絶対にpush禁止）
├── input/
│   └── 樹脂指示書/      # 指示書Excelファイル置き場
└── output/
    └── 提出用/          # 出力PDF等の生成先
```

## GitHub push方法（確定版）

**git clone / rsync / git push は使わない。`github_push.py` を使う。**

```bash
cd /sessions/.../mnt/dev/VFAP
python3 github_push.py ファイル名1 ファイル名2 -m "コミットメッセージ"
```

- PATは `token/VFAPtoken.txt` から自動読込
- ブランチは **main**（masterではない）
- virtiofs（fuse）マウント上では `git` コマンドが動かないためgithub_push.pyを使う

### ⚠️ ブランチ注意

- **GitHub Pages の配信ブランチは `main`**（masterは別ブランチ）
- `github_push.py` の BRANCH は "main" に修正済み（2026-06-27）
- masterにpushしてもGitHub Pagesに反映されない

## 開発環境

- **作業フォルダ（主軸）**: `C:\Users\mmtm9\Desktop\dev\VFAP`
- **bashパス**: `/sessions/upbeat-dreamy-hawking/mnt/dev/VFAP/`
- **GitHub**: `https://github.com/h2ec9629/VFAP`（Public）
- **GitHub Pages URL**: `https://h2ec9629.github.io/VFAP/`
- **PAT保存場所**: `token/VFAPtoken.txt`（Git管理除外済み）
- **OneDrive**: バックアップ置き場（`C:\Users\mmtm9\OneDrive\work\VFAP`）
  - DB・xlsm・json等のデータファイルはOneDriveにのみ存在する（Git管理外）
  - コード編集はdev側で完結し、OneDriveには同期しない

## ⚠️ 編集対象ファイルの原則

**編集は必ず `C:\Users\mmtm9\Desktop\dev\VFAP` 側のファイルで行うこと。**

OneDriveのファイルは読み取り専用扱い（同期タイミングでファイルが壊れる実績あり）。

## mobile_viewer.html について

GitHub Pagesで公開しているモバイル閲覧用HTML。

- **URL**: `https://h2ec9629.github.io/VFAP/mobile_viewer.html`
- **データ取得**: Gist API (`api.github.com/gists/34f07c829b92ea7141367874f8777512`) から `reminder_sync.json` → `gantt_render` キーを使用
- `gist.githubusercontent.com/raw` は**使わない**（CDNキャッシュが強く古い内容を返すため）
- ファイルの末尾が切れると JS全体がエラーになりページ全体が操作不能になる
- **Writeツールで書いた後は必ず `tail -8` で `</script></body></html>` を確認してからpushすること**

### 引取品名のデータソース

- 引取（ac）の表示名は **vfdb の「備考」列** を使用（備考１・備考２ではない）
- nittei.js: `VFDB_SPEC[normNm].biko` → fallback `r.nm`
- app.py: `_update_gantt_render()` 内の `vfdb_biko_map` 経由

## nittei.js / app.py の関係

- `nittei.js` の `computeGanttRender()` → `gantt_render.json` を生成
- `app.py` の `_update_gantt_render()` → 加工記録更新時にPython側でも再計算
- `gantt_render.json` → `nittei_to_gist.py` → Gist `reminder_sync.json` に格納
- モバイルビューワーはGistから取得してそのまま描画（座標再計算は禁止）

## HTMLファイル編集の地雷

- **WriteツールやEditツールは末尾が切れるバグ実績あり** → 編集後は必ず `tail -8` 確認
- Pythonスクリプトによる文字列置換も置換パターンが誤マッチしてファイルが切れることがある
- 安全な編集手順: `bash + python3` で文字列置換 → `tail -8` 確認 → push

## 📌 コミット徹底ルール（2026-07-02〜）

コード欠落の実績（`app.py.bak_*`が20個近く積まれている＝過去に何度も手動復旧している証拠）を踏まえ、以下を徹底する。

- **1つの修正・1機能が終わるたびにcommit**。数セッション分まとめない（欠落に気づいた時に戻れる地点を近くに保つ）
- **push前チェック（この順で必須）**
  1. `wc -l ファイル名` で編集前後の行数を比較し、想定外の減少がないか確認
  2. HTMLは `tail -8` で `</script></body></html>` の存在確認、Pythonは `python3 -m py_compile ファイル名` で構文チェック
  3. 両方OKなら `python3 github_push.py ファイル名 -m "内容"` でpush
- **手動`.bak_*`ファイルは原則もう作らない**。git履歴を正とする（既存の`.bak_*`群は`archive/`へ退避予定・未実施）

## ⚠️ 2026-07-02発覚：git index破損（実機対応が必要・未解決）

- `.git/index` が存在せず、0バイトの `.git/index.lock` だけが残っている状態を検出
- 症状: `git status`で198ファイル全部が`D`（削除予定）表示になる。**ワーキングツリーの実ファイルは無事**（中身は壊れていない）が、このまま気づかず操作すると危険な状態
- サンドボックスからは`.git/index.lock`を削除できない（Operation not permitted）→ **Windows実機での手動対応待ち**
- 実機での対処手順:
  1. `C:\Users\mmtm9\Desktop\dev\VFAP\.git` 内の `*.lock` ファイルを全部削除（`index.lock`、`HEAD.lock`、`objects\maintenance.lock`等）
  2. コマンドプロンプトで `cd C:\Users\mmtm9\Desktop\dev\VFAP` → `git maintenance stop`
  3. `git status` を実行し、`D`表示が消えることを確認（消えなければ `git reset` でindex再構築）
- 過去にも同系統の残置ロック障害あり（原因はgit maintenanceのバックグラウンドタスク）
