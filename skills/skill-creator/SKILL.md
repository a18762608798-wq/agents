---
name: skill-creator
disable-model-invocation: true
description: 创建新 skill，修改和改进已有 skill，以及衡量 skill 性能。当用户希望从头创建 skill、编辑或优化已有 skill、运行评估测试 skill、通过方差分析 benchmark skill 性能，或优化 skill 的 description 以获得更好的触发准确率时使用。
---

# Skill Creator

一个用于创建新 skill 并迭代改进它们的 skill。

从高层来看，创建 skill 的过程如下：

- 决定你希望 skill 做什么以及大致应该如何做
- 编写 skill 草稿
- 创建几个测试提示词，并使用可以访问该 skill 的 opencode 运行它们
- 帮助用户定性和定量地评估结果
  - 在后台运行测试的同时，如果没有定量评估则先起草一些（如果有，你可以直接使用，或者你觉得需要修改也可以进行调整）。然后向用户解释它们（或者如果已经存在，就解释已有的那些）
  - 使用 `eval-viewer/generate_review.py` 脚本向用户展示结果供其查看，同时也让他们查看定量指标
- 根据用户对结果的评估反馈（以及如果定量 benchmark 中暴露出任何明显缺陷）重写 skill
- 重复此过程直到满意为止
- 扩展测试集，在更大规模下再次尝试

当你使用此 skill 时，你的任务是弄清楚用户处于该过程的哪个阶段，然后介入并帮助他们推进这些阶段。例如，用户可能会说"我想为 X 创建一个 skill"。你可以帮助他们明确需求，编写草稿，编写测试用例，确定他们想要如何评估，运行所有提示词，然后重复。

另一方面，如果用户已有 skill 草稿，在这种情况下你可以直接进入评估/迭代循环部分。

当然，你应该始终保持灵活，如果用户说"我不需要跑一堆评估，跟我一起 vibe 就行"，你也可以这样做。

当 skill 完成后（再说一遍，顺序是灵活的），你还可以运行 skill description 优化器（我们有一个单独的脚本来做这件事），以优化 skill 的触发效果。

## 与用户沟通

Skill creator 可能会被编程术语熟悉程度各异的人使用。如果你还没听说（你怎么可能听说呢，这也是最近才开始的），现在有一个趋势——opencode 的强大功能正激励着水管工打开他们的终端，父母和祖父母们去谷歌搜索"how to install npm"。另一方面，大多数用户可能还是相当熟悉计算机的。

所以请注意上下文线索，以决定如何措辞！在默认情况下，给你一些参考：

- "evaluation"和"benchmark"处于临界点，但可以使用
- 对于"JSON"和"assertion"，你需要看到用户有明显的迹象表明他们知道这些东西是什么，然后才能在不解释的情况下使用

如果你不确定，简要解释一下术语是可以的，如果你不确定用户是否能理解，随时可以用简短的定义澄清术语。

---

## 创建 skill

### 捕获意图

首先理解用户的意图。当前对话可能已经包含了用户想要捕获的工作流程（例如，他们说"把这个变成一个 skill"）。如果是这样，先从对话历史中提取答案——使用的工具、步骤顺序、用户所做的修正、观察到的输入/输出格式。用户可能需要补充空白之处，并且应该在进入下一步之前确认。

1. 这个 skill 应该让 opencode 能够做什么？
2. 这个 skill 应该在什么时候触发？（用户的哪些短语/上下文）
3. 预期的输出格式是什么？
4. 我们是否应该设置测试用例来验证 skill 能否正常工作？具有可客观验证输出（文件转换、数据提取、代码生成、固定工作流程步骤）的 skill 可以从测试用例中受益。具有主观输出（写作风格、艺术）的 skill 通常不需要它们。根据 skill 类型建议适当的默认做法，但由用户决定。

### 访谈与研究

主动询问关于边界情况、输入/输出格式、示例文件、成功标准和依赖项的问题。在把这些问题理清之前，先不要编写测试提示词。

检查可用的 MCP——如果对研究有用（查阅文档、寻找类似 skill、查找最佳实践），如果可用的话通过 subagent 并行研究，否则内联进行。准备好上下文以减少用户的负担。

