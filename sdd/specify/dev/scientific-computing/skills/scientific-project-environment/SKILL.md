---
name: scientific-project-environment
description: 管理科学计算项目中的 Julia 与 Python 运行环境。用于选择解释器、运行 Julia/Python、安装依赖、创建或恢复项目环境，以及处理 Project.toml、Manifest.toml、CondaPkg.toml、Pkg.instantiate、CondaPkg 等环境相关任务。Julia 使用项目本地 Project.toml；Python 由 Julia CondaPkg 统一管理，不使用项目外的 venv 或系统 pip。
---

# Scientific Project Environment

## 核心原则

- 环境属于项目根目录，不属于当前 shell 目录。
- Julia 使用项目本地 `Project.toml`。
- Python 统一由 Julia `CondaPkg` 管理。
- 不创建 `.venv` / `venv`，不使用系统 `pip` 管理项目依赖。

## 定位项目根目录

先确定项目根目录。

优先以包含以下文件或目录的位置为项目根：

- `Project.toml`
- `CondaPkg.toml`
- `.git`

当前目录可能是 `src/`、`scripts/` 等子目录；后续环境路径均相对于项目根目录解析。

## Julia

运行 Julia 时使用项目环境：

```bash
julia --project=<project-root> --startup-file=no ...
```

已有 `Project.toml` 时，需要恢复依赖则运行：

```bash
julia --project=<project-root> --startup-file=no \
  -e 'using Pkg; Pkg.instantiate()'
```

需要添加 Julia 包时，通过该项目的 `Pkg` 修改 `Project.toml`。

不要使用全局 Julia environment。

## Python

项目 Python 由 CondaPkg 管理。

选择解释器时：

1. 若 `<project-root>/.CondaPkg/.pixi/envs/default/bin/python` 存在，直接使用。
2. 否则若项目存在 Julia 环境，通过：

```bash
julia --project=<project-root> --startup-file=no \
  -e 'using CondaPkg; print(CondaPkg.which("python"))'
```

获取解释器。
3. 若 CondaPkg 环境尚未建立，先实例化项目环境，而不是创建 venv。

Python 依赖写入项目根目录的 `CondaPkg.toml`。

## 建立新项目环境

Julia 依赖：

```text
Project.toml
```

Python 依赖：

```text
CondaPkg.toml
```

需要 Python 时，将 `CondaPkg` 加入 Julia 项目并实例化环境。

## 禁止

项目内不要：

- 创建 `.venv/` 或 `venv/`
- 使用系统 `pip install`
- 裸运行 `julia -e` 并落入全局 Julia environment
- 在存在项目环境时随意使用系统 Python
