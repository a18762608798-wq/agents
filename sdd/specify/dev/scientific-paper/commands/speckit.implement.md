---
description: 执行论文写作、编译，并衔接 post-implement review skills。
---

# Implement

## Workflow

1. 读取当前 feature 的：
   - `spec.md`
   - `plan.md`
   - `tasks.md`

2. 读取项目 live constitution，并遵守其中全部约束。

3. 按 `tasks.md` 先后执行 Assemble → Write → Cite → Format。
   - `paper-assembly`：核对上游产物，输出缺件表。
   - `paper-writing-section`：逐节写作；Related Work 使用其专门模式，
     `GAP-DATA` 处留 `[TODO(GAP-###): 待 D##]`，`GAP-INTERP` 处用 clarify
     要到的用户推测写 `[推测(user, 待 D## 验证)]`。
   - `paper-figure-layout`：按 `FIG-###` 组图进文（不管作图）。
   - `paper-zotero-hunter`：harvest / verify / bind，引用逐条落实。
   - `paper-latex-formatting`：套 venue 模板 + 投前检查。
   - 完成任务后及时更新 `tasks.md` 中对应的完成状态。

4. 如果写作过程中发现以下情况：
   - spec 缺少必要主张定义或证据绑定；
   - plan 与 spec 冲突；
   - 必须改变主张口径、证据指向或引用要求；
   不要自行猜测。回到相应的 spec / plan 修正后，再继续写作。

5. Format 完成后，agent 直接编译（`latexmk`，引用/缺图预检顺手做掉），
   不经过 skill。编译属于 Implement 的验证步骤，不是单独的 Spec Kit 命令。

6. 完成 tasks 中 Assemble → Write → Cite → Format 和 Implement 后编译任务后，停止
   `/speckit.implement` 命令并报告状态。
   - 后续的 `paper-self-review` 和 `paper-revision` 是 post-implement skills，不是
     Spec Kit 命令，也不存在独立的 `/speckit.review`。
   - agent 在 Implement 完成后按 tasks 调用 `paper-self-review`；若发现可修复问题，
     调用 `paper-revision`，直接重新运行 `latexmk`，再调用 self-review 复评。
   - 这些操作由 tasks 驱动，完成后再运行 `/speckit.converge` 审计是否收敛。

7. 不得通过以下方式使评审“通过”：
   - 删除或弱化审稿意见；
   - 编造数据迎合意见；
   - 把推测改写成事实语气；
   - 降低 spec 已定义的验收标准。

8. 当以下条件全部满足时，本 feature 写作成文：
   - 写作任务已完成；
    - Implement 任务完成，编译通过且引用预检完成；
    - tasks 中适用于 Implement 阶段的验收已完成；
     - post-implement review、revision 和 converge 条件由对应 skill/命令继续处理，
       不在 Implement 中提前宣称 feature 收敛。

## 执行原则

写作、编译、评审、改文过程应保持连续。
只在以下情况停止：
- 缺少无法可靠推断且会影响主张的必要信息（问用户）；
- 需要用户提供不存在的外部输入（如解释推测、引用方向）；
- spec / plan 存在无法在写作层解决的冲突。

除此之外，不要在中间阶段请求确认。

## 完成

完成后简要报告：
- 写作状态（各 `SEC` 和 Implement tasks 完成情况）
- 编译状态及引用/缺图预检
- 尚待 post-implement review skills、revision 或 Converge 的任务
- 缺件状态（剩余 `GAP-DATA` / 未转正推测）
- 是否存在未完成的非阻塞 Follow-up
