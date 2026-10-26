# 自定义 commands / templates

> 只讲自定义，不讲完整 Spec Kit 流程。完整流程看 `../default.md`。
> 本机实测 `specify 1.0.12`（`specify check` 显示 opencode 可用）。下述命令均已对过 `--help`。

## 定位

```text
Spec Kit engine（CLI / 解析 / workflow）  通常不用动
Commands（AI 怎么思考、怎么执行）          高度可定制
Templates（spec/plan/tasks 长什么样）      几乎完全可定制
```

方法论层面约 90% 自由，框架层仍然是 Spec Kit。

## 1. 最轻量：项目内 override

只改当前项目，不复用：

```text
.specify/templates/overrides/spec-template.md
```

存在即覆盖默认 `spec-template.md`。查找优先级（已按官方文档校准）：

```text
.specify/templates/overrides/ → .specify/presets/<id>/ → .specify/extensions/ → .specify/templates/
```

只提供几个文件就只覆盖几个，没提供的回落到默认，不要求一次重写全部。

## 2. 系统化：Preset(预设)

长期维护一套方法论时用 Preset，典型结构(如果有模块没有提供, 那么就会使用默认)：

```text
~/dev/spec-kit-scientific/
├── preset.yml # manifest: id, provides, replaces
├── templates/
│   ├── spec-template.md
│   ├── plan-template.md
│   ├── tasks-template.md
│   └── constitution-template.md
└── commands/
    ├── speckit.specify.md
    ├── speckit.plan.md
    └── speckit.tasks.md
    └── ...(看情况添加比较的替换)
```

开发期挂本地目录（已验证，`--priority` 越小越优先，默认 10）：

```bash
specify preset add --dev /path/to/my-preset --priority 5 # specify 不涉及具体template的选择参数, 只能通过优先级调整.
specify preset resolve spec-template # 选择哪一个template(工作目录中可以不止一个模板)
specify preset list
specify preset set-priority <id> 5
specify preset update <id> --dev /path/to/my-preset # 更新源
```

## 3. 关键区分：Template vs Command

- `spec-template.md`：最终 spec 长什么样。
- `speckit.specify.md`：AI 怎么理解需求、怎么填 spec。

只改 Template 不改 Command，会出现“换了输出结构，没换思考方式”（如还在找 user story / actor）。科学计算类改造 **一般两者都要换**。

## 4. Command 组合方式

> 一般我们就replace

默认 `replace`（完整替代），另有 `prepend / append / wrap`。注意：它们操作的不是“紧挨着的下一个 preset”，而是“剩余整个低优先级栈递归解析出的结果”。

```text
priority 1 → 最高，数字越小越优先
priority 5
priority 10
Core     → 最低
```

例：A(1, prepend AAA) + B(5, prepend BBB) + C(10, append CCC) + CORE，最终是：

```text
AAA
BBB
CORE
CCC
```

## 5. Constitution 稍特殊

```text
constitution-template.md → /speckit.constitution → .specify/memory/constitution.md → 各命令读取
```

改 preset **不会覆盖**项目现有的 `memory/constitution.md`，需跑 `/speckit.constitution` 重新生成。动手前先定边界：哪些放 Constitution（跨 cycle 不变），哪些放 spec（本 cycle 不变），哪些放 Command。

## 6. Scripts 也可覆盖

暂时不用.

## 7. 多 Preset 叠加

不同 preset 管不同切面（如 `base-scientific + reproducibility + my-lab-rules`），用 priority 解决冲突：同名文件高优先级胜出，不同文件组合生效。

## 8. 边界

改不动的主要是外围框架：`feature directory`、`spec.md / plan.md / tasks.md` 文件名、`constitution` 概念、`agent integration` 解析机制。想连这些都换，就接近 fork Spec Kit 本身了。