### 编写 SKILL.md

基于用户访谈，填写以下组件：

- **name**：Skill 标识符
- **description**：何时触发、做什么。这是主要的触发机制——既要包含 skill 做什么，也要包含何时使用它的具体上下文。所有"何时使用"的信息都放在这里，而不是正文中。注意：目前 opencode 有一种"欠触发"的倾向——即在 skill 会有用时没有使用它们。为应对这一点，请让 skill description 稍微"强势"一点。例如，与其写"如何构建一个快速仪表板来显示内部数据"，不如写"如何构建一个快速仪表板来显示内部数据。当用户提到仪表板、数据可视化、内部指标，或者想要显示任何类型的公司数据时，即使他们没有明确要求'dashboard'，也要确保使用此 skill。"
- **compatibility**：所需的工具、依赖项（可选，很少需要）
- **skill 的其余部分 :)**

### Skill 编写指南

#### Skill 的构成

```
skill-name/
├── SKILL.md (必需)
│   ├── YAML frontmatter (name, description 必需)
│   └── Markdown 指令
└── 捆绑资源 (可选)
    ├── scripts/    - 用于确定性/重复性任务的可执行代码
    ├── references/ - 根据需要加载到上下文中的文档
    └── assets/     - 输出中使用的文件（模板、图标、字体）
```

#### 渐进式披露

Skill 使用三级加载系统：

1. **元数据** (name + description) — 始终在上下文中（约 100 词）
2. **SKILL.md 正文** — 当 skill 触发时始终在上下文中（理想情况下 < 500 行）
3. **捆绑资源** — 按需加载（无限制，脚本可以执行而不需要预先加载）

这些字数是近似值，如果需要，你可以自由地写得更长。

**关键模式：**

- 保持 SKILL.md 在 500 行以内；如果你接近这个限制，增加额外层次的层级结构，并明确指示使用该 skill 的模型下一步应该去哪里跟进。
- 在 SKILL.md 中清晰地引用文件，并附上何时读取它们的指导
- 对于大型参考文件（> 300 行），包含一个目录

**领域组织**：当一个 skill 支持多个领域/框架时，按变体组织：

