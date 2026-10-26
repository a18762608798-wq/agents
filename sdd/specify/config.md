# 配置

## 前提

- 已按 `install.md` 装好 `specify`。
- 站在你的项目根目录，`git status` 干净（已有项目直接 `--here`，不是重建项目）。
- 记住两套接口：终端跑 `specify ...`（装工作流），OpenCode 聊天框用 `/speckit.*`（真正干活）。

## 内容

初始化（告诉 Spec Kit 按 OpenCode 能识别的格式生成文件）：

```bash
specify init --here --integration opencode --script sh
```

> SDD 方法论通用：opencode/pi 只需换 `--integration` 关键字（`opencode`→`pi`），流程不变。

参数说明：

- `--here`：在当前目录初始化；目录非空需加 `--force`。
- `--script sh`：Linux Mint 用 `sh`；Windows 用 `ps`，或统一用 `py`。

实测生成以下文件(**默认工作流**)：

```text
your-project/
│
├── .opencode/commands/speckit.{specify,clarify,plan,tasks,implement,...}.md
├── .specify/
│   ├── memory/
│   │   └── constitution.md      ★ 项目级规则(放跨 cycle 不变的规则)
│   │
│   ├── templates/               ← Spec Kit 自己的模板
│   ├── scripts/                 ← 自动化脚本
│   └── ...
│
└── specs/
    │
    └── 001-user-auth/
        ├── spec.md              ★ 需求：WHAT / WHY(具体实验细节需求, 本cycle不变的规则)
        ├── tasks.md             ★ 实现任务(主要是门)
        ├── plan.md              ○ 技术方案：HOW
        │
        ├── research.md          ○ 技术调研/决策
        ├── data-model.md        ○ 数据模型
        ├── quickstart.md        ○ 验证/使用场景
        │
        ├── contracts/           ○ API/interface contract
        │   └── ...
        │
        └── checklists/
            └── requirements.md  ★ 需求质量检查(但是一般用不到, 除非有安全问题)
```

分工：`.opencode/` 是给 OpenCode 看的操作说明，`.specify/` 是 SDD 引擎（规则+模板+脚本）。`scripts/` 一般不要手工改。

已有项目接 Spec Kit：先提交干净，再 `--here`，先写 `constitution` 描述现有架构约束，再逐个 feature 纳入。

## 验证

```bash
ls .opencode/commands
ls .specify
```

在 OpenCode 输入 `/` 能看到 `/speckit.specify` 等命令即成功（以 `/` 补全和 `.opencode/commands/` 下实际文件名为准）。
