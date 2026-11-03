# scientific-computing preset

面向科学计算与数值实验 feature 的 Spec Kit 模板包。这里的 feature 通常对应一个独立实验、数值研究任务或共享实验能力；核心主张是：**实验笔记、实验定义与实现分离**，spec 是实验定义的权威来源。

新实验保留 spec → plan → tasks → 验证与收敛，已有实验按影响增量维护；Paper 使用 `scientific-paper` 独立技能包（源位于 `~/.agents/sdd/specify/dev/scientific-paper/`），直接维护论文大纲与正文，不另建 Paper feature。

实验笔记允许为计算实现简写。正式理论成文前须检索并阅读全文、核验适用条件，再独立组织论证并核对实验约定；不能把笔记直接当作投稿稿件。

## 文件

- `preset.yml` — manifest，声明 id / provides / replaces
- `templates/constitution-template.md` — 项目宪法：7 条原则（spec 权威、实验笔记与论文分离、feature 边界清晰、可重复可追溯、数值正确性优先于性能、技术风格映射到 scientific skills）
- `templates/spec-template.md` — 实验定义：科学问题 / 系统定义 / 参数 / 流程 P0x / 数值要求 / observables / VAL / 可重复性 / INV / 依赖
- `templates/plan-template.md` — 实现方案：Spec→实现映射、数值方法、数据结构、并行、Validation/Reproducibility Plan
- `templates/project-agents.md` — 项目根 AGENTS.md 的轻量工作约定，安装时合并，保留已有规则
- `templates/tasks-template.md` — 任务：按 Phase 推进，Performance 在 Validation 之后
- `commands/speckit.specify.md` — 从自然语言需求创建或更新 feature specification
- `commands/speckit.clarify.md` — 澄清 spec 中影响科学语义、边界、输出或验证的关键歧义
- `commands/speckit.plan.md` — 根据 spec 生成实现计划
- `commands/speckit.tasks.md` — 根据 spec 和 plan 生成可执行任务列表
- `commands/speckit.analyze.md` — 只读检查 spec / plan / tasks 的完整性、一致性与 constitution 符合度
- `commands/speckit.implement.md` — 实现、验证，验证通过后连续执行正式实验
- `commands/speckit.converge.md` — 审计实现与结果是否满足 spec / plan / tasks，剩余工作补回 tasks
- `skills/` — 随 preset 源维护的 scientific skills bundle；项目使用时同步到局部 `.agents/skills/`
- `assets/fonts/times-new-roman/` — 绘图模板依赖的四种原始 TTF 与授权说明
- `scripts/install-fonts.sh` — 将随包字体依赖安装到项目 `assets/fonts/`；支持重复执行，不覆盖内容不同的文件

## 固定项目布局

目录约定的项目入口为 `docs/README.md`；初始化时创建或更新该导航，
后续模板与 skills 引用它，不各自发明路径。

```text
assets/fonts/noto-serif-cjk/    # Regular / Bold OTF + 上游 LICENSE
assets/fonts/times-new-roman/   # 随 computing preset 提供的四种 TTF + 原授权说明
docs/README.md                 # 导航与固定路径约定
docs/planning/                 # paper-outline.md、experiment-map.md
docs/status/                   # paper.html、experiments.html
docs/experiment-notes/         # 实验实现所需的模型、公式与计算约定
docs/paper/                    # LaTeX 工程
specs/<feature>/               # spec / plan / tasks
figs/<feature>/                # PDF 主图与 PNG 预览
```

上述路径均相对于项目根目录。不在根目录再生成
规划文件、HTML 看板或字体。Paper 使用唯一的 `paper-outline.md`，
不创建论文 feature 或 paper-map。状态页链接必须相对于 `docs/status/`，例如
`../planning/experiment-map.md`、`../../specs/<feature>/spec.md`、
`../../figs/<feature>/...png`；发布地址也应使用新目录。

