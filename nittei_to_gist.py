#!/usr/bin/env python3
"""
nittei_to_gist.py
─────────────────────────────────────────────────────────────────────────────
VFAPのnittei.jsonを読んで、リマインダーアプリ用の
  ・excel_schedule  (日程タブ / カレンダー用)
  ・gantt_data      (ガントチャート用)
に変換し、GitHub Gistへpushします。

使い方:
  python nittei_to_gist.py           # 実際にGistへpush
  python nittei_to_gist.py --dry-run # 送信せずに変換結果を確認

設定:
  VFAP/ 内に .env ファイルを作成して以下を記載
    GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxx
  (このファイルはgitにコミットされません)
─────────────────────────────────────────────────────────────────────────────
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import date, datetime, timedelta, timezone
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


# ─── nittei.json パス自動検出 ─────────────────────────────────────────────────
def find_nittei_path() -> Path | None:
    # 環境変数
    env_dir = os.environ.get("SGT_BASE_DIR", "").strip()
    if env_dir:
        p = Path(env_dir) / "nittei.json"
        if p.exists():
            return p

    # OneDrive候補（SGT_cloud優先、VFAP-cloud次点）
    home = Path.home()
    onedrive_roots = []

    # Windows: USERPROFILE\OneDrive
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

    # app.pyと同階層フォールバック
    p = SCRIPT_DIR / "nittei.json"
    if p.exists():
        return p

    return None


# ─── 日付変換 mm/dd → YYYY-MM-DD ──────────────────────────────────────────────
def mmdd_to_iso(mmdd: str, ref: date) -> str | None:
    """
    'MM/DD' を 'YYYY-MM-DD' に変換する。
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


# ─── 稼働日マップ生成 ─────────────────────────────────────────────────────────
def build_d2h(start: date, end: date) -> dict:
    """月〜金の稼働日に累積時間(h)を割り当て。1日 = 8h。"""
    d2h = {}
    h = 0
    cur = start
    while cur <= end:
        if cur.weekday() < 5:  # 0=月 … 4=金
            d2h[cur.isoformat()] = h
            h += 8
        cur += timedelta(days=1)
    return d2h


