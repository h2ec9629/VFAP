#!/usr/bin/env python3
# migrate_backfill.py — 一括移行スクリプト（②卒業フェーズ）
#   kakou_kiroku.json（ノート）の kanryo=true 記録を records/ カードへ移行する。
#   ・nohin_bi が無い記録は nittei.json の同No行 ad から補完
#   ・nittei に無い（過去/廃番）記録は records/_unsorted/ へフォールバック
#   ・既存カード（同No or 同No-枝番）がある記録はスキップ（カード優先）
#   ・ノート(kakou_kiroku.json)自体は触らない＝今回は併走のまま
#
# 使い方:
#   python migrate_backfill.py                 # DRY-RUN（件数とサンプルのみ・書き込みなし）
#   python migrate_backfill.py --apply         # 実際に records/ へ書き込み
#   python migrate_backfill.py <基準フォルダ>   # nittei.json のある場所を明示指定
#
# ★年変換は日程ページ_試作.html の adToYYMMDD と必ず一致させること:
#   日程表が年明けの表に切り替わったら下の2定数を更新する。
import json, os, sys, re
from pathlib import Path
from datetime import datetime, timezone

SCHEDULE_BASE_YEAR = 2026   # 日程ページの SCHEDULE_BASE_YEAR と一致
SCHED_BASE_MONTH   = 6      # 日程ページ days[0][0]（"06/04"→6）の月と一致


def detect_base_dir() -> Path:
    for a in sys.argv[1:]:
        if not a.startswith("-"):
            p = Path(a)
            if (p / "nittei.json").exists():
                return p
    env = os.environ.get("SGT_BASE_DIR", "").strip()
    if env and (Path(env) / "nittei.json").exists():
        return Path(env)
    home = Path.home()
    for c in [home / "OneDrive" / "work" / "SGT_cloud",
              home / "OneDrive" / "work" / "sgt2605_cloud_bundle",
              Path.cwd()]:
        if (c / "nittei.json").exists():
            return c
    raise SystemExit("nittei.json が見つかりません。基準フォルダを引数で指定してください。")


def ad_to_yymmdd(mmdd) -> str:
    """日程ページの adToYYMMDD と同じ年判定（月が基準月より戻ったら翌年）"""
    if not mmdd:
        return ""
    parts = str(mmdd).split("/")
    if len(parts) < 2:
        return ""
    try:
        m, d = int(parts[0]), int(parts[1])
    except ValueError:
        return ""
    if not m or not d:
        return ""
    y = SCHEDULE_BASE_YEAR + (1 if m < SCHED_BASE_MONTH else 0)
    return f"{y % 100:02d}/{m:02d}/{d:02d}"


def main():
    apply = "--apply" in sys.argv
    base = detect_base_dir()
    note = json.loads((base / "kakou_kiroku.json").read_text(encoding="utf-8"))
    nittei = json.loads((base / "nittei.json").read_text(encoding="utf-8"))
    records_root = base / "records"

    # nittei: no -> nohin_bi(yy/mm/dd)。ad付き行を採用、複数なら最も遅い日付。
    nmap = {}
    for r in nittei:
        no = str(r.get("no") or "").strip()
        ymd = ad_to_yymmdd(r.get("ad"))
        if no and ymd:
            cur = nmap.get(no)
            if cur is None or ymd > cur:   # yy/mm/dd の辞書順＝日付順
                nmap[no] = ymd

    # 既存カードの meisai_no（ファイル名stem、枝番含む）
    existing = set()
    if records_root.exists():
        for fp in list(records_root.glob("*/*/*.json")) + list(records_root.glob("_unsorted/*.json")):
            existing.add(fp.stem)

    stats = dict(total=len(note), kanryo=0, skip_existing=0,
                 had_nohin=0, backfilled=0, unsorted=0, written=0)
    plan = []

    for r in note:
        if not r.get("kanryo"):
            continue
        stats["kanryo"] += 1
        mno = str(r.get("meisai_no") or "").strip()
        if not mno:
            continue
        if mno in existing or any(e.startswith(mno + "-") for e in existing):
            stats["skip_existing"] += 1
            continue
        rec = dict(r)
        rec.setdefault("schema_version", 1)
        nb = str(rec.get("nohin_bi") or "").strip()
        if re.match(r"^\d{2}/\d{2}/\d{2}$", nb):
            stats["had_nohin"] += 1
        else:
            nb2 = nmap.get(mno, "")
            if nb2:
                rec["nohin_bi"] = nb2
                rec["backfilled_nohin_bi"] = True
                nb = nb2
                stats["backfilled"] += 1
            else:
                nb = ""
        m = re.match(r"^(\d{2})/(\d{2})/(\d{2})$", nb)
        if m:
            yy, mm, _dd = m.groups()
            target = records_root / ("20" + yy) / mm / (mno + ".json")
        else:
            rec["unsorted"] = True
            target = records_root / "_unsorted" / (mno + ".json")
            stats["unsorted"] += 1
        rec["migrated_at"] = datetime.now(timezone.utc).isoformat()
        plan.append((target, rec))

    print(f"基準フォルダ: {base}")
    print(f"モード     : {'APPLY（書き込み）' if apply else 'DRY-RUN（確認のみ）'}")
    print(f"ノート総数 : {stats['total']}   kanryo:{stats['kanryo']}   既存カードでスキップ:{stats['skip_existing']}")
    print(f"移行対象   : {len(plan)}   （nohin_bi既存:{stats['had_nohin']} / nitteiから補完:{stats['backfilled']} / _unsorted:{stats['unsorted']}）")

    if not apply:
        for target, rec in plan[:12]:
            print("   ->", target.relative_to(base), "  nohin_bi=", rec.get("nohin_bi", "(なし)"))
        if len(plan) > 12:
            print(f"   ... 他 {len(plan) - 12} 件")
        print("※ 確認OKなら  python migrate_backfill.py --apply  で書き込み")
        return

    for target, rec in plan:
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp = target.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(str(tmp), str(target))
        stats["written"] += 1
    print(f"書き込み完了: {stats['written']} 件")


if __name__ == "__main__":
    main()
