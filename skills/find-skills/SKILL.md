---
name: find-skills
description: 当用户提出"怎么实现 X"、"帮我找一个 X 的技能"、"有没有能做 X 的技能"等问题，或表达想要扩展能力的意图时，帮助用户发现和安装 agent 技能。当用户寻找可能以可安装技能形式存在的功能时，应使用此 skill。安装前，根据硬编码的技能路径选择物理安装目录。如果没有明确的目录要求，优先选择 OpenCode，其次 Claude Code。
---

# 查找技能

此技能帮助你从开放的 agent 技能生态系统中发现和安装技能。

## 何时使用此技能

在以下情况下使用此技能：

* 用户问"怎么实现 X"，而 X 可能是已有技能覆盖的常见任务
* 用户说"帮我找一个 X 的技能"或"有没有做 X 的技能"
* 用户问"你能做 X 吗"，而 X 是一项专门的能力
* 用户表达了扩展 agent 能力的兴趣
* 用户想要搜索工具、模板或工作流
* 用户提到希望在某些特定领域（设计、测试、部署等）获得帮助

## 什么是 Skills CLI？

Skills CLI（`npx skills`）是开放的 agent 技能生态系统的包管理器。技能是模块化的包，通过专业化的知识、工作流和工具来扩展 agent 的能力。

**核心命令：**

* `npx skills find [query] [--owner <owner>]` — 交互式或按关键字搜索技能，可限定 GitHub 所有者范围
* `npx skills add <package>` — 从 GitHub 或其他来源安装技能
* `npx skills update` — 更新所有已安装的技能

**浏览技能：**<https://skills.sh/>

## 如何帮助用户查找技能

### 第 1 步：理解用户需求

当用户寻求某项帮助时，识别以下内容：

1. 领域（例如 React、测试、设计、部署）
2. 具体任务（例如编写测试、创建动画、审查 PR）
3. 该任务是否足够常见，以至于很可能已有对应技能

### 第 2 步：优先查看排行榜

