# -*- coding: utf-8 -*-
"""
指示書クリーンコピー作成スクリプト
────────────────────────────────────────────────────────────
樹脂指示書フォルダ直下の .xlsx をコピーし、
SGT.xlsm 等への外部リンク（関数）を除去してクリーン版を別フォルダに保管する。

・元ファイルは一切変更しない（読むだけ）
・外部参照式は「最後にExcelが計算したキャッシュ値」に置き換わるので見た目そのまま
・外部リンクが消えるので Excel COM / LibreOffice で詰まらず開ける＝PDF化できる
・calcChain（数式計算順リスト）も消す → 「内容を回復しますか？」ダイアログ防止

使い方：下の SRC_DIR / DST_DIR を自分の環境に合わせてから実行するだけ。
"""

import zipfile, re, sys
from pathlib import Path

# ════════════════════════════════════════════════════════════
# ★ここだけ自分の環境に合わせて書き換える★
# ════════════════════════════════════════════════════════════
<<<<<<< HEAD
SRC_DIR = Path(__file__).resolve().parent / "input" / "樹脂指示書"                 # コピー元（直下のxlsxが対象）
DST_DIR = Path(__file__).resolve().parent / "樹脂指示書_クリーン"                   # クリーン版の保管先（無ければ自動作成）
=======
SRC_DIR = Path(r"C:\Users\mmtm9\OneDrive\work\SGT_cloud\input\樹脂指示書")        # コピー元（直下のxlsxが対象）
DST_DIR = Path(r"C:\Users\mmtm9\OneDrive\work\VFAP\樹脂指示書_クリーン")           # クリーン版の保管先（無ければ自動作成）
>>>>>>> 3de6de60ae8233f443224245ac3532ff81df1986
# ════════════════════════════════════════════════════════════


def strip_external_links(src_path: Path, dst_path: Path) -> None:
    """xlsx の外部リンクを除去したクリーンコピーを dst_path に作る。元は変更しない。"""
    zin = zipfile.ZipFile(src_path, "r")
    names = zin.namelist()
    # 外部リンク本体 と calcChain（数式計算順リスト）を丸ごと除外する。
    # calcChain は消した数式のセルを指したまま残ると「内容を回復しますか？」ダイアログの原因になる。
    # （Excelが開いたとき自動で作り直すので消して問題なし）
    keep = [n for n in names
            if not n.startswith("xl/externalLinks/") and n != "xl/calcChain.xml"]

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dst_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for n in keep:
            data = zin.read(n)

            if n == "[Content_Types].xml":
                # externalLink と calcChain の Override を削除
                t = data.decode("utf-8")
                t = re.sub(r'<Override[^>]*externalLink[^>]*/>', '', t)
                t = re.sub(r'<Override[^>]*calcChain[^>]*/>', '', t)
                data = t.encode("utf-8")

            elif n == "xl/workbook.xml":
                # <externalReferences> ブロックを削除
                t = data.decode("utf-8")
                t = re.sub(r'<externalReferences>.*?</externalReferences>', '', t, flags=re.S)
                data = t.encode("utf-8")

            elif n == "xl/_rels/workbook.xml.rels":
                # externalLink と calcChain の Relationship を削除
                t = data.decode("utf-8")
                t = re.sub(r'<Relationship[^>]*Type="[^"]*externalLink"[^>]*/>', '', t)
                t = re.sub(r'<Relationship[^>]*Type="[^"]*calcChain"[^>]*/>', '', t)
                data = t.encode("utf-8")

            elif re.match(r'xl/worksheets/sheet\d+\.xml', n):
                # 外部参照を含む数式 <f>...[1].../[2]...</f> を削除し、キャッシュ <v> 値だけ残す
                t = data.decode("utf-8")
                t = re.sub(r'<f[^>]*>(?:(?!</f>).)*?\[[12]\](?:(?!</f>).)*?</f>', '', t, flags=re.S)
                t = re.sub(r'\s+cm="\d+"', '', t)  # 動的配列メタ参照を除去（修復ダイアログ防止）
                # 数式除去後 t="str"（文字列型）で値が空(<v/>)になったセルは
                # 通常の空セルに直す。型ありなのに値が無いと修復ダイアログの原因になる。
                _strip_t = lambda m: '<c ' + re.sub(r'\s*t="[^"]*"', '', m.group(1)) + '/>'
                t = re.sub(r'<c ([^>]*?)>\s*<v\s*/>\s*</c>', _strip_t, t)
                t = re.sub(r'<c ([^>]*?)>\s*<v>\s*</v>\s*</c>', _strip_t, t)
                data = t.encode("utf-8")

            zout.writestr(n, data)
    zin.close()


def main():
    if not SRC_DIR.exists():
        print(f"[NG] コピー元フォルダが見つからん: {SRC_DIR}")
        input("Enterで閉じる")
        sys.exit(1)

    DST_DIR.mkdir(parents=True, exist_ok=True)
    targets = sorted(p for p in SRC_DIR.glob("*.xlsx") if not p.name.startswith("~$"))

    if not targets:
        print(f"[--] {SRC_DIR} 直下に .xlsx が無かったわ")
        input("Enterで閉じる")
        return

    print(f"対象 {len(targets)} 件 → {DST_DIR}")
    ok = ng = 0
    for src in targets:
        dst = DST_DIR / src.name
        try:
            strip_external_links(src, dst)
            # 念のため外部リンクが本当に消えたか即チェック
            z = zipfile.ZipFile(dst)
            残 = [n for n in z.namelist() if "externalLink" in n]
            z.close()
            if 残:
                print(f"  [警告] {src.name} : 外部リンクが残ってる {残}")
                ng += 1
            else:
                print(f"  [OK] {src.name}")
                ok += 1
        except Exception as e:
            print(f"  [NG] {src.name} : {e}")
            ng += 1

    print(f"\n完了：成功 {ok} 件 / 失敗 {ng} 件")
    print(f"保管先 → {DST_DIR}")
    input("Enterで閉じる")  # 画面が一瞬で消えないように


if __name__ == "__main__":
    main()
