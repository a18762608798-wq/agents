# Spec Kit 项目局部返工插件

本目录是三种宿主实现的 canonical source，不是全局插件目录。初始化项目后按需手动安装，
`specify init` 和现有 presets 不会自动部署这些自定义插件。公式规则不是本插件的一部分，
继续作为各宿主的全局插件使用。

```text
speckit-rework/
├── pi/speckit-rework-gate.ts
├── opencode/speckit-rework-gate.ts
└── codex/
    ├── .codex-plugin/plugin.json
    ├── .mcp.json
    ├── hooks/ scripts/ skills/ vendor/
    └── tests/
```

Codex 的共享 marketplace 位于上一级 `plugins/.agents/plugins/marketplace.json`，
名称为 `sdd-local`，只提供 `speckit-rework`，不包含公式插件。

## 前提

1. 在目标项目根目录完成 Spec Kit 初始化，选择相应的 integration。
2. 检查现有配置和 Git 修改，不覆盖项目已有的定制插件。
3. 下面所有项目相对路径均以项目根目录为准；安装仅针对这个项目。
4. 这次整理没有给任何已有项目自动安装插件。旧的用户级 Pi/OpenCode 源文件已移除，
   Codex 的 `speckit-rework@dell-local` 全局安装已卸载；运行中的客户端需重新加载/重启。

## Pi：复制到项目扩展目录

在目标项目根目录执行：

```bash
mkdir -p .pi/extensions
cp -n "$HOME/.agents/sdd/specify/plugins/speckit-rework/pi/speckit-rework-gate.ts" .pi/extensions/
```

重启 Pi 或运行 `/reload`，并审核信任项目资源。该文件通过 Pi 的项目扩展发现机制加载，
不要放回 `~/.pi/agent/extensions/`。`cp -n` 不覆盖已有文件；升级前先比较 diff，保留项目定制。

## OpenCode：复制到项目插件目录

在目标项目根目录执行：

```bash
mkdir -p .opencode/plugins
cp -n "$HOME/.agents/sdd/specify/plugins/speckit-rework/opencode/speckit-rework-gate.ts" .opencode/plugins/
```

重新加载/重启 OpenCode。不要放回 `~/.config/opencode/plugins/`。
当前源码对 `@opencode/plugin` 只有 type import，运行时代码使用 Node 内置模块；按宿主
版本处理项目自身的 SDK 类型依赖，不要盲目覆盖项目 `package.json`。

## Codex：共享包缓存，项目单独启用

Codex 可以把包存于用户级缓存，但开启范围由项目配置决定，不必在每个项目复制整包。

### 1. 注册共享源码目录（通常只做一次）

```bash
codex plugin marketplace add "$HOME/.agents/sdd/specify/plugins"
```

这只注册 `sdd-local` catalog，不等于全局启用插件。

### 2. 安装到缓存，并关闭默认的用户级启用

```bash
codex plugin add speckit-rework@sdd-local
```

**注意：此 CLI 命令会默认写入全局 `enabled = true`。安装后立即在
`~/.codex/config.toml` 中把对应条目改成下面这样；升级/重新安装后也要检查：**

```toml
[plugins."speckit-rework@sdd-local"]
enabled = false
```

只合并这个条目，不要覆盖用户的模型、其他插件、MCP、凭证或整个配置文件。
不要只执行 `plugin add` 就结束，否则会重新变成全局插件。

### 3. 在这个项目中开启

在项目的 `.codex/config.toml` 中合并：

```toml
[plugins."speckit-rework@sdd-local"]
enabled = true
```

用户级 false、已信任项目级 true 的覆盖方式已用隔离的 `CODEX_HOME` 验证：
项目内加载三个返工 hooks 和七个控制工具；项目外即使已有缓存也不加载。

### 4. 审核信任与检查

从该项目重新启动 Codex，审核项目配置，并运行 `/hooks` 信任
`speckit-rework@sdd-local` 的三个 hook。安装/配置开启本身不会授予 hook 信任。

* SessionStart：恢复并注入事务状态。
* UserPromptSubmit：识别普通返工与真实 `/speckit.*` 命令。
* PreToolUse：执行前检查修改通道，并为控制工具绑定真实会话。

MCP server 名称为 `speckit_rework`；原生工具前缀为 `mcp__speckit_rework__`。
不要将这个 MCP 再写入全局 `[mcp_servers]`，它由项目启用的插件提供。

## 门禁行为

