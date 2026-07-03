"""
GitHub API 経由でファイルをプッシュするスクリプト
使い方: python github_push.py "ファイル1" "ファイル2" -m "コミットメッセージ"

2026-07-02 追記:
GitHub APIへのpushだけだとローカルのgit履歴（git commit）が更新されず、
「git status」がいつまでも modified のまま → 次回の git pull で
ローカル編集が静かに上書きされて消える、という事故が起きていた。
そのため push成功後、同じ内容でローカルにも git add + git commit するようにした。
"""
import sys, os, base64, json, urllib.request, urllib.error, argparse, subprocess

OWNER = "h2ec9629"
REPO  = "VFAP"
BRANCH = "master"
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "token", "VFAPtoken.txt")

def get_token():
    with open(TOKEN_FILE, encoding="utf-8") as f:
        return f.read().strip()

def api(method, path, body=None, token=""):
    url = f"https://api.github.com{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()}")
        raise

def push_file(local_path, message, token):
    # リポジトリ内の相対パス（スラッシュ区切り）
    repo_root = os.path.dirname(__file__)
    rel = os.path.relpath(local_path, repo_root).replace("\\", "/")

    print(f"  [{rel}]", end=" ", flush=True)

    # 現在のSHAを取得
    try:
        info = api("GET", f"/repos/{OWNER}/{REPO}/contents/{rel}?ref={BRANCH}", token=token)
        sha = info["sha"]
        print(f"SHA={sha[:7]}", end=" ", flush=True)
    except urllib.error.HTTPError:
        sha = None
        print("(新規)", end=" ", flush=True)

    # ファイル内容をbase64エンコード
    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()

    body = {"message": message, "content": content, "branch": BRANCH}
    if sha:
        body["sha"] = sha

    api("PUT", f"/repos/{OWNER}/{REPO}/contents/{rel}", body=body, token=token)
    print("→ OK")
    return rel

def commit_locally(rels, message):
    """GitHub APIへのpushとは別に、ローカルのgit履歴にも同じ内容を記録する。
    ここで失敗しても致命的ではない（GitHub側には既に反映済みのため）ので、
    警告だけ出して処理は止めない。"""
    repo_root = os.path.dirname(__file__)
    try:
        subprocess.run(["git", "add"] + rels, cwd=repo_root, check=True)
        result = subprocess.run(
            ["git", "commit", "-m", message],
            cwd=repo_root, check=False,
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            print("  ローカルにもcommit済み")
        elif "nothing to commit" in (result.stdout + result.stderr):
            print("  ローカル側は変更なし（commit不要）")
        else:
            print(f"  [警告] ローカルcommit失敗、後で手動確認してください:\n{result.stdout}{result.stderr}")
    except Exception as e:
        print(f"  [警告] ローカルcommitでエラー: {e}")
        print("  (GitHub側へのpushは完了してるので、実害はローカル記録のズレのみ)")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+")
    parser.add_argument("-m", "--message", default="update via API")
    args = parser.parse_args()

    token = get_token()
    print(f"Push to {OWNER}/{REPO} ({BRANCH})")
    pushed_rels = []
    for f in args.files:
        path = os.path.abspath(f)
        rel = push_file(path, args.message, token)
        pushed_rels.append(rel)

    print("ローカルのgit履歴を更新中...")
    commit_locally(pushed_rels, args.message)

    print("完了")

if __name__ == "__main__":
    main()
