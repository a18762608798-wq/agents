# scientific-paper preset

面向“数值结果 → 正式 LaTeX 论文”的 Spec Kit 模板包。核心主张：**论文的每个主张都绑定上游数据产物，缺件留空不编数，解释性正文问用户要推测并标记待验证**。

依赖上游 `scientific-computing` 产物：`specs/expXX`（实验定义）、`S##`（共享输出）、`D##`（数据集 + `figs/` 图）、`docs/paper-outline.md`（论文大纲）。

## 文件

- `preset.yml` — manifest，声明 id / provides / replaces
 - `templates/constitution-template.md` — 论文宪法：spec 权威、证据绑定、数字不编、缺件协议（GAP-DATA 留空 / GAP-INTERP 问用户要推测）、8 个 paper-* skills 分工
- `templates/spec-template.md` — 论文定义：主张 / 上游输入 / 章节 / 图位 / 引用需求 / 缺件；合同：SEC / FIG / CLM / GAP / CIT
- `templates/plan-template.md` — 章节→skill 映射、LaTeX 工程结构、编译与评审计划
- `templates/tasks-template.md` — 任务：按 Assemble → Write → Cite → Format → post-implement review 推进
- `commands/speckit.specify.md` — 从论文主线创建或更新 paper specification
- `commands/speckit.clarify.md` — 澄清主张口径，向用户要依赖结果的解释推测
- `commands/speckit.plan.md` — 根据 spec 生成写作计划
- `commands/speckit.tasks.md` — 根据 spec 和 plan 生成可执行任务列表
- `commands/speckit.analyze.md` — 只读检查 spec / plan / tasks 的完整性、一致性与 constitution 符合度
- `commands/speckit.implement.md` — 按 tasks 执行写作与编译；随后由 `paper-self-review` / `paper-revision` skill 完成 post-implement review loop，最后由 converge 审计
- `commands/speckit.converge.md` — 审计成文是否满足 spec，推测转正或降级，剩余工作补回 tasks

注意：本 preset 没有 `/speckit.review` 命令。`paper-self-review` 和
`paper-revision` 是 Implement 完成后的 skill 调用；`/speckit.converge`
只负责最终审计与收敛。

## 局部 Skills 安装

本 preset 的 `paper-*` skills 随模板仓库维护，不再安装到全局 skills。创建论文项目后，
在项目根目录执行一次：

```bash
mkdir -p .opencode/skills
cp -a /path/to/scientific-paper/skills/. .opencode/skills/
```

项目局部 `.opencode/skills/` 优先于全局 skills。模板升级后需要人工重新同步；已经被项目
定制过的 skill 不要直接覆盖，应先比较 diff。`skills/VERSION` 记录当前 skill 版本。

## 可选审阅环境

如果执行 `paper-self-review` 的 PDF 审阅，项目需要通过 CondaPkg 提供 PyMuPDF。
在项目根目录的 `CondaPkg.toml` 中加入：

```toml
[deps]
pymupdf = ""
```

然后解析项目环境：

```bash
julia --project=. --startup-file=no \
  -e 'using CondaPkg; CondaPkg.resolve()'
```

使用 `.CondaPkg/.pixi/envs/default/bin/python` 运行审阅脚本，不创建 `venv`，
也不使用系统 `pip`。如果 PDF 结构解析无法识别 section，使用纯文本提取回退，
并在审阅报告中记录该回退。

## 标识约定

`SEC-###` 章节、`FIG-###` 图位、`CLM-###` 主张（绑定 `D##`）、`GAP-###` 缺件（`-DATA` 缺数缺图 / `-INTERP` 待解释）、`CIT-###` 引用需求、`T###` 任务。跨文档用这些 ID 互引，避免同一事实写两份。

## 安装到项目

```bash
specify init --here --integration opencode # 初始化
specify preset add --dev ~/.config/opencode/sdd/specify/dev/scientific-paper --priority 4
specify preset resolve spec-template
```

具体的dev会被复制到 `.specify/presets/`

改完源目录后重装：

```bash
specify preset update scientific-paper --dev ~/.config/opencode/sdd/specify/dev/scientific-paper --priority 4
specify integration upgrade opencode --force --script sh
```

修改本 preset 源目录后，先用 `specify preset update` 更新项目中的 preset，
再用 `specify integration upgrade` 更新 OpenCode 的 `.opencode/commands/` 集成文件。
不要手工把 preset command 复制到 `.opencode/commands/`；priority 越小越优先，
当前项目通常使用 `scientific-computing` priority 3 管理实验 feature，使用
`scientific-paper` priority 4 管理论文 feature。需要切换到论文命令时，暂时将
`scientific-paper` 调整为更高优先级（更小的数字）。