```
cloud-deploy/
├── SKILL.md (工作流程 + 选择)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

opencode 只会读取相关的参考文件。

#### 无意外原则

Skill 不得包含恶意软件、利用代码或任何可能危害系统安全的内容。Skill 的内容如果按其描述来看，不应让用户感到意外。不要配合创建误导性 skill，或旨在促进未授权访问、数据外泄或其他恶意活动的 skill。不过，像"角色扮演 XYZ"这样的内容是可以的。

#### 编写模式

在指令中优先使用祈使语气。

**定义输出格式** - 你可以这样做：

```markdown
## 报告结构
始终使用此确切模板：
# [标题]
## 执行摘要
## 关键发现
## 建议
```

**示例模式** - 包含示例很有用。你可以像这样格式化它们（但如果示例中包含"Input"和"Output"，你可能需要稍作调整）：

```markdown
## 提交信息格式
**示例 1：**
输入：Added user authentication with JWT tokens
输出：feat(auth): implement JWT-based authentication
```

### 写作风格

尝试向模型解释为什么某些事情很重要，而不是使用生硬的 MUST。使用心智理论，努力让 skill 具有通用性，而不是过于狭窄地针对特定示例。先写草稿，然后用全新的眼光审视并改进它。

### 测试用例

编写完 skill 草稿后，提出 2-3 个真实的测试提示词——真实用户会说的那种话。与用户分享：[你不必使用完全相同的措辞]"这里有几个我想尝试的测试用例。这些看起来对吗，还是你想添加更多？"然后运行它们。

将测试用例保存到 `evals/evals.json`。先不要写 assertion——只写提示词。你将在下一步中，在运行进行的同时起草 assertion。

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

参见 `references/schemas.md` 获取完整 schema（包括 `assertions` 字段，你稍后会添加它）。

## 运行和评估测试用例

本节是一个连续的流程——不要中途停止。不要使用 `/skill-test` 或任何其他测试 skill。

将结果放在 `<skill-name>-workspace/` 中，作为 skill 目录的同级目录。在工作区内，按迭代组织结果（`iteration-1/`、`iteration-2/` 等），在每个迭代中，每个测试用例对应一个目录（`eval-0/`、`eval-1/` 等）。不要提前创建所有这些目录——边进行边创建。

### 第一步：在同一轮中启动所有运行（with-skill 和 baseline）

对于每个测试用例，在同一轮中启动两个 subagent——一个带 skill，一个不带。这很重要：不要先启动带 skill 的运行，然后再回来做 baseline。一次性启动所有任务，这样它们差不多同时完成。

**带 skill 运行：**

```
执行此任务：
- Skill 路径：<path-to-skill>
- 任务：<eval prompt>
- 输入文件：<eval files if any, or "none">
- 保存输出到：<workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- 要保存的输出：<用户关心的内容 — 例如 "the .docx file", "the final CSV">
```

**Baseline 运行**（相同的提示词，但 baseline 取决于上下文）：

- **创建新 skill**：不使用任何 skill。相同的提示词，没有 skill 路径，保存到 `without_skill/outputs/`。
- **改进已有 skill**：使用旧版本。在编辑之前，创建 skill 的快照（`cp -r <skill-path> <workspace>/skill-snapshot/`），然后将 baseline subagent 指向快照。保存到 `old_skill/outputs/`。

为每个测试用例编写一个 `eval_metadata.json`（assertion 暂时可以为空）。根据测试内容为每个 eval 起一个描述性名称——不仅仅是"eval-0"。目录也使用这个名称。如果此迭代使用了新的或修改过的 eval 提示词，请为每个新的 eval 目录创建这些文件——不要假设它们会从之前的迭代继承。

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### 第二步：在运行进行的同时，起草 assertion

不要只是等待运行完成——你可以有效地利用这段时间。为每个测试用例起草定量 assertion 并向用户解释它们。如果 `evals/evals.json` 中已经存在 assertion，请审查它们并解释它们检查什么。

好的 assertion 是可客观验证的，并且有描述性名称——它们应该在 benchmark viewer 中清晰可读，让浏览结果的人一眼就能理解每个 assertion 检查什么。主观性 skill（写作风格、设计质量）更适合定性评估——不要把 assertion 强加于需要人工判断的事情上。

起草后更新 `eval_metadata.json` 文件和 `evals/evals.json` 中的 assertion。同时向用户解释他们将在 viewer 中看到什么——包括定性输出和定量 benchmark。

### 第三步：随着运行完成，捕获计时数据

当每个 subagent 任务完成时，你会收到包含 `total_tokens` 和 `duration_ms` 的通知。立即将此数据保存到运行目录中的 `timing.json`：

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

这是捕获此数据的唯一机会——它通过任务通知传递，不会持久化到其他任何地方。在每个通知到达时处理它，而不是尝试批量处理。

### 第四步：评分、聚合和启动 viewer

当所有运行完成后：

1. **对每次运行评分** — 启动一个 grader subagent（或内联评分），读取 `agents/grader.md` 并针对输出评估每个 assertion。将结果保存到每个运行目录的 `grading.json` 中。grading.json 的 expectations 数组必须使用字段 `text`、`passed` 和 `evidence`（而不是 `name`/`met`/`details` 或其他变体）——viewer 依赖于这些确切的字段名。对于可以程序化检查的 assertion，编写并运行脚本而不是目测——脚本更快、更可靠，并且可以跨迭代复用。

2. **聚合到 benchmark** — 从 skill-creator 目录运行聚合脚本：

   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```

   这将生成 `benchmark.json` 和 `benchmark.md`，包含每种配置的 pass_rate、time 和 tokens，以及均值 ± 标准差和差值。每个 with_skill 版本放在其对应的 baseline 版本之前。

3. **进行分析** — 阅读 benchmark 数据，揭示聚合统计可能隐藏的模式。参见 `agents/analyzer.md`（"分析 Benchmark 结果"部分）了解需要关注的内容——比如无论是否有 skill 总是通过的 assertion（非区分性的）、高方差 eval（可能不稳定），以及时间/token 的权衡。

