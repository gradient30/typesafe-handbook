# System One

> System One 模型为软件做快速、结构化决策。Jev 是 TypeSafe 的旗舰模型，也是第一款 System One 模型。

System One 模型是一类 AI 模型：为软件直接可用的快速、结构化决策而建。它评估一份 [state](/concepts/state)，返回类型化答案和概率。

Jev 是 TypeSafe 的旗舰模型，也是第一款 System One 模型。

和 LLM 一样，System One 模型能理解自然语言输入。它返回的是类型化决策和概率，而不是生成文本。

> Jev 目前只接受文本输入。它评估字符串、JSON 对象和文本数组。图片、音频、视频还不支持。

## 和 LLM 有何不同

System One 模型为校准决策而训练：概率对着真实结果优化，用来反映不确定性。校准是在一组预测上度量的，并不保证某一次答案正确。

System One 模型不写回复、不写代码、也不生成对自己推理过程的解释。可能的答案由你通过 [原语](/primitives) 定义：

| 原语 | 问题 | 示例答案空间 | 示例输出 |
| --- | --- | --- | --- |
| [Choice](/primitives/choice) | 这张工单该哪个团队处理？ | `billing`、`technical` 或 `account` | `choice: "billing"` |
| [Score](/primitives/score) | 这位客户有多沮丧？ | 0 = 平静，1 = 沮丧，2 = 非常沮丧 | `score: 1.4` |
| [Noul](/primitives/noul) | 这条消息是在要求退款吗？ | 真或假 | `noul: 0.95` |

表里是示意配置和取值。各原语页写清了可用配置和完整响应字段。

System One 模型怎么工作、怎么训练，见 [AI 入门](/introduction/machine-learning-primer)。

> System One 这个名字来自丹尼尔·卡尼曼在《思考，快与慢》里普及的概念。System 1 思考快、凭直觉；System 2 更慢、更审慎。这里强调的是快速、聚焦的判断。

## 大流程里的快判断

处理退款请求时，应用可以：

1. 组一份 state：客户消息、相关交易、退款政策。
2. 一次问多个彼此独立的问题：是否提出了退款、证据是否指向重复扣款、政策是否支持退款。
3. 在代码里用确定性检查把答案合起来，再把案件路由到执行或复核。

熟悉原语之后，就可以把它们接到更大的系统里。System One 模型返回的是类型化、受约束的输出，而不是自由文本，所以代码能检查、组合这些答案，做成可预期的工作流。完整流程见 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

System One 模型的答案还带 [confidence](/confidence)，用来决定何时自动执行、何时升级给人或推理模型。

## 调用 System One 模型

通过 [客户端 SDK](/sdk)，或 [HTTP API](/api) 的 `POST /v1/systemone`。`model` 字段指定处理这次请求的模型。文档示例用 `jev-latest`，这也是 SDK 的默认值。可用模型、价格和别名见 [模型](/models)。

接下来：用 [State](/concepts/state) 准备输入，用 [原语（问题）](/primitives) 看能问哪几类问题。