中文论文通过 `../../assets/fonts/noto-serif-cjk/` 加载字体；
Times New Roman 的四种本地字形为 `times.ttf`、`timesbd.ttf`、`timesi.ttf`、
`timesbi.ttf`，由 `apply_figure_style()` 按文件注册并优先于系统同名字体，
无需系统安装。开发源在 `assets/fonts/times-new-roman/` 保存这四个字体文件，
安装 preset 后运行 `scripts/install-fonts.sh`，复制到项目同名目录。
字体保留原授权说明，不与 Noto 的 SIL OFL 混用。
正式出图须检查实际字体路径，不能把静默回退视为复现一致；PDF 嵌入字体后，
单纯编译论文不再需要绘图字体。

## 日常维护与整体对齐

将 `templates/project-agents.md` 的适用规则合并到项目根 `AGENTS.md`。
已有 AGENTS.md 时保留原有内容，preset 升级不自动覆盖项目规则。
项目规则负责日常增量维护，analyze/converge 负责按需审计与收敛，无需返工插件。

- `$speckit-analyze 全项目`：只读检查所有 feature 与跨实验的规划、归属和依赖。
- `$speckit-converge 全项目 仅检查`：只读核验实现、实际产物和验证证据。
- `$speckit-converge 全项目`：审计后仅将已有规范下的缺口补回相应 tasks，避免重复任务。
- 修复并对齐时按问题所在层处理后复查；不以修改验收标准迁就代码，不把未核验项当成通过。
- 全项目审计不改变 feature 指针或分支，不自动提交真机任务、重跑正式实验或生成看板。

## 标识约定

`P##` 实验步骤、`VAL-###` 验证标准、`INV-###` 实验不变量、`T###` 任务。跨文档用这些 ID 互引，避免同一事实写两份。

实验 feature 通常按项目既有命名约定使用 `expXX` 或 `shared-XX` 目录。实验过程和结果产物使用项目约定的 `S##` / `D##` 标识，并由对应 feature 的 spec 绑定其来源与验证条件。

## 安装到项目

```bash
specify init --here --integration codex --script sh # 初始化
specify preset add --dev ~/.agents/sdd/specify/dev/scientific-computing --priority 3
bash .specify/presets/scientific-computing/scripts/install-fonts.sh .
specify preset resolve spec-template
```

具体的dev会被复制到 `.specify/presets/`

改完源目录后重装：

```bash
specify preset update scientific-computing --dev ~/.agents/sdd/specify/dev/scientific-computing --priority 3
bash .specify/presets/scientific-computing/scripts/install-fonts.sh .
```

字体安装脚本可在任意工作目录调用，参数为项目根目录。重复运行时跳过内容
相同的文件；目标文件内容不同时先报错，不覆盖项目自定义字体。Noto 中文字体
由 `scientific-paper` 独立技能包的对应脚本提供。不要只复制模板却遗漏字体依赖。

## 局部 Skills 安装

修改 preset commands 后，用 `specify integration upgrade codex --script sh` 更新生成的 Speckit 入口。
如果 CLI 提示托管文件已修改，先比较并把需要保留的定制合并到源；确认后再加 `--force` 重新生成。
项目 AGENTS.md 和独立领域 skills 按各自的安装/合并规则维护。

`skills/` 是该 preset 配套 skills 的 canonical source。创建或升级项目后，在项目根目录同步到局部目录：

```bash
mkdir -p .agents/skills
cp -a /path/to/scientific-computing/skills/. .agents/skills/
bash /path/to/scientific-computing/scripts/install-fonts.sh .
```

Codex 自动发现项目 `.agents/skills/`；同名技能冲突时检查启动诊断。同步已有项目时，先比较同名目录的 diff；如果项目已经定制过 skill，不要直接覆盖。`skills/VERSION` 记录当前 bundle 版本。

当前 bundle 包含：

- `scientific-research-computing`
- `scientific-project-environment`
- `scientific-figure-style`
- `scientific-package-development`
- `scientific-experiment-map`
- `scientific-project-status`

`scientific-experiment-map` 负责实验数据产品与生产 feature 的归属映射；`scientific-project-status` 生成论文和实验状态看板。两者均随本 preset bundle 维护。