4. **启动 viewer**，同时展示定性输出和定量数据：

   ```bash
   nohup python <skill-creator-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```

   对于第 2 次及以后的迭代，还要传递 `--previous-workspace <workspace>/iteration-<N-1>`。

   **Cowork / 无显示环境：** 如果 `webbrowser.open()` 不可用或环境没有显示器，使用 `--static <output_path>` 编写一个独立的 HTML 文件，而不是启动服务器。当用户点击"Submit All Reviews"时，反馈将作为 `feedback.json` 文件下载。下载后，将 `feedback.json` 复制到工作区目录中，供下一次迭代使用。

注意：请使用 generate_review.py 创建 viewer；无需编写自定义 HTML。

1. **告诉用户**类似这样的话："我已将结果在您的浏览器中打开。有两个标签页——'Outputs' 让您可以逐个查看每个测试用例并留下反馈，'Benchmark' 显示定量比较。完成后回到这里告诉我。"

### 用户在 viewer 中看到的内容

"Outputs"标签页每次显示一个测试用例：

- **Prompt**：给出的任务
- **Output**：skill 生成的文件，尽可能内联渲染
- **Previous Output**（第 2 次及以上迭代）：折叠区域，显示上一次迭代的输出
- **Formal Grades**（如果运行了评分）：折叠区域，显示 assertion 的通过/失败
- **Feedback**：文本框，在用户输入时自动保存
- **Previous Feedback**（第 2 次及以上迭代）：用户上一次的评论，显示在文本框下方

"Benchmark"标签页显示统计摘要：每种配置的通过率、计时和 token 使用情况，以及每个 eval 的细分和分析师的观察。

导航通过上一个/下一个按钮或方向键进行。完成后，他们点击"Submit All Reviews"，将所有反馈保存到 `feedback.json`。

### 第五步：阅读反馈

