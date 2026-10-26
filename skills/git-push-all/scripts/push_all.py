#!/usr/bin/env python3
"""递归发现并批量 add / commit / push 所有 git 仓库。

用法:
    python3 push_all.py --root <目录> [--discover-only] [--no-push]

--discover-only: 只列出仓库, 不做任何修改。
--no-push: add + commit 但不 push (冒烟测试用)。
输出: JSON 摘要到 stdout。
"""
import argparse
import json
import os
import subprocess
import sys


def run_git(repo, *args, timeout=120):
    p = subprocess.run(
        ["git", "-C", repo, *args],
        capture_output=True, text=True, timeout=timeout,
    )
    return p


def is_work_repo(path):
    gitdir = os.path.join(path, ".git")
    if os.path.isdir(gitdir):
        return True
    if os.path.isfile(gitdir):  # worktree / submodule 的 gitfile
        return True
    return False


# 默认排除: 缓存 / 插件 / 第三方 checkout, 避免家目录大扫描时误推几十个只读仓库
EXCLUDE_DIRNAMES = {
    "node_modules", "__pycache__", ".cache", ".Trash", ".mozilla",
    ".npm", ".nvm", ".ollama", ".julia", ".bun", ".cherrystudio",
    "sdists-v9", "pixi_cache",
}
EXCLUDE_SUBSTRINGS = (
    "/.cache/", "/.julia/", "/Trash/", "/nvim/lazy/",
    "/node_modules/", "/.mozilla/", "/.npm/", "/.nvm/",
)


def is_excluded(path):
    return any(s in path + "/" for s in EXCLUDE_SUBSTRINGS)


def discover(root, no_exclude=False):
    repos = []
    root = os.path.abspath(root)
    if is_work_repo(root):
        repos.append(root)
    for dirpath, dirnames, _ in os.walk(root, followlinks=False):
        # 不进入 .git 内部
        if ".git" in dirnames:
            dirnames.remove(".git")
        # 默认剪枝缓存/插件目录(家目录大扫描时关键); --no-exclude 可关闭
        if not no_exclude:
            for d in list(dirnames):
                full = os.path.join(dirpath, d)
                if d in EXCLUDE_DIRNAMES or is_excluded(full):
                    dirnames.remove(d)
                    continue
                # 默认跳过一切隐藏目录(.cache/.local/.config/…), 只保留 root 本身。
                # 用户真正的项目仓库一般不在隐藏目录里; 需要时用 --no-exclude 全扫。
                if d.startswith("."):
                    dirnames.remove(d)
        # 当前目录本身已在上面处理, walk 会逐层检查子目录
        for d in list(dirnames):
            full = os.path.join(dirpath, d)
            if is_work_repo(full):
                repos.append(full)
        # 不要用 os.scandir 重复处理; 继续 walk 即可发现嵌套仓库
    # 去重保序
    seen, uniq = set(), []
    for r in repos:
        if r not in seen:
            seen.add(r)
            uniq.append(r)
    return sorted(uniq)


def gen_message(status_lines, stats):
    added = sum(1 for l in status_lines if l.startswith(("A ", "??")))
    deleted = sum(1 for l in status_lines if l.startswith((" D", "D ")))
    modified = sum(1 for l in status_lines if l.startswith((" M", "M ")))
    renamed = sum(1 for l in status_lines if l.startswith("R"))
    n = len(status_lines)
    if added and not modified and not deleted:
        typ = "新增"
    elif deleted and not added and not modified:
        typ = "删除"
    elif modified and not added and not deleted:
        typ = "更新"
    else:
        typ = "同步"
    # 从最常见的顶层路径提炼概括
    tops = {}
    for l in status_lines:
        path = l[3:].strip().strip('"')
        # 处理重命名 "old -> new"
        if " -> " in path:
            path = path.split(" -> ")[-1]
        top = path.split("/")[0] if "/" in path else path
        tops[top] = tops.get(top, 0) + 1
    focus = sorted(tops.items(), key=lambda kv: -kv[1])[0][0] if tops else "工作区"
    if len(focus) > 24:
        focus = focus[:24] + "…"
    _ = (renamed, stats)  # 保留扩展用
    headline = f"{typ}: 同步 {focus}（共 {n} 个文件）"
    body_lines = []
    for l in status_lines[:10]:
        code = l[:2].strip() or "M"
        path = l[3:].strip()
        body_lines.append(f"{code} {path}")
    if n > 10:
        body_lines.append(f"等共 {n} 个文件")
    return headline + "\n\n" + "\n".join(body_lines)


