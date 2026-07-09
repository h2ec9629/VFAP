# VFAP_gist ── Gist同期おためし版

本番 `VFAP` を丸ごとコピーして、**日程(nittei)だけ**をGist経由で端末間共有するようにした試作。
本番には一切手を入れてない。数日おためして良さそうなら本番へ取り込む。

## これは何が違うの？

| | 本番 VFAP | この VFAP_gist |
|---|---|---|
| Streamlitポート | 8501 | **8511** |
| 保存サーバー | 8502 | **8512** |
| 加工記録サーバー | 8503 | **8513** |
| 日程の保存先 | OneDrive の nittei.json のみ | OneDrive **＋ Gistへ投函** |
| 日程の読込元 | OneDrive の nittei.json | **Gistを正**にして読む |

ポートを全部ずらしてあるので、**本番と同時に起動してもOK**。

データ置き場（`OneDrive\work\SGT_cloud`）は本番と同じ。つまり生成するjsonは本番と共有される。

## 起動のしかた

`start_gist.bat` をダブルクリック。ブラウザで `http://localhost:8511` が開く。

## Gist情報

- Gist ID: `2a041fc0df1f6c82fe223f8fc246da50`（シークレット・専用）
- ファイル: `nittei_raw.json`（中身は `{saved_at, device, rows}`）
- トークンは `.env` の `GITHUB_PAT=` から読む

## しくみ

- **保存ボタン**を押すと → OneDriveの nittei.json へ書き出し（今まで通り）＋ **Gistへ投函**。
- **日程ページを開く**と → まずGistの最新を取ってきてローカルを上書きしてから表示。

これで「会社で保存 → 家で開くと古い」が起きひん。正が常にGist1個やから。

## ⚠️ おためし中の注意（大事）

- **おためし期間中、日程の編集はこの Gist版アプリでやること。**
  本番VFAPで日程を保存してもGistには飛ばへんので、そっちで編集すると食い違う。
- この `VFAP_gist` フォルダは各PCに置く必要がある（会社・家・現場）。
  `.env`（トークン入り）も一緒に置く。
- **このフォルダはGitHubや公開ページに絶対上げたらあかん**（`.env` にトークンが入ってるため）。
  本番と違ってgit管理してないので、うっかりpushの心配は少ないが念のため。

## 本番へ取り込む時（後日）

- 追加した関数は app.py 内の「Gist同期（VFAP_gist版）」ブロック（`_gist_pat` / `_gist_pull_nittei` /
  `_gist_push_nittei` / `_refresh_nittei_from_gist`）と、`_SaveHandler` の do_GET / do_POST、
  `load_nittei_rows` の頭に足した数行だけ。
- ポートを本番の 8502/8503 に戻すこと。
- 元コードは `app.py.pre_gist_bak` に退避してある。

## 次の拡張候補（今回は未対応）

加工記録・配送・DB編集・ステータスも同じパターンでGist同期できる。日程で問題なければ横展開。
