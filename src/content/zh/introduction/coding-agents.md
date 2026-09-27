# Jev 与编码代理

> 在使用编码代理时，Jev 是什么（以及不是什么）。

如果你是在寻找可直接接入编码代理的模型时发现 TypeSafe 的，从这里开始。Jev **不是** Claude Code、Cursor、opencode、Copilot、Muse Spark、Grok Bot 等工具背后的 LLM 的即插即用替代品。相反，你可以照常使用编码代理来编写调用 Jev 做决策的代码。

## Jev 不是聊天或代码补全 LLM

Jev 是 [System One 模型](/concepts/system-one)。它不生成文本、不写代码、也不进行对话。它接收 [state](/concepts/state) 和一组类型化 [问题](/primitives)，并返回你的代码可直接使用的结构化答案：

* 从选项列表中选出的 `choice`，带每个选项的概率。
* 你定义的量表上的 `score`。
* 针对真/假陈述的 `noul`（0–1）。

编码代理依赖能流式输出文本、调用工具、并根据自然语言指令编辑文件的 LLM。Jev 不做这些。不存在 `model: "jev-latest"` 这种设置能把你的编码代理变成 Jev 驱动的代理，因为两者解决的是不同问题。

## 你真正想要的可能是

选择与你目标匹配的一行：

| 你想…… | 这样做 |
| --- | --- |
| 让编码代理更擅长 *写出使用 TypeSafe 的代码* | 安装 [TypeSafe agent skill](/agent-skill)。它为 Claude Code、Codex 等代理提供 Jev API、[原语](/primitives) 与 [模式](/patterns) 的完整上下文，以便生成正确的 TypeSafe 集成。 |
| 在你正在构建的应用或代理内部使用 Jev——用于路由、分类、打分、护栏或任何结构化决策 | 从 [快速开始](/introduction/quickstart) 入手，然后阅读 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one) 以及 [模式](/patterns)，了解 [置信度路由](/patterns/confidence-routing) 和 [意图路由](/patterns/intent-routing) 等常见架构。 |
| 替换或切换编码代理背后的模型 | Jev 不适合这个用途。继续使用基于 LLM 的编码代理，并在产品需要快速、校准、结构化决策的地方单独使用 Jev。 |
| 在写任何代码之前先试用 Jev | 打开 [Playground](https://console.typesafe.ai/playground)，把一些文本粘贴为 state，再加几个问题。详见 [快速开始](/introduction/quickstart) 的走查。 |

## 什么时候值得用 Jev

尽管 Jev 不是编码代理 LLM，它常常正是你用编码代理构建的代理或应用 *内部* 的正确工具。当你的代码需要时，就用 Jev：

* 把请求路由到固定目的地之一，并知道该路由有多自信。
* 按量表（紧急度、质量、风险）打分并据此分支。
* 在采取行动前，检查某陈述对文档、消息或记录是否为真。
* 用返回类型化值的调用，替换让 LLM「返回 JSON」的脆弱提示。

如果以上任一匹配你正在构建的东西，最快的入口是 [快速开始](/introduction/quickstart)，然后查阅 [原语](/primitives) 参考了解问题类型。

## 下一步

* [System One](/concepts/system-one) — System One 模型是什么，以及它与 LLM 的区别。
* [快速开始](/introduction/quickstart) — 在 Playground、HTTP 或 Python SDK 中试用 Jev。
* [Agent skill](/agent-skill) — 为你的编码代理提供 TypeSafe API 上下文。
* [模式](/patterns) — 用 TypeSafe 构建的常见架构。