当用户告诉你他们完成了，读取 `feedback.json`：

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."},
    {"run_id": "eval-1-with_skill", "feedback": "", "timestamp": "..."},
    {"run_id": "eval-2-with_skill", "feedback": "perfect, love this", "timestamp": "..."}
  ],
  "status": "complete"
}
```

空的 feedback 意味着用户认为没问题。将你的改进重点放在用户有具体意见的测试用例上。

完成后关闭 viewer 服务器：

```bash
kill $VIEWER_PID 2>/dev/null
```

---

## 改进 skill

这是循环的核心。你已经运行了测试用例，用户已经审查了结果，现在你需要根据他们的反馈来改进 skill。

### 如何思考改进

1. **从反馈中概括。** 这里的整体图景是，我们正在努力创建可以被跨许多不同提示词使用一百万次（可能字面意思，甚至更多，谁知道呢）的 skill。在这里，你和用户只反复迭代少数几个例子，因为这有助于加快速度。用户对这些例子了如指掌，他们可以快速评估新的输出。但如果你和用户共同开发的 skill 只对这些例子有效，那是没有用的。与其进行琐碎的过拟合更改或压迫性的 MUST，不如如果存在某个顽固问题，你可以尝试扩展思路，使用不同的隐喻，或推荐不同的工作模式。尝试的成本相对较低，也许你会找到很好的方案。

2. **保持提示词精简。** 删除那些没有发挥作用的冗余内容。确保阅读 transcript，而不仅仅是最终输出——如果看起来 skill 让模型浪费大量时间做无生产力的事情，你可以尝试删除 skill 中导致这种行为的部分，看看会发生什么。

3. **解释原因。** 努力解释你要求模型做的每件事背后的**原因**。今天的 LLM 非常*聪明*。它们有良好的心智理论，当给予良好的引导时，可以超越机械的指令并真正实现目标。即使来自用户的反馈很简洁或带有挫败感，也要努力真正理解任务、用户写下这些内容的原因以及他们实际写下的内容，然后将这种理解传递到指令中。如果你发现自己用全大写写 ALWAYS 或 NEVER，或者使用过于僵化的结构，那是一个黄旗——如果可能，重新组织并解释推理过程，让模型理解你要求的事情为什么重要。这是一种更人性化、更有力、更有效的方法。

4. **寻找跨测试用例的重复工作。** 阅读测试运行的 transcript，注意 subagent 是否都独立编写了类似的辅助脚本，或者对某些事情采取了相同的多步骤方法。如果所有 3 个测试用例都导致 subagent 编写了 `create_docx.py` 或 `build_chart.py`，这是一个强烈的信号，表明 skill 应该捆绑该脚本。编写一次，放入 `scripts/`，并告诉 skill 使用它。这样每次将来调用时就不必重新发明轮子了。

这个任务非常重要（我们正在努力创造每年数十亿的经济价值！），你的思考时间不是瓶颈；慢慢来，真正好好考虑。我建议先编写一个修订草稿，然后重新审视并加以改进。尽最大努力站在用户的立场上，理解他们想要和需要什么。

### 迭代循环

改进 skill 后：

1. 将你的改进应用到 skill 上
2. 将所有测试用例重新运行到新的 `iteration-<N+1>/` 目录中，包括 baseline 运行。如果你在创建新 skill，baseline 始终是 `without_skill`（无 skill）——这在各迭代中保持不变。如果你在改进已有 skill，请自行判断什么作为 baseline 最有意义：用户带来的原始版本，还是上一次迭代。
3. 使用指向上一次迭代的 `--previous-workspace` 启动 reviewer
4. 等待用户审查并告诉你他们完成了
5. 阅读新的反馈，再次改进，重复

持续进行直到：

- 用户表示满意
- 所有反馈都是空的（一切看起来都很好）
- 你没有取得有意义的进展

---

## 高级：盲测比较

对于需要对 skill 的两个版本进行更严格比较的情况（例如，用户问"新版本真的更好吗？"），有一个盲测比较系统。阅读 `agents/comparator.md` 和 `agents/analyzer.md` 了解详情。基本思路是：将两个输出给一个独立的 agent，不告诉它哪个是哪个，让它评判质量。然后分析胜出者为什么胜出。

这是可选的，需要 subagent，大多数用户不需要它。人工审查循环通常就足够了。

---

## Description 优化

SKILL.md frontmatter 中的 description 字段是确定 opencode 是否调用 skill 的主要机制。在创建或改进 skill 后，主动提供优化 description 以提高触发准确率的服务。

### 第一步：生成触发评估查询

创建 20 个评估查询——混合应该触发和不应触发的查询。保存为 JSON：

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

查询必须真实，是 opencode 用户实际会输入的内容。不是抽象请求，而是具体、详细且信息量充足的请求。例如，文件路径、关于用户工作或情况的个人背景、列名和值、公司名称、URL。一点点背景故事。有些可能是小写的，或包含缩写、拼写错误或口语化表达。使用不同的长度，并专注于边界情况，而不是让它们泾渭分明（用户会有机会批准的）。

不好的例子：`"Format this data"`、`"Extract text from PDF"`、`"Create a chart"`

好的例子：`"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

对于 **应该触发** 的查询（8-10 个），考虑覆盖率。你需要同一意图的不同措辞——有些正式，有些随意。包括用户没有明确说出 skill 或文件类型名称但显然需要它的情况。加入一些不常见的用例，以及此 skill 与另一个 skill 竞争但应该胜出的情况。

对于 **不应触发** 的查询（8-10 个），最有价值的是那些"擦肩而过"的查询——与 skill 共享关键词或概念但实际上需要不同东西的查询。考虑相邻领域、歧义措辞（单纯的 keyword 匹配会触发但不应触发），以及查询涉及 skill 能做某事但在另一个工具更合适的上下文中的情况。

关键要避免的是：不要让不应触发的查询明显不相关。"Write a fibonacci function"作为一个 PDF skill 的负例太容易了——它测试不了什么。负例应该真正具有挑战性。

### 第二步：与用户一起审查

使用 HTML 模板向用户展示评估集供审查：