* 七个控制工具：列 feature、选择、影响评估、阶段 gate、勾任务、关闭、重置。
* 影响评估决定受影响阶段，并自动包含下游依赖；顺序为 spec、plan、tasks、checklists。
* update/no-change 使用文件 hash 证据；checklists 未通过时不能进入实现。
* 实现仅允许申报 scope 内文件，规范工件冻结；tasks 只能通过专用工具勾选，不能改任务文字。
* 原实现自动返工的条件是 `.specify/feature.json` 指向已具备 spec、plan、tasks 且至少
  完成一个任务的 feature。正常新功能和尚未实现的 feature 不自动进入返工。
* Pi 与 OpenCode 源码是原样迁移，不能仅因为它们名称相同就假定所有安全边界一致。

### Codex 适配的更保守策略

Codex 复用 Pi 的状态机与 shell 分析器，宿主适配层另做以下收紧：

* 文件修改必须走原生 `apply_patch`；每个新增、修改、删除及重命名的两个端点均检查。
* 活跃事务中拒绝 shell 文件写入，即使目标在 scope 内；只放行能识别的同步只读命令。
  解释器、交互式命令、后台/分组执行、环境或 shell 覆盖、未知命令均可能被拒绝，
  包括测试/构建命令。不要临时关闭插件绕过。
* 活跃事务中拒绝子代理、未知本地函数和任意外部 MCP 写入；仅明列的只读查询可继续。
* 检查仓库外路径、符号链接越界、Codex/Git 可执行配置和 Spec Kit 基础设施。
* 控制调用通过 hook 注入的一次性、参数绑定 token 关联到真实 Codex session；不要让
  模型自行提供 session id 或 `_codex_gate_token`。未信任 hook 时控制工具拒绝缺失绑定。
* 状态保存在 `$CODEX_HOME/local-plugin-state/speckit-rework/`，默认位于 `~/.codex/`；
  这是私有运行状态，不代表全局启用。使用原子替换和跨进程锁。
* resume/compact 保留事务；fork 首次写入重新评估；blocked 必须显式 reset。
* 只有真实前导 `/speckit.*` 命令旁路，说明文字中提及命令不能清事务。

## 安全边界

这是依赖宿主执行的门禁，不是 OS 沙箱。保留各宿主已有的审批和沙箱。

* Codex hooks 未信任、被禁用或宿主跳过时没有运行时拦截；启动失败/超时等宿主错误也
  可能 fail-open。脚本内部可捕获的错误会返回明确 deny，但不能修复宿主失效。
* 已经运行的后台进程、事务之前打开的执行会话、手工改文件、其他客户端和网络副作用，
  以及补丁预检与实际执行之间的竞态，不属于完整隔离边界。
* Codex `write_stdin` 不再触发 PreToolUse，因此本适配器不允许事务内新建交互式 shell。
* 私有锁异常退出后可能遗留。先确认锁内 PID 已结束，再由用户明确决定清理特定锁；
  插件不会自行删除未知锁或静默重置损坏状态。
* 本地单元测试和原生发现测试不等于真实模型修改任务的端到端验收。

## 测试与检查

```bash
node --test "$HOME/.agents/sdd/specify/plugins/speckit-rework/codex/tests/rework.test.mjs"
python3 "$HOME/.agents/sdd/specify/plugins/speckit-rework/codex/tests/test_project_activation.py"
python3 "$HOME/.agents/sdd/specify/plugins/speckit-rework/codex/tests/validate_installed.py" --project /absolute/path/to/project
```

第一项为 25 个门禁回归测试；第二项在临时 Git 项目和临时 `CODEX_HOME` 中验证项目内启用、
项目外不加载，不使用真实用户凭证。第三项检查已经由用户安装/信任项目配置的实际项目，
不发送模型 turn，不授予 hook 信任。

当前 Codex 0.166.0 使用已验证的 `.codex-plugin/plugin.json` / `.mcp.json` 兼容布局。
`*.portable.example.json` 仅作参考，不要直接改名替换实际入口；此版本的 portable 根
manifest 在实测中会忽略 bundled hooks/MCP。

Pi vendoring 来源和最小源码改动见 `codex/VENDOR.md`。Codex 适配需要 Node.js 22.19+；
不导入 Pi 运行时，不依赖 Zotero 的 Python 虚拟环境。LSP、workspace-history 和通用安全
插件不属于本包。本目录源码升级不会自动覆盖已安装项目的副本或缓存。