在运行 CLI 搜索之前，先查看 [skills.sh 排行榜](https://skills.sh/)，看看该领域是否已有知名技能。排行榜按总安装量排名，展示最受欢迎且经过验证的选项。

例如，Web 开发领域的顶尖技能包括：

* `vercel-labs/agent-skills` — React、Next.js、网页设计（单项安装量均超 10 万）
* `anthropics/skills` — 前端设计、文档处理（安装量超 10 万）

### 第 3 步：搜索技能

如果排行榜中没有覆盖用户的需求，运行查找命令：

```bash
npx skills find [query] [--owner <owner>]
```

例如：

* 用户问"怎么让我的 React 应用更快？" → `npx skills find react performance`
* 用户问"你能帮我做 PR 审查吗？" → `npx skills find pr review`
* 用户问"我需要创建一个 changelog" → `npx skills find changelog`

### 第 4 步：推荐前验证质量

**不要仅凭搜索结果就推荐技能。**务必验证：

1. **安装量** — 优先选择安装量 1K+ 的技能。对安装量低于 100 的技能需谨慎对待。
2. **来源信誉** — 官方来源（`vercel-labs`、`anthropics`、`microsoft`）比不知名作者更值得信赖。
3. **GitHub stars** — 检查源仓库。来自 star 数低于 100 的仓库的技能应持怀疑态度。
4. **安装路径** — 检查 `SKILL.md`、脚本和配置文件中是否有硬编码的、特定于 agent 的路径。

留意以下路径：

```text
~/.config/opencode/skills/
~/.claude/skills/
```

遵循以下规则：

* 如果操作命令或脚本硬编码了 `~/.config/opencode/skills/`，则为 `opencode` 安装。
* 如果操作命令或脚本硬编码了 `~/.claude/skills/`，则为 `claude-code` 安装。
* 如果技能仅使用相对路径或可移植路径，则为 `opencode` 安装。
* 如果两个目录同样受支持，优先选择 `opencode`，其次 `claude-code`。
* 仅在 README 安装示例中提及的路径不视为操作层面的硬编码。
* 如果操作路径存在冲突，应报告冲突而非自动安装。
* 如果技能强依赖于 Codex 特有的路径、命令、钩子或行为，且无法通过 OpenCode 或 Claude 兼容目录工作，则不要安装。报告该技能与当前目标环境不兼容。

所选的 `--agent` 值控制物理安装目录，并不一定决定用户将使用哪个 agent 来加载该技能。

### 第 5 步：向用户展示选项

找到相关技能后，向用户展示以下信息：

1. 技能名称及其功能
2. 安装量和来源
3. 选定的安装目标及原因
4. 用户可以运行的安装命令
5. 在 skills.sh 上了解更多信息的链接

示例回复：

```text
我找到了一个可能有用的技能！"react-best-practices" 技能提供了来自
Vercel Engineering 的 React 和 Next.js 性能优化指南。
（安装量：18.5 万）

未发现特定于 agent 的安装路径，因此优先选择 OpenCode 全局目录。

安装命令：

npx skills add vercel-labs/agent-skills \
  --skill react-best-practices \
  --global \
  --agent opencode \
  --copy \
  --yes

了解更多：
https://skills.sh/vercel-labs/agent-skills/react-best-practices
```

如果技能需要 Codex 且无法通过受支持的目录使用，按以下方式报告：

```text
此技能强依赖于 Codex 专属功能，无法通过当前的 OpenCode 环境可靠使用。

Codex 专属依赖：
<描述所需的路径、命令、钩子或行为>

该技能未被安装。
```

### 第 6 步：提供安装

如果用户决定继续，使用路径检查阶段选定的目标来安装技能。

**OpenCode** — 当不需要特定 agent 路径时的默认选择：

```bash
npx skills add <owner/repo> \
  --skill <skill-name> \
  --global \
  --agent opencode \
  --copy \
  --yes
```

**Claude Code** — 当技能在操作层面硬编码了 `~/.claude/skills/` 时：

```bash
npx skills add <owner/repo> \
  --skill <skill-name> \
  --global \
  --agent claude-code \
  --copy \
  --yes
```

`--global` 标志表示在用户级别安装，`--copy` 将文件物理放置在所选 agent 目录中，`--yes` 跳过确认提示。

不要使用以下这种含义模糊的命令：

```bash
npx skills add <owner/repo@skill> -g -y
```

务必明确指定所选的 `--agent` 和 `--skill`。

当技能需要 Codex 特有的行为且无法通过 OpenCode 或 Claude 兼容目录工作时，不要安装。

## 常见技能分类

搜索时，可考虑以下常见分类：

| 分类       | 示例查询                                  |
| ---------- | ----------------------------------------- |
| Web 开发   | react, nextjs, typescript, css, tailwind  |
| 测试       | testing, jest, playwright, e2e            |
| DevOps     | deploy, docker, kubernetes, ci-cd         |
| 文档       | docs, readme, changelog, api-docs         |
| 代码质量   | review, lint, refactor, best-practices    |
| 设计       | ui, ux, design-system, accessibility      |
| 生产力     | workflow, automation, git                 |

## 高效搜索的技巧

1. **使用具体的关键字**："react testing" 比仅用 "testing" 更好
2. **尝试替代词**：如果 "deploy" 找不到，试试 "deployment" 或 "ci-cd"
3. **关注热门来源**：很多技能来自 `vercel-labs/agent-skills` 或 `ComposioHQ/awesome-claude-skills`
4. **检查安装路径**：优先选择操作层面硬编码路径所要求的目录
5. **默认使用 OpenCode**：当技能可移植时，优先选择 OpenCode 全局目录
6. **拒绝仅限 Codex 的技能**：如果技能离开 Codex 特有行为就无法运行，报告不兼容而非安装

## 未找到技能时

如果没有找到相关技能：

1. 告知用户未找到现有技能
2. 主动提供使用通用能力直接帮助完成该任务
3. 建议用户可以用 `npx skills init` 创建自己的技能

示例：

```text
我搜索了与 "xyz" 相关的技能，但没有找到匹配项。
我仍然可以直接帮你完成这个任务！需要我继续吗？

如果这是你经常做的事情，你可以创建自己的技能：

npx skills init my-xyz-skill
```