1. 从 `assets/eval_review.html` 读取模板
2. 替换占位符：
   - `__EVAL_DATA_PLACEHOLDER__` → eval 项的 JSON 数组（周围没有引号——它是一个 JS 变量赋值）
   - `__SKILL_NAME_PLACEHOLDER__` → skill 的名称
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → skill 当前的 description
3. 写入临时文件（例如 `/tmp/eval_review_<skill-name>.html`）并打开它：`open /tmp/eval_review_<skill-name>.html`
4. 用户可以编辑查询、切换 should-trigger、添加/删除条目，然后点击"Export Eval Set"
5. 文件下载到 `~/Downloads/eval_set.json`——检查 Downloads 文件夹中最近版本，以防有多个版本（例如 `eval_set (1).json`）

这一步很重要——错误的评估查询会导致糟糕的 description。

### 第三步：运行优化循环

告诉用户："这需要一些时间——我将在后台运行优化循环并定期检查。"

将评估集保存到工作区，然后在后台运行：

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

使用系统提示词中的模型 ID（驱动当前会话的模型），这样触发测试与用户实际体验的模型一致。

在运行时，定期查看输出尾部，向用户更新当前迭代到哪一步了以及分数如何。

这会自动处理完整的优化循环。它将评估集分为 60% 训练集和 40% 保留测试集，评估当前 description（每个查询运行 3 次以获得可靠的触发率），然后调用 opencode 根据失败情况提出改进建议。它会在训练集和测试集上重新评估每个新的 description，最多迭代 5 次。完成后，它在浏览器中打开一个 HTML 报告，显示每次迭代的结果，并返回包含 `best_description` 的 JSON——通过测试分数而非训练分数选择，以避免过拟合。

### Skill 触发机制的工作原理

理解触发机制有助于设计更好的评估查询。Skill 出现在 opencode 的 `available_skills` 列表中，包含其 name 和 description，opencode 根据该 description 决定是否参考某个 skill。需要知道的重要事情是，opencode 只为它自己不容易处理的任务而去参考 skill——简单的、一步到位的查询如"read this PDF"可能不会触发 skill，即使 description 完全匹配，因为 opencode 可以使用基本工具直接处理它们。复杂的、多步骤的或专业化的查询在 description 匹配时会可靠地触发 skill。

这意味着你的评估查询应该足够充实，让 opencode 实际上能够从参考 skill 中受益。像"read file X"这样的简单查询是糟糕的测试用例——无论 description 质量如何，它们都不会触发 skill。

### 第四步：应用结果

从 JSON 输出中取 `best_description`，更新 skill 的 SKILL.md frontmatter。向用户展示修改前后对比，并报告分数。

---

### 打包和呈现（仅在 `present_files` 工具可用时）

检查你是否可以访问 `present_files` 工具。如果没有，跳过此步骤。如果有，打包 skill 并向用户呈现 .skill 文件：

```bash
python -m scripts.package_skill <path/to/skill-folder>
```

打包后，将生成的 `.skill` 文件路径告知用户，以便他们安装。

---

## 当 subagent 不可用时

当 subagent 不可用时，核心工作流程相同（起草 → 测试 → 审查 → 改进 → 重复），但某些机制有所改变。以下是需要调整的内容：

**运行测试用例**：没有 subagent 意味着无法并行执行。对于每个测试用例，读取 skill 的 SKILL.md，然后按照其指令自行完成测试提示词。一个一个地进行。这不如独立的 subagent 严谨（你编写了 skill，又由你来运行，所以你有完整的上下文），但它是一个有用的合理性检查——而且人工审查步骤可以弥补。跳过 baseline 运行——只需使用 skill 按要求完成任务。

**审查结果**：如果你无法打开浏览器（例如，VM 没有显示器，或者你在远程服务器上），完全跳过浏览器 reviewer。相反，直接在对话中呈现结果。对于每个测试用例，显示提示词和输出。如果输出是用户需要查看的文件（如 .docx 或 .xlsx），将其保存到文件系统并告诉用户位置，以便他们可以下载并查看。内联请求反馈："这些看起来怎么样？有什么要改的吗？"

**Benchmarking**：跳过定量 benchmarking——它依赖于 baseline 比较，而没有 subagent 就没有意义。专注于来自用户的定性反馈。

