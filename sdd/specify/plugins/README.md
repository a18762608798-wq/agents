# Spec Kit 项目插件源码

这里存放初始化项目后可手动安装的插件，不是任何宿主的全局自动加载目录。

* [`speckit-rework/`](speckit-rework/README.md)：已有 feature 的返工门禁，含 Pi、OpenCode、Codex 三份宿主实现及安装说明。
* `.agents/plugins/marketplace.json`：Codex 的共享 `sdd-local` catalog；注册 catalog 只提供包来源，不代表全局启用。

工作流模板/presets/领域 skills 仍放在 `../dev/`。公式规则等通用插件继续留在宿主全局配置中。
