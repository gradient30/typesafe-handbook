# HTTP API

> TypeSafe 评估端点的完整 HTTP API：请求 / 响应形状、鉴权与限流。

用一份 `state` 对照一组类型化 `questions` 做评估，拿回结构化 `answers`，每个问题一条。导读从 [原语](/primitives) 开始。

## 评估端点

```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

在 [控制台](https://console.typesafe.ai/) 创建 API key。鉴权失败返回 `401 Unauthorized`。

## 请求体

每次请求的顶层形状。`questions` 映射里的每一项都是你命名的类型化问题。

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `state` | 是 | 要评估的内容。纯文本用字符串；聊天记录、业务记录、应用当前状态等用对象 / 数组。格式与实践见 [State](/concepts/state)。 |
| `model` | 否 | 处理这次请求的模型。用 `"jev-latest"`，TypeSafe 的旗舰模型。可用模型与别名见 [模型](/models)。 |
| `questions` | 是 | 类型化 [Question](#question-types) 对象的映射。键由你选；答案用同样的键返回。 |

`questions` 的每个键是你选的 id。对应的 [Answer](#answer-types) 用同一个 id 返回。这个键**不会**发给底层模型，也不参与推理。

```json
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "Does this convey urgency?"
    }
  }
}
```

## 问题类型 {#question-types}

`Question` 由 `type` 字段决定，共三种。三种都有 `type` 和 `instructions`；各自再带自己的 `criteria`。

`instructions` 可以是字符串、对象或数组。很长、还要带额外上下文或需要引用的数据时，可以拆成结构化对象：问题放一个字段，数据放其余字段，用反引号按名字引用数据字段——和指向嵌套 `state` 值的写法一样：

```json
"instructions": {
  "potential_duplicate": {
    "name": "John Smith",
    "location": "Oakland, California",
    "last_employer": "Google"
  },
  "question": "Is the resume for the same person as `potential_duplicate`?"
}
```

更多见 [在问题里用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。

### Noul

是/否问题。返回答案为 yes 的概率。

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `type` | 是 | `"noul"` |
| `instructions` | 是 | 要评估的是/否问题。对象可以把问题放一个字段、把引用的数据放其余字段；见 [在问题里用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。 |
| `criteria` | 否 | 对 yes 和 no 含义的可选描述。`true`：靠近 1 表示什么；`false`：靠近 0 表示什么。 |

```json
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "Does this convey urgency?",
      "criteria": {
        "true": "Explicitly time-sensitive",
        "false": "No urgency expressed"
      }
    }
  }
}
```

### Choice

从你定义的集合里选一项。返回所选选项和完整概率分布。

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `type` | 是 | `"choice"` |
| `instructions` | 是 | 模型要决定什么。对象可以把问题放一个字段、把引用的数据放其余字段；见 [结构化 instructions 与 criteria](/primitives/choice#structured-instructions-and-criteria)。 |
| `criteria` | 是 | 选项 → 量表描述的映射；不需要额外说明时用 `null`。每个 Choice 最多 255 个选项。键由你选，值是这个选项的描述。 |

```json
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "Payments, invoicing, refunds",
        "technical": "Bugs, outages, integrations",
        "sales": "Pricing, upgrades, new accounts"
      }
    }
  }
}
```

### Score

按你定义的量表给 state 打分。返回跨各等级的概率加权值。

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `type` | 是 | `"score"` |
| `instructions` | 是 | 模型要评什么。对象可以把问题放一个字段、把引用的数据放其余字段；见 [在问题里用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。 |
| `criteria` | 是 | 等级描述的有序数组。Score 至少两个等级；API 最多接受 10 个。 |

```json
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "frustration": {
      "type": "score",
      "instructions": "How frustrated is the customer?",
      "criteria": ["Calm", "Frustrated", "Very angry"]
    }
  }
}
```

## 响应体

每个问题一条答案，用你提供的同一个 id 返回。

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `model` | 是 | 实际做评估的模型（版本化 ID，例如 `jev-1.13.0`）。 |
| `answers` | 是 | 每个问题一条 [Answer](#answer-types)，键与 `questions` 里的 id 相同。 |
| `usage` | 否 | 这次请求的 token 用量：`input_tokens`、`output_tokens`。 |

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "is_urgent": {
      "type": "noul",
      "noul": 0.95
    }
  },
  "usage": { "input_tokens": 296, "output_tokens": 20 }
}
```

## 答案类型 {#answer-types}

每条答案的 `type` 与对应问题一致。Choice 和 Score 答案还带 0 到 1 的 `confidence`，从该答案的概率分布得出。见 [Confidence](/confidence)。

### Noul 答案

是/否答案，尺度从 0（no）到 1（yes）。

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "is_urgent": {
      "type": "noul",
      "noul": 0.95
    }
  },
  "usage": { "input_tokens": 307, "output_tokens": 20 }
}
```

### Choice 答案

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `type` | 是 | `"choice"` |
| `choice` | 是 | 概率最高的选项。 |
| `probabilities` | 是 | 每个选项映射到它的概率（浮点数，和为 1）。键是你在 `criteria` 里定义的选项。 |
| `confidence` | 是 | 模型有多确定，从概率得出。 |

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "billing",
      "probabilities": { "billing": 0.88, "technical": 0.12, "sales": 0.0 },
      "confidence": 0.81
    }
  },
  "usage": { "input_tokens": 318, "output_tokens": 34 }
}
```

### Score 答案

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `type` | 是 | `"score"` |
| `score` | 是 | 跨各等级的概率加权答案；可以落在等级之间。 |
| `legend` | 是 | 每个等级序号映射回它的描述。 |
| `probabilities` | 是 | 每个等级（字符串键，与 `legend` 对应）映射到它的概率（浮点数，和为 1）。 |
| `confidence` | 是 | 模型有多确定，从概率得出。 |

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "frustration": {
      "type": "score",
      "score": 1.05,
      "legend": { "0": "Calm", "1": "Frustrated", "2": "Very angry" },
      "probabilities": { "0": 0.0, "1": 0.95, "2": 0.05 },
      "confidence": 0.92
    }
  },
  "usage": { "input_tokens": 304, "output_tokens": 18 }
}
```

## 错误

错误使用标准 HTTP 状态码，JSON body 说明出了什么问题。

| 状态 | 含义 |
| --- | --- |
| `401 Unauthorized` | 缺少或无效的 API key。检查 `Authorization` 头。 |
| `422 Unprocessable Entity` | 请求体校验失败——例如缺必填字段，或问题格式不对。body 会指出出错字段。 |
| `429 Too Many Requests` | 超出限流。退避后重试。 |
| `529 Overloaded` | TypeSafe 暂时过载。稍后再试。 |

### 处理限流 {#handling-rate-limits}

收到 `429 Too Many Requests` 或 `529 Overloaded` 时，用指数退避重试，不要立刻再打。客户端 SDK 默认会处理，使用 SDK 且保持默认重试策略时不必额外写逻辑。
