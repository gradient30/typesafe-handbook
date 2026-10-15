# Introduction

> Jev 是 TypeSafe 的旗舰模型，也是第一个 System One 模型。发送状态和类型化问题；获取代码可直接使用的结构化答案。

大型语言模型 (LLMs) 设计为产生供人类阅读的文本。当你需要模型做出代码将消费的判断时，这会产生不匹配：你正在强迫文本生成系统输出结构化决策，然后将结果解析回代码可以依赖的东西。

Jev 是 TypeSafe 的旗舰模型，也是第一个 [System One 模型](/concepts/system-one)。System One 模型被构建为做出软件可直接使用的快速、结构化决策。Jev 针对 *state* 评估类型化 *questions* 并直接返回结构化结果。无文本生成，无解析。你获得代码可以分支、排序和路由的类型化值和概率分布。一些问题类型还返回 [confidence](/confidence)，代码可以用它决定是否以及如何对答案行动。每个问题类型的页面列出其答案包含什么。

## TypeSafe primitives

TypeSafe 暴露 *AI primitives*。类似于软件原语，我们的 AI 原语是模块化、可组合、结构化、可靠和快速的。每个询问不同类型的 *question* 并返回不同类型的答案。

| 问题类型 | 目标 | 返回 |
| - | - | - |
| [Choice](/primitives/choice) | 从列表中选择一个选项 | `choice`, `probabilities`, `confidence` |
| [Score](/primitives/score) | 在量表上评分状态 | `score`, `probabilities`, `confidence` |
| [Noul](/primitives/noul) | 这个陈述是真的吗？ | `noul` (0–1) |

任何混合的 *question* 类型都可以在单个 API 调用中。每个 *question* 并行且隔离地针对相同 *state* 评估。添加问题几乎不改变响应时间。每个问题独立评估，因此添加更多问题不会造成上下文腐烂。

## 原子问题，在代码中组合

System One 模型在每个问题询问一个特定、范围良好的事物时工作最佳。将每个问题视为直觉检查确定：给定正确上下文，一个高度知识渊博的人可以在几秒钟内做出的判断类型。

如果你想询问的问题需要扩展推理或权衡多个独立因素，分解它。将每个因素作为单独问题询问，然后用代码中的逻辑组合结果。这保持每个单独评估可靠，并给你对维度如何加权的完全控制。

例如，不要 "rate this startup pitch"，而是分别询问市场规模、技术可行性和差异化。用你自己的公式组合分数。当优先级改变时，在代码中改变系数而不是重写提示。

## 下一步

* [Quick Start](/introduction/quickstart) — 立即开始所需的一切。
* [AI Primer](/introduction/machine-learning-primer) — 为什么 TypeSafe 为校准决策而不是生成文本训练模型。
* [Primitives (Questions)](/primitives) — 如何定义问题、选择问题类型，以及一次询问几个。
* [Confidence](/confidence) — TypeSafe 如何报告确定性，以及如何在架构上使用它。
* [Patterns](/patterns) — 用 TypeSafe 构建系统的常见模式。
