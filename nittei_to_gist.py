#!/usr/bin/env python3
"""
nittei_to_gist.py
─────────────────────────────────────────────────────────────────────────────
VFAPの保存済み gantt_render.json を読んで GitHub Gist へ push します。

  ・gantt_render.json  … VFAPの日程ページが「保存」時に書き出す計算済み描画データ
                         startH/remaining 等はVFAPが算出済み → 再計算ゼロ
  ・excel_schedule     … MM/DD → YYYY-MM-DD変換後、リマインダーアプリ後方互換として保持
  ・reminders          … 既存Gistの内容をそのまま保持

使い方:
  python nittei_to_gist.py           # 実際にGistへpush
  python nittei_to_gist.py --dry-run # 送信せずに変換結果を確認

設定:
  VFAP/ 内に .env ファイルを作成して以下を記載
    GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxx
─────────────────────────────────────────────────────────────────────────────
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import date, datetime, timezone
from pathlib import Path

# ─── 定数 ────────────────────────────────────────────────────────────────────
GIST_ID   = "34f07c829b92ea7141367874f8777512"
GIST_FILE = "reminder_sync.json"
SCRIPT_DIR = Path(__file__).resolve().parent


# ─── PAT読み込み ──────────────────────────────────────────────────────────────
def load_pat() -> str:
    env_file = SCRIPT_DIR / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("GITHUB_PAT="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("GITHUB_PAT", "")


# ─── nittei.json パス自動検出（gantt_render.jsonも同フォルダ） ────────────────
def find_nittei_path() -> Path | None:
    env_dir = os.environ.get("SGT_BASE_DIR", "").strip()
    if env_dir:
        p = Path(env_dir) / "nittei.json"
        if p.exists():
            return p

    home = Path.home()
    onedrive_roots = []
    userprofile = os.environ.get("USERPROFILE", "")
    if userprofile:
        for name in ("OneDrive", "OneDrive - Personal", "OneDrive - 個人用"):
            p = Path(userprofile) / name
            if p.exists():
                onedrive_roots.append(p)
    onedrive_roots.append(home / "OneDrive")

    for od in onedrive_roots:
        for cloud_name in ("SGT_cloud", "VFAP-cloud"):
            p = od / "work" / cloud_name / "nittei.json"
            if p.exists():
                return p

    p = SCRIPT_DIR / "nittei.json"
    if p.exists():
        return p

    return None


# ─── 日付変換 MM/DD → YYYY-MM-DD ─────────────────────────────────────────────
def mmdd_to_iso(mmdd: str, ref: date) -> str | None:
    """
    'MM/DD' を 'YYYY-MM-DD' に変換。
    ref より 120日以上前 → 翌年、180日以上先 → 前年 と判断。
    """
    if not mmdd or mmdd in ("—", "-", ""):
        return None
    try:
        m, d = (int(x) for x in str(mmdd).split("/"))
    except (ValueError, AttributeError):
        return None

    year = ref.year
    try:
        candidate = date(year, m, d)
    except ValueError:
        return None

    if (ref - candidate).days > 120:
        try:
            candidate = date(year + 1, m, d)
        except ValueError:
            pass
    elif (candidate - ref).days > 180:
        try:
            candidate = date(year - 1, m, d)
        except ValueError:
            pass

    return candidate.isoformat()


# ─── Gist 取得 ────────────────────────────────────────────────────────────────
def fetch_gist(pat: str) -> dict:
    req = urllib.request.Request(
        f"https://api.github.com/gists/{GIST_ID}",
        headers={
            "Authorization": f"Bearer {pat}",
            "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


# ─── Gist 更新 ────────────────────────────────────────────────────────────────
def push_gist(pat: str, content: str) -> int:
    body = json.dumps({"files": {GIST_FILE: {"content": content}}}).encode()
    req = urllib.request.Request(
        f"https://api.github.com/gists/{GIST_ID}",
        data=body,
        method="PATCH",
        headers={
            "Authorization": f"Bearer {pat}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status


# ─── メイン ──────────────────────────────────────────────────────────────────
def main():
    dry_run = "--dry-run" in sys.argv

    # nittei.jsonのパスからgantt_render.jsonを探す
    nittei_path = find_nittei_path()
    if not nittei_path:
        print("❌ nittei.json が見つかりません")
        print("   SGT_BASE_DIR 環境変数か .env に記載するか、OneDrive\\work\\SGT_cloud に置いてください")
        sys.exit(1)

    print(f"📂 {nittei_path.parent}")

    # gantt_render.json 読み込み（VFAPの「保存」で生成される計算済みデータ）
    gantt_render_path = nittei_path.parent / "gantt_render.json"
    if not gantt_render_path.exists():
        print("❌ gantt_render.json が見つかりません")
        print("   VFAPの日程ページで一度「保存」を実行してください")
        sys.exit(1)

    gantt_render = json.loads(gantt_render_path.read_text(encoding="utf-8"))
    gantt_rows   = gantt_render.get("gantt", [])
    haiso        = gantt_render.get("haiso", {})

    print(f"   ガント: {len(gantt_rows)}行  引取: {len(haiso.get('ac_side', []))}件  納品: {len(haiso.get('ad_side', []))}件")
    print(f"   保存時刻: {gantt_render.get('saved_at', '不明')}")

    # PAT確認（dry-runは不要）
    pat = load_pat()
    if not pat and not dry_run:
        print("❌ GITHUB_PAT が未設定です")
        print("   VFAP/.env に  GITHUB_PAT=ghp_xxx  を追記してください")
        sys.exit(1)

    today = date.today()

    # ── excel_schedule 生成（MM/DD → YYYY-MM-DD変換。リマインダーアプリ後方互換）
    ac_side: list[dict] = []
    for item in haiso.get("ac_side", []):
        iso = mmdd_to_iso(item.get("date"), today)
        if iso:
            ac_side.append({"date": iso, "ag": item.get("ag", "")})

    ad_side: list[dict] = []
    for item in haiso.get("ad_side", []):
        iso = mmdd_to_iso(item.get("date"), today)
        if iso:
            ad_side.append({"date": iso, "d": item.get("d", ""), "u": item.get("u", "")})

    # ── dry-run ──────────────────────────────────────────────────────────────
    if dry_run:
        print("\n───── DRY RUN (Gist送信なし) ─────")
        preview = {
            "excel_schedule": {
                "ac_side": ac_side[:3],
                "ad_side": ad_side[:3],
            },
            "gantt_render": {
                "saved_at":   gantt_render.get("saved_at"),
                "bar_offset": gantt_render.get("bar_offset"),
                "days":       gantt_render.get("days", [])[:3],
                "gantt":      gantt_rows[:3],
            },
        }
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        print("──────────────────────────────────")
        return

    # ── Gist 読み込み（remindersを保持）
    print("☁️  Gist読み込み中...")
    existing_reminders = []
    try:
        gist_data = fetch_gist(pat)
        raw = gist_data["files"][GIST_FILE]["content"]
        existing_reminders = json.loads(raw).get("reminders", [])
        print(f"   既存reminder: {len(existing_reminders)}件を保持")
    except Exception as e:
        print(f"⚠️  Gist読み込み失敗 ({e}) → remindersは空で続行")

    # ── reminder_sync.json 組み立て
    new_sync = {
        "reminders":      existing_reminders,
        "excel_schedule": {"ac_side": ac_side, "ad_side": ad_side},
        "gantt_render":   gantt_render,   # VFAPの計算済みデータをそのまま
        "synced_at":      datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }

    # ── Gist push
    print("🚀 Gistへpush中...")
    try:
        status = push_gist(pat, json.dumps(new_sync, ensure_ascii=False, indent=2))
        print(f"✅ 完了 (HTTP {status})")
        print(f"   引取: {len(ac_side)}件 / 納品: {len(ad_side)}件 / ガント: {len(gantt_rows)}行")
    except urllib.error.HTTPError as e:
        print(f"❌ HTTPエラー {e.code}: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Push失敗: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  