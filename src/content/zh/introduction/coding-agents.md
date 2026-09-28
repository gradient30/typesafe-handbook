# Jev 与编码智能体

> 用编码智能体时，Jev 是什么、不是什么。

如果你是在给编码智能体找一个可替换的模型时发现 TypeSafe，从这里开始。Jev **不是** Claude Code、Cursor、opencode、Copilot、Muse Spark、Grok Bot 或同类工具背后那颗 LLM 的即插即用替代品。你可以照常用编码智能体写代码，再让这些代码调用 Jev 做决策。

## Jev 不是聊天模型，也不是代码补全模型

Jev 是 [System One 模型](/concepts/system-one)。它不生成文本、不写代码、不维持对话。它接收一份 [state](/concepts/state) 和一组类型化的 [问题](/primitives)，返回代码可以直接使用的结构化答案：

* 从选项列表里选出的 `choice`，以及每个选项的概率。
* 按你定义的量表给出的 `score`。
* 对一句真/假陈述给出的 `noul`（0–1）。

编码智能体依赖的是会流式输出文本、调用工具、按自然语言指令改文件的 LLM。Jev 一件都不做。不存在 `model: "jev-latest"` 这种设置，能把编码智能体变成「由 Jev 驱动的智能体」——两套系统解决的是不同问题。

## 你大概真正想要的

对照你原本想做的事，选对应的一行：

| 你想… | 这样做 |
| --- | --- |
| 让编码智能体更会写*调用 TypeSafe 的代码* | 安装 [TypeSafe agent skill](/agent-skill)。它给 Claude Code、Codex 和其他智能体补上 Jev API、[原语](/primitives) 和 [模式](/patterns) 的完整上下文，以便生成正确的 TypeSafe 集成。 |
| 在你正在做的应用或智能体里用 Jev——路由、分类、打分、护栏，或任何结构化决策 | 从 [快速开始](/introduction/quickstart) 入手，再读 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one) 和 [模式](/patterns)，例如 [置信度门控路由](/patterns/confidence-routing) 和 [意图路由](/patterns/intent-routing)。 |
| 替换或换掉驱动编码智能体的那颗模型 | Jev 不是这个用途的工具。继续用基于 LLM 的编码智能体；只在产品需要快速、校准过的结构化决策时，单独使用 Jev。 |
| 写代码之前先试 Jev | 打开 [Playground](https://console.typesafe.ai/playground)，把一段文本贴进 state，再加几个问题。步骤见 [快速开始](/introduction/quickstart)。 |

## 什么时候值得用 Jev

Jev 虽然不是编码智能体的 LLM，却常常正好是你用编码智能体在做的应用或智能体*内部*该用的工具。代码需要下面这些事时，就该找 Jev：

* 把请求路由到一组固定目的地之一，并且知道这次路由有多自信。
* 按量表给某件事打分（紧急度、质量、风险），再按数字分支。
* 在采取动作之前，判断一句话对某份文档、消息或记录是否为真。
* 用一次按构造返回类型化取值的调用，替换脆弱的「请返回 JSON」提示词。

如果这和你在做的事对得上，最快的入口是 [快速开始](/introduction/quickstart)，然后看 [原语](/primitives) 里各问题类型的参考。

## 下一步

* [System One](/concepts/system-one) — System One 模型是什么，以及它和 LLM 的差别。
* [快速开始](/introduction/quickstart) — 在 Playground、HTTP 或 Python SDK 里试 Jev。
* [Agent Skill](/agent-skill) — 给编码智能体补上 TypeSafe API 的上下文。
* [模式](/patterns) — 用 TypeSafe 搭建系统的常见架构。
