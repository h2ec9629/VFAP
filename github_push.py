"""
GitHub API 経由でファイルをプッシュするスクリプト
使い方: python github_push.py "ファイル1" "ファイル2" -m "コミットメッセージ"
"""
import sys, os, base64, json, urllib.request, urllib.error, argparse

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

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+")
    parser.add_argument("-m", "--message", default="update via API")
    args = parser.parse_args()

    token = get_token()
    print(f"Push to {OWNER}/{REPO} ({BRANCH})")
    for f in args.files:
        path = os.path.abspath(f)
        push_file(path, args.message, token)
    print("完了")

if __name__ == "__main__":
    main()
