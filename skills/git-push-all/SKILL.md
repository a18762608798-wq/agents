---
name: git-push-all
disable-model-invocation: true
description: 批量推送当前目录下所有 git 仓库（含当前目录本身），自动 git add、中文 commit、git push。仅在用户明确指定本 skill（说出 git-push-all、要求调用该 skill）或明确下令批量推送全部仓库时触发；日常单个仓库的 commit/push、含糊的同步请求一律不得触发。
---

# Git 批量推送 Skill

## 概述

递归发现当前目录下的所有 git 仓库（含当前目录本身），对每个仓库执行
`git add -A` → 中文自动 commit → `git push`，无变更则跳过，失败则继续并汇总报告。
没有配置远程仓库（`git remote` 为空）的仓库不需要 push，直接跳过（不 commit 也不 push）。
全自动模式，不逐个确认。

## 触发条件（严格显式）

仅在以下情况使用本 skill，其他情况一律不得触发：

- 用户明确说出 skill 名（如 `git-push-all`、"调用批量推送 skill"）。
- 用户明确下令对当前目录下**全部**仓库执行推送（如"把这目录下所有仓库都 push 了"）。

以下情况不得触发：单个仓库的 commit/push、"同步一下代码"等含糊表述、模型自己判断"顺手一起推了"。原因：本 skill 会改动并推送多个仓库，误触发代价高，宁可漏触发等用户明示，也不错推。

## 工作流程

### 1. 发现仓库

优先使用捆绑脚本发现，避免手写 `find` 出错：

```bash
python3 <skill-path>/scripts/push_all.py --root <当前目录绝对路径> --discover-only
```

发现规则（脚本已实现，手动执行时同样遵守）：

- 若 `<root>` 本身含 `.git/`，计入。
- 递归扫描 `<root>` 下所有子目录中含 `.git/` 的目录。
- 遇到嵌套仓库时，父仓库和子仓库都保留（各算一个）。
- 跳过 `.git/` 目录内部，不进入裸仓库（`HEAD` + `objects/` 但无工作区的不处理，标记为跳过）。
- 默认跳过隐藏目录（`.` 开头，如 `.cache/`、`.local/`、`.config/` 下的子仓库）和缓存/插件目录（`node_modules`、`__pycache__`、`.julia/`、`nvim/lazy/` 等），避免在家目录误推几十个只读第三方仓库。如需全量扫描，加 `--no-exclude`。
- 权限不足或损坏的目录记为失败，不中断。

### 2. 逐仓库处理

对每个仓库按顺序执行（不要并行 push，避免 SSH 限流）：

1. `git -C <repo> status --porcelain` 为空 → 记为 `clean-skip`，直接下一个。
2. `git -C <repo> remote` 为空 → 该仓库没有远程仓库，不需要 push，记为 `no-remote-skip`，不 commit 也不 push（避免产生推不出去的本地提交堆积）。
3. `git -C <repo> add -A`（尊重 `.gitignore`，不要用 `git add .` 加指定文件之外的逻辑，不要 `git reset`）。
4. 按下方规范生成中文 commit message 并 `git -C <repo> commit -m "<msg>"`。
5. `git -C <repo> push`。若因无上游分支失败（`no upstream`），则执行一次 `git -C <repo> push -u origin HEAD` 重试。其他失败不重试。
6. 绝不执行 `push --force` / `-f`、`reset --hard`、`stash drop`、`clean -fd`，除非用户在本次请求中明确写出这些词。

推荐直接运行脚本完成 2–5 步：

```bash
python3 <skill-path>/scripts/push_all.py --root <当前目录绝对路径>
```

脚本输出 JSON 摘要（含每个仓库的 status、commit、push 结果），以此为依据写汇总报告。

### 3. 中文 commit message 规范

脚本按此规则自动生成，手动 commit 时同样遵守：

- 首行格式：`<类型>: <概括>（共 N 个文件）`
- 类型从变更推断：全是新文件 → `新增`；全是删除 → `删除`；主要是 `M` → `更新`；混合 `A/M/D/重命名` → `同步`。
- 概括从 `git diff --cached --stat` 和顶层目录名提炼，不超过 30 字，例如：
  - `更新: 同步 Neovim 与 opencode 配置（共 12 个文件）`
  - `新增: 添加 latex 插件与测试（共 3 个文件）`
- 正文（body）列出最多 10 个文件：`M 路径` / `A 路径` / `D 路径`，超出写 `等共 N 个文件`。
- 禁止空 message、禁止 `update`、`fix bug`、`sync 2026-09-18` 这类无信息 message，禁止把 diff 全文塞进 message。

**示例：**

输入：`M .config/nvim/lua/plugins/latex.lua`，`A .config/nvim/test/foo.lua`
输出首行：`新增: 添加 latex 插件与测试（共 2 个文件）`

### 4. 汇总报告

始终用中文表格收尾，每仓库一行：

| 仓库 | 结果 | 说明 |
|------|------|------|
| `/home/mintusr` | 已推送 | 更新: 同步 Neovim 与 opencode 配置（共 12 个文件） |
| `/home/mintusr/sync/foo` | 跳过 | 工作区干净 |
| `/home/mintusr/tmp/bar` | 跳过 | 无远程仓库，无需 push |
| `/home/mintusr/sync/baz` | 失败 | push 被拒绝：...（首行错误） |

最后给出总数：成功 X / 跳过 Y / 失败 Z。失败仓库给出下一步建议（先 pull、解决冲突、检查 SSH），不要擅自修复后强推。

## 注意事项

- 当前目录是家目录大仓库（如 `~/` 本身就是 git）时很常见，不要抱怨文件多，只按流程处理。
- 大输出时用 `git status --porcelain` 和 `--stat` 判断，不要 `cat` 整个 diff。
- push 需要网络/SSH，超时或认证失败记为失败并继续，不要循环重试。
- 没有远程仓库的仓库不需要 push，这是正常跳过、不是失败，不要提示用户去加 remote。
- 用户已选择全自动不确认：不要逐仓库问"是否提交"；只在最后汇总报告。