# ─── カテゴリ判定 ─────────────────────────────────────────────────────────────
def get_category(nm: str) -> str:
    nm = nm or ""
    if "灯具" in nm or "PC IN" in nm:
        return "灯具"
    if "樹脂" in nm or "GPSB" in nm or "GP" in nm:
        return "樹脂"
    return "LED"


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

    # nittei.json 読み込み
    nittei_path = find_nittei_path()
    if not nittei_path:
        print("❌ nittei.json が見つかりません")
        print("   SGT_BASE_DIR 環境変数か .env に記載するか、OneDrive\\work\\SGT_cloud に置いてください")
        sys.exit(1)

    print(f"📂 {nittei_path}")
    rows = json.loads(nittei_path.read_text(encoding="utf-8"))
    print(f"   {len(rows)} 行読み込み")

    # PAT確認（dry-runは不要）
    pat = load_pat()
    if not pat and not dry_run:
        print("❌ GITHUB_PAT が未設定です")
        print("   VFAP/.env に  GITHUB_PAT=ghp_xxx  を追記してください")
        sys.exit(1)

    today = date.today()

    # ── excel_schedule 生成 ──────────────────────────────────────────────────
    ac_side: list[dict] = []
    ad_side: list[dict] = []

    for r in rows:
        nm   = r.get("nm", "")
        no   = r.get("no", "")
        qty  = r.get("qty") or 0
        done = r.get("done") or 0

        ac_iso = mmdd_to_iso(r.get("ac"), today)
        ad_iso = mmdd_to_iso(r.get("ad"), today)

        # 進捗100% & 納品日が過去 → 表示不要
        if qty > 0 and done >= qty and ad_iso and ad_iso < today.isoformat():
            continue

        if ac_iso:
            ac_side.append({"date": ac_iso, "ag": nm})

        if ad_iso:
            # no のゼロ埋め除去（"000000000855930" → "855930"）
            no_str = str(no).lstrip("0") or str(no)
            ad_side.append({
                "date": ad_iso,
                "d":    nm,
                "s":    no_str,
                "u":    f"{done}/{qty}" if qty else "",
            })

    # ── gantt_data 生成 ──────────────────────────────────────────────────────
    # 全日付を集めてd2hの範囲を決める
    all_isos: list[str] = []
    for r in rows:
        for field in ("ac", "ad", "af", "parallelFrom"):
            iso = mmdd_to_iso(r.get(field), today)
            if iso:
                all_isos.append(iso)

    if all_isos:
        d2h_start = min(min(all_isos), today.isoformat())
        d2h_end   = date.fromisoformat(max(all_isos)) + timedelta(days=14)
    else:
        d2h_start = today.isoformat()
        d2h_end   = today + timedelta(days=60)

    d2h = build_d2h(date.fromisoformat(d2h_start), d2h_end)

    gantt_rows: list[dict] = []
    z_accum = 0.0
    aa      = 0.0  # カスケード累積（parallelFromで上書きされる）

    for r in rows:
        nm    = r.get("nm", "")
        qty   = r.get("qty") or 0
        done  = r.get("done") or 0
        hours = r.get("hours") or 0

        ad_iso = mmdd_to_iso(r.get("ad"), today)

        # 進捗100% & 納品日が過去 → ガントからも除外
        if qty > 0 and done >= qty and ad_iso and ad_iso < today.isoformat():
            continue

        # hours=0 は棒の長さゼロ → 除外
        if not hours:
            continue

        y = float(hours)

        # parallelFrom: 設定されていればその日付を起点に固定（VFAPと同じ挙動）
        pf_iso = mmdd_to_iso(r.get("parallelFrom"), today)
        if pf_iso and pf_iso in d2h:
            aa = float(d2h[pf_iso])  # d2h値（時間）を起点にリセット

        ab = aa + y
        z_accum += y

        row_data = {
            "n":  nm,
            "b":  get_category(nm),
            "s":  mmdd_to_iso(r.get("ac"), today),  # 支給(引取)日
            "e":  ad_iso,                             # 納品日
            "k":  mmdd_to_iso(r.get("af"), today),  # 期日
            "u":  qty,
            "w":  done,
            "y":  round(y,      4),
            "z":  round(z_accum, 4),
            "aa": round(aa,      4),
            "ab": round(ab,      4),
        }
        if pf_iso:
            row_data["pf"] = pf_iso  # parallelFrom ISO日付（リマインダーアプリの描画用）
        gantt_rows.append(row_data)
        aa = ab

    gantt_data = {
        "base_date": today.isoformat(),
        "d2h":       d2h,
        "rows":      gantt_rows,
    }

    print(f"   引取: {len(ac_side)}件  納品: {len(ad_side)}件  ガント: {len(gantt_rows)}行")

    # ── dry-run ──────────────────────────────────────────────────────────────
    if dry_run:
        print("\n───── DRY RUN (Gist送信なし) ─────")
        preview = {
            "excel_schedule": {
                "ac_side": ac_side[:3],
                "ad_side": ad_side[:3],
            },
            "gantt_data": {
                "base_date": gantt_data["base_date"],
                "d2h_keys":  list(d2h.keys())[:5],
                "rows":      gantt_rows[:3],
            },
        }
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        print("──────────────────────────────────")
        return

    # ── Gist 読み込み（remindersを保持） ─────────────────────────────────────
    print("☁️  Gist読み込み中...")
    existing_reminders = []
    try:
        gist_data = fetch_gist(pat)
        raw = gist_data["files"][GIST_FILE]["content"]
        existing_reminders = json.loads(raw).get("reminders", [])
        print(f"   既存reminder: {len(existing_reminders)}件を保持")
    except Exception as e:
        print(f"⚠️  Gist読み込み失敗 ({e}) → remindersは空で続行")

    # ── reminder_sync.json 組み立て ───────────────────────────────────────────
    new_sync = {
        "reminders":      existing_reminders,
        "excel_schedule": {"ac_side": ac_side, "ad_side": ad_side},
        "gantt_data":     gantt_data,
        "synced_at":      datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }

    # ── Gist push ─────────────────────────────────────────────────────────────
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
