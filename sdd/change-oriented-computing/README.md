# change-oriented-computing

## 演化流程和一等对象

```text
              Human Intent + Constraints
                        │
                        ▼
State₀ ──────────────► Change
                        │ 可读投影
                        ▼
                  Artifact Graph
               proposal / spec /
                 plan / tasks
                        │
                  Human Approval
                        │
                        ▼
                     Actions
                        │
                        ▼
                     State₁
                        ▲
                        │ verifies
                     Evidence
```

## 分工

| 环节 | 人的参与 | 原因 |
| --------------------- | --------------- | ----------------------------------------------- |
| **State** | △ 必要时纠正/补充 | State 应尽量由系统自动感知和维护，人不应手工维护全部状态 |
| **Intent to Change** | **✓ 核心参与** | “为什么要变、希望变成什么”属于价值判断 |
| **Artifact Graph** | **✓ 审核，而非手工编写** | AI 应负责展开 proposal/spec/plan/tasks，人负责检查方向、约束和风险 |
| **Action / Apply** | △ 通常不参与 | 已授权后应自动执行；高风险、不可逆动作可以设置额外 gate |
| **Evidence** | ✗ 通常不参与 | 测试、日志、diff、指标、观测结果应自动产生 |
| **State′ Acceptance** | △ 按风险参与 | 客观验证可自动接受；涉及主观价值、业务判断、重大影响时由人确认 |

- **Intent**: 人的输入.
- **Change**: 系统结合`State`对Intent进行解释形成的正式对象.

## Artifact

| Artifact     | 核心问题          |
| ------------ | ------------- |
| **Proposal** | **为什么改**      |
| **Spec**     | **State₁ 蓝图** |
| Design   | 怎么实现变化    |
| Tasks    | 具体执行步骤    |

其中最适合人类审核的是 **Proposal + Spec**。Artifact 是实际上是Change的**可读投影**, 所以实际审核经常在Artifact之后.

## 延伸：人机认知协作闭环

见 [cognitive-loop.md](./cognitive-loop.md)。COC 管**外部状态演化闭环**（变更如何被验证地推进），认知协作闭环管**研究者内部认知正反馈**（AI 扩展探索范围、人通过选择性理解关键思想而成长），两环相扣才是完整的人机协作。认知闭环在 `knowledge/`（`CON-/PRF-/RES-`）知识库中的落地映射（`VERIFY` 数值验证 + `note/VER-*/`、`[AI]` 理解标记等）见 [cognitive-loop.md](./cognitive-loop.md) 的「落地映射」一节。