def process_repo(repo, no_push=False):
    res = {"repo": repo, "result": "", "detail": ""}
    st = run_git(repo, "status", "--porcelain")
    if st.returncode != 0:
        res.update(result="失败", detail=f"status 失败: {st.stderr.strip()[:200]}")
        return res
    lines = [l for l in st.stdout.splitlines() if l.strip()]
    if not lines:
        res.update(result="跳过", detail="工作区干净")
        return res
    rem = run_git(repo, "remote")
    if rem.returncode == 0 and not rem.stdout.strip():
        res.update(result="跳过", detail="无远程仓库，无需 push，未提交")
        return res
    ad = run_git(repo, "add", "-A")
    if ad.returncode != 0:
        res.update(result="失败", detail=f"add 失败: {ad.stderr.strip()[:200]}")
        return res
    cached = run_git(repo, "diff", "--cached", "--name-status")
    cached_lines = [l for l in cached.stdout.splitlines() if l.strip()]
    if not cached_lines:
        res.update(result="跳过", detail="add 后暂存区仍为空(可能仅 ignore 文件)")
        return res
    # 用 porcelain 风格重组给 message 生成器
    pseudo = []
    for l in cached_lines:
        parts = l.split("\t")
        code = parts[0][0]
        path = parts[-1]
        pseudo.append(f"{code}  {path}")
    stat = run_git(repo, "diff", "--cached", "--stat")
    msg = gen_message(pseudo, stat.stdout)
    cm = run_git(repo, "commit", "-m", msg)
    if cm.returncode != 0:
        res.update(result="失败", detail=f"commit 失败: {(cm.stderr or cm.stdout).strip()[:300]}")
        return res
    headline = msg.splitlines()[0]
    if no_push:
        res.update(result="已提交未推送", detail=headline)
        return res
    ps = run_git(repo, "push", timeout=180)
    if ps.returncode == 0:
        res.update(result="已推送", detail=headline)
        return res
    err = (ps.stderr or ps.stdout).strip()
    if "no upstream" in err.lower() or "set-upstream" in err.lower():
        up = run_git(repo, "push", "-u", "origin", "HEAD", timeout=180)
        if up.returncode == 0:
            res.update(result="已推送", detail=headline + "（已建上游）")
            return res
        err = (up.stderr or up.stdout).strip()
    res.update(result="失败", detail=f"push 失败: {err.splitlines()[0][:300] if err else '未知错误'}")
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--discover-only", action="store_true")
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--no-exclude", action="store_true",
                    help="关闭默认排除, 连缓存/插件目录也扫描")
    args = ap.parse_args()
    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print(json.dumps({"error": f"root 不存在: {root}"}, ensure_ascii=False))
        sys.exit(2)
    repos = discover(root, no_exclude=args.no_exclude)
    if args.discover_only:
        print(json.dumps({"root": root, "repos": repos}, ensure_ascii=False, indent=2))
        return
    results = [process_repo(r, no_push=args.no_push) for r in repos]
    summary = {
        "root": root,
        "total": len(results),
        "pushed": sum(1 for r in results if r["result"] == "已推送"),
        "skipped": sum(1 for r in results if r["result"].startswith("跳过")),
        "failed": sum(1 for r in results if r["result"] == "失败"),
        "results": results,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
