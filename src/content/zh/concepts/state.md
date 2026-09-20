# State

> 什么是 state、怎么组织它，以及如何给 System One 模型足够的上下文。

**State** 是你让 System One 模型评估的内容。可以是一条客服消息、一段文本，或应用此刻的状态。它放在 API 请求的 `state` 字段里，和你要问的问题一起发出。

每次请求用一份 state 对照一个或多个问题。所有问题看到的是同一份 state，并且彼此独立评估。一次请求里可以混用 [Choice](/primitives/choice)、[Score](/primitives/score) 和 [Noul](/primitives/noul)。

## State 可以是字符串，也可以是结构化 JSON

最简单的 state 是一段纯文本：

```python
state = "My card was charged twice."
```

State 也可以是 JSON 对象或数组，里面放相关上下文、示例，以及其他能帮模型回答所附问题的信息。把它想成：在请一组专家做判断之前，你会摊到他们面前的材料。在 Python 里，把对应的字符串、字典或列表直接传给 `client.system_one(state=...)`。

| 格式 | 适合 | 示例 |
| --- | --- | --- |
| 字符串 | 一条消息、一篇文章、一段文字 | `"My card was charged twice."` |
| 对象 | 具名字段、相关记录、应用状态 | `{"message": "My card was charged twice.", "order_id": "A-104"}` |
| 数组 | 一串消息或记录 | `["Hi", "My customer number is TS1337.", "My card was charged twice."]` |

多数请求用对象：state 的每一部分都有描述性的名字，彼此关系也清楚。用例简单、只需一段文本时，用字符串就够。

> Jev 只接受文本。State 必须是字符串、JSON 对象，或文本值组成的数组。图片、音频、视频还不支持。Jev 的主训练语言是英语；其他语言（包括中日韩文字）可以接受，但目前准确率更低——见 [模型](/models#language-support)。

```json
{
  "ticket": {
    "subject": "Duplicate charge",
    "messages": [
      {"from": "customer", "text": "I was charged twice for order A-104. Please refund the duplicate."},
      {"from": "support", "text": "We are checking the charges."}
    ]
  },
  "order": {
    "id": "A-104",
    "charges": [
      {"amount_usd": 49, "status": "captured"},
      {"amount_usd": 49, "status": "captured"}
    ]
  },
  "refund_policy": "Duplicate charges are eligible for a refund."
}
```

这整个对象是一份 state，哪怕里面同时有对话、订单和政策。做决策需要对照这几部分时，就把相关信息放在一起。

## 把内容和问题分开

State 里放内容和支撑事实。[问题](/primitives) 定义模型要对这份材料做的判断。例如：退款请求和政策放进 state，再分别问客户是否要求退款、政策是否支持。

`instructions`、`criteria`、问题类型，以及针对同一份 state 一次问多个问题，见 [原语（问题）](/primitives)。

请求 schema 见 [API 参考](/api)；安装、类型化输入和响应处理见 [客户端 SDK](/sdk)。