**迭代循环**：和之前一样——改进 skill，重新运行测试用例，请求反馈——只是中间没有浏览器 reviewer。如果你有文件系统，仍然可以将结果组织成迭代目录。

**Description 优化**：本节需要 `opencode` CLI 工具（具体来说是 `opencode run`）。如果你没有 CLI 访问权限，请跳过。

**盲测比较**：需要 subagent。跳过它。

**打包**：`package_skill.py` 脚本可以在任何有 Python 和文件系统的地方运行。在任何平台上，你都可以运行它，用户可以下载生成的 `.skill` 文件。

**更新已有 skill**：用户可能在要求你更新已有 skill，而不是创建新的。在这种情况下：

- **保留原始名称。** 注意 skill 的目录名和 `name` frontmatter 字段——保持不变地使用它们。例如，如果安装的 skill 是 `research-helper`，输出 `research-helper.skill`（而不是 `research-helper-v2`）。
- **在编辑前复制到可写位置。** 已安装 skill 的路径可能是只读的。复制到 `/tmp/skill-name/`，在那里编辑，然后从副本打包。
- **如果手动打包，先在 `/tmp/` 中暂存**，然后复制到输出目录——直接写入可能会由于权限问题而失败。

---

## Cowork 特有的说明

如果你在 Cowork 中，主要需要知道的是：

- 你有 subagent，所以主要工作流程（并行启动测试用例、运行 baseline、评分等）都可用。（但是，如果你遇到严重的超时问题，连续而不是并行运行测试提示词也是可以的。）
- 你没有浏览器或显示器，所以在生成 eval viewer 时，使用 `--static <output_path>` 编写一个独立的 HTML 文件，而不是启动服务器。然后提供一个用户点击后可以在他们浏览器中打开 HTML 的链接。
- 不知为何，Cowork 环境似乎使 opencode 不太愿意在运行测试后生成 eval viewer，所以重申一下：无论你在 Cowork 还是在 opencode 中，在运行测试之后，你都应该先使用 `generate_review.py` 生成 eval viewer 让人查看示例，然后再自己修改 skill 并尝试进行修正（而不是编写你自己的定制 HTML 代码）。先说声抱歉，但我这里要用全大写：在你自己评估输入之前**先生成 EVAL VIEWER**。你想尽快把它们放到人眼前！
- 反馈的工作方式不同：由于没有运行中的服务器，viewer 的"Submit All Reviews"按钮会将 `feedback.json` 作为文件下载。然后你可以从那里读取它（你可能需要先请求访问权限）。
- 打包功能可用——`package_skill.py` 只需要 Python 和文件系统。
- Description 优化（`run_loop.py` / `run_eval.py`）在 Cowork 中应该也能正常工作，因为它通过子进程使用 `opencode run`，而不是浏览器，但请等到你完全完成 skill 制作并且用户认为状态良好后再进行。
- **更新已有 skill**：用户可能在要求你更新已有 skill，而不是创建新的。请遵循上面"当 subagent 不可用时"部分的更新指南。

---

## 参考文件

`agents/` 目录包含针对 specialized subagent 的指令。当你需要启动相关 subagent 时阅读它们。

- `agents/grader.md` — 如何评估针对输出的 assertion
- `agents/comparator.md` — 如何进行两个输出的盲测 A/B 比较
- `agents/analyzer.md` — 如何分析一个版本为何优于另一个版本

`references/` 目录有额外的文档：

- `references/schemas.md` — evals.json、grading.json 等的 JSON 结构

---

再次强调核心循环：

- 确定 skill 是关于什么的
- 起草或编辑 skill
- 在测试提示词上运行具有 skill 访问权限的 opencode
- 与用户一起评估输出：
  - 创建 benchmark.json 并运行 `eval-viewer/generate_review.py` 帮助用户审查
  - 运行定量评估
- 重复直到你和用户都满意
- 打包最终 skill 并返回给用户。

请将步骤添加到你的 TodoList（如果你有的话），以确保不会忘记。如果你在 Cowork 中，请特别将"创建 evals JSON 并运行 `eval-viewer/generate_review.py` 以便人工审查测试用例"添加到你的 TodoList 中，确保完成。
