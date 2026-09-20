# 如何用 TypeSafe 构建

> 代码掌控流程，把 System One 插在需要窄、结构化决策的地方，做成带 AI 的软件。

System One 是 TypeSafe 用来做 **AI 驱动软件** 的模型，不是智能体。它不生成代码，也不自己选下一步。它提供嵌进软件的 AI 原语：控制流仍归代码，模型只对非结构化数据做常识判断。

> **一句话：** 先搭普通软件工作流，只在需要 AI 的地方插入 System One。
>
> * 控制流、确定性规则和副作用留在代码里。
> * 把宽判断拆成窄的、类型化的问题，instructions 和 criteria 写清楚。
> * 每个问题只给它需要的上下文。
> * 用概率和置信度决定执行、复核或升级。
> * 彼此独立的问题一起问，答案在代码里组合。

## 三种软件架构

TypeSafe 面向 **AI 驱动软件**：工作流归代码，AI 负责窄的、结构化的决策。

### 传统软件

传统代码是用简单软件原语搭起来的复杂决策树。每个原语都可靠，开发者才能把它们组成更高层的抽象。

### LLM 智能体

智能体处理指令、自己选下一步。有人盯着的时候这很好用，但每一圈循环都多一次脱轨的机会。

### AI 驱动软件

代码处理确定性工作，并拥有控制流。模型只出现在系统需要可编程常识、或需要解读非结构化数据的地方。每一次 AI 任务都保持原子、受约束。

![传统软件、智能体、AI 驱动软件三种系统架构。](https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/how-to-build-with-typesafe/software-architectures-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=35c7622176190d1b1f19dc712f2fbf11)

## 为什么 System One 可组合

| 性质 | 含义 |
| --- | --- |
| **结构化** | 从构造上就是 type-safe。决策和概率符合代码期望的软件类型和 JSON schema，不必从生成散文里把值抠出来。 |
| **并行** | 问题彼此独立、并行评估。一个原语的结果不会变成隐藏上下文，去改另一个原语的结果。 |
| **可比较** | 输出可排序，能驱动聪明的 `if`、阈值和比较。 |
| **快** | 多数查询大约 100 ms。够快，能进实时请求路径和用户界面。 |
| **校准置信度** | [RLCD](/introduction/machine-learning-primer) 用校准概率传达不确定，而不是往过度自信靠。 |
| **自洽** | 设计上，重复评估应返回稳定答案。见 [自洽：Noul](/cookbooks/consistency_noul_cookbook)。 |

每个输出都被约束在你给出的选项上，所以模型返回的是这些选项上的完整概率分布，而不是发明一个 schema 之外的值。TypeSafe 的目标是大于 100 倍的智力 / 速度与成本比；底层赌注是：更便宜的智力会创造出远大得多的需求。

## 设计一条 System One 工作流

### 能写进代码的，就写进代码 {#use-code-when-you-can}

确定性工作留在代码里。它可靠、便宜。软件工作流能表达同一行为时，不要上智能体的 `while` 循环。

#### 示例：确定性规则放代码里

```python
days_overdue = (today - invoice.due_date).days

if days_overdue > 30:
    route_to_collections(invoice)
```

把模型决策和代码组合起来的有界做法，见 [System One 模式](/patterns)。

### 拆开输入 state {#decompose-the-input-state}

只放和当前问题相关的上下文。这样模型少分心，也少 context rot。当前信息能从你自己的知识库来时，不要依赖模型权重里记着的知识。

#### 示例：只送相关上下文

```json
{
  "state": {
    "ticket_message": "My flight was cancelled. Can I get a refund?",
    "refund_policy": "Cancelled flights are eligible for a full refund."
  },
  "model": "jev-latest",
  "questions": {
    "policy_supports_refund": {
      "type": "noul",
      "instructions": "Does the refund policy support the refund requested in the ticket?"
    }
  }
}
```

### 给 state 加上结构 {#use-structure-in-the-input-state}

`state` 和 `questions` 用嵌套 JSON。问题指向某个具体值能去掉歧义时，就指向它；路径写在问题里时，用反引号包起来。

#### 示例：引用嵌套值

用带反引号的「点号 + 下标」路径，指向某个嵌套值，例如 `` `support.tickets[0].message` ``。

```json
{
  "state": {
    "support": {
      "tickets": [
        { "message": "I was charged twice for order A-104." },
        { "message": "How do I reset my password?" }
      ]
    },
    "commerce": {
      "orders": [
        {
          "id": "A-104",
          "charges": [
            { "amount_usd": 49, "status": "captured" },
            { "amount_usd": 49, "status": "captured" }
          ]
        }
      ]
    },
    "account": {
      "security": {
        "password_reset": "Email a reset link to the address on file."
      }
    }
  },
  "model": "jev-latest",
  "questions": {
    "duplicate_charge": {
      "type": "noul",
      "instructions": "Do `support.tickets[0].message` and `commerce.orders[0].charges` indicate a duplicate charge?"
    },
    "password_reset_supported": {
      "type": "noul",
      "instructions": "Can `account.security.password_reset` resolve the request in `support.tickets[1].message`?"
    }
  }
}
```

### 把问题拆细 {#decompose-the-questions}

尽可能问最明确、最窄、最具体、最原子的问题。复杂或定义不清的问题，拆成各自只评估一个属性的问题。

> 这大概是本指南里最重要的概念。宽问题把好几次判断藏在一个答案后面。原子问题把这些判断摊开，好在代码里检查、调参、组合。

#### 示例：拆开垃圾检测

**一个宽问题（不好）：**

```json
{
  "state": {
    "message": {
      "sender": {
        "display_name": "Acme Payroll",
        "email": "rewards@claim-bonus.example"
      },
      "subject": "Urgent: claim your employee bonus",
      "body": "You have been selected for a $1,000 bonus. Confirm your payroll password today to receive it.",
      "links": [
        {
          "text": "Claim bonus",
          "url": "http://claim-bonus.example/acme"
        }
      ]
    }
  },
  "model": "jev-latest",
  "questions": {
    "is_spam": {
      "type": "noul",
      "instructions": "Is `message` spam?"
    }
  }
}
```

**拆开的问题（好）：**

```json
{
  "questions": {
    "requests_credentials": {
      "type": "noul",
      "instructions": "Does `message.body` ask the recipient to provide a password or other login credential?"
    },
    "offers_unexpected_reward": {
      "type": "noul",
      "instructions": "Does `message.body` claim the recipient received an unexpected prize, payment, or reward?"
    },
    "creates_time_pressure": {
      "type": "noul",
      "instructions": "Does `message.subject` or `message.body` pressure the recipient to act quickly?"
    },
    "sender_identity_mismatch": {
      "type": "noul",
      "instructions": "Does the organization named in `message.sender.display_name` conflict with the domain in `message.sender.email`?"
    },
    "link_domain_mismatch": {
      "type": "noul",
      "instructions": "Does the domain in `message.links[0].url` conflict with the organization named in `message.sender.display_name`?"
    },
    "disguises_link_destination": {
      "type": "noul",
      "instructions": "Does `message.links[0].text` conceal or misrepresent the destination in `message.links[0].url`?"
    }
  }
}
```

后一组和前一组用同一份 `message` state。每个 Noul 只盯一个可检查的属性；垃圾与否由代码用权重合成，而不是让模型在一句「这是不是垃圾」里同时权衡六件事。

#### 示例：核验工具调用轨迹

**一个宽问题（不好）：**

```json
{
  "state": {
    "request": {
      "text": "What's the weather in Seattle tomorrow in Fahrenheit?",
      "location": "Seattle, WA",
      "date": "2026-09-03",
      "unit": "fahrenheit"
    },
    "available_tools": {
      "geocode_city": {
        "description": "Resolve a city to latitude and longitude.",
        "parameters": { "city": "string" }
      },
      "get_weather": {
        "description": "Get the forecast for coordinates and a date.",
        "parameters": {
          "latitude": "number",
          "longitude": "number",
          "date": "YYYY-MM-DD",
          "unit": ["fahrenheit", "celsius"]
        }
      }
    },
    "trace": {
      "tool_calls": [
        {
          "id": "call_1",
          "name": "geocode_city",
          "arguments": { "city": "Seattle, WA" }
        },
        {
          "id": "call_2",
          "name": "get_weather",
          "arguments": {
            "latitude": 47.6062,
            "longitude": -122.3321,
            "date": "2026-09-03",
            "unit": "celsius"
          }
        }
      ],
      "tool_results": [
        {
          "tool_call_id": "call_1",
          "output": { "latitude": 47.6062, "longitude": -122.3321 }
        }
      ]
    }
  },
  "model": "jev-latest",
  "questions": {
    "tool_calls_are_correct": {
      "type": "noul",
      "instructions": "Is `trace.tool_calls` correct for `request` and `available_tools`?"
    }
  }
}
```

**拆开的问题（好）：**

```json
{
  "questions": {
    "geocode_tool_is_relevant": {
      "type": "noul",
      "instructions": "Is `trace.tool_calls[0].name` an appropriate tool for resolving `request.location`?"
    },
    "geocode_location_matches": {
      "type": "noul",
      "instructions": "Does `trace.tool_calls[0].arguments.city` match `request.location`?"
    },
    "geocode_arguments_match_schema": {
      "type": "noul",
      "instructions": "Does `trace.tool_calls[0].arguments` conform to `available_tools.geocode_city.parameters`?"
    },
    "geocode_result_matches_call": {
      "type": "noul",
      "instructions": "Does `trace.tool_results[0].tool_call_id` match `trace.tool_calls[0].id`?"
    },
    "weather_tool_is_relevant": {
      "type": "noul",
      "instructions": "Is `trace.tool_calls[1].name` an appropriate tool for answering `request.text`?"
    },
    "weather_arguments_match_schema": {
      "type": "noul",
      "instructions": "Does `trace.tool_calls[1].arguments` conform to `available_tools.get_weather.parameters`?"
    },
    "weather_uses_geocoded_coordinates": {
      "type": "noul",
      "instructions": "Do the coordinates in `trace.tool_calls[1].arguments` match those in `trace.tool_results[0].output`?"
    },
    "weather_date_matches": {
      "type": "noul",
      "instructions": "Does `trace.tool_calls[1].arguments.date` match `request.date`?"
    },
    "weather_unit_matches": {
      "type": "noul",
      "instructions": "Does `trace.tool_calls[1].arguments.unit` match `request.unit`?"
    }
  }
}
```

宽问题会给出一个含糊的「对 / 不对」。拆开之后，代码能看见：地理编码是对的，天气工具也选对了，但 `unit` 是 `celsius` 而请求要的是 `fahrenheit`。失败点变得可检查、可修复。

### 给问题加上结构 {#use-structure-in-the-questions}

问题写短。`instructions` 和 `criteria` 通常是字符串；短而没有歧义的问题，字符串就够。它们也可以是对象或数组：问题放一个字段，引导问题的数据放其他字段。

结构在这些情况下有用：

* 问题需要上下文或示例。一大段背景，或一串示例输入，放到问题旁边的具名字段里，代码就能增删、替换，而不用改写问题本身。
* 问题的一部分来自你的代码。值来自数据库时，放进自己的字段，不要拼进字符串模板。
* 好几个问题的 instructions 很像。一次请求只有一份 state，但可以带多个问题。补上辅助数据，能让问题彼此区分开。

#### 示例：引用代码里的一条记录

这个 Noul 把 state 里的简历，和候选人库里的一条记录对照。记录原样放进 `potential_duplicate`，问题用名字引用它。

```json
{
  "state": {
    "resume": {
      "name": "John Smith",
      "location": "Oakland, CA",
      "summary": "Backend engineer with eight years of Python and Go experience.",
      "experience": [
        { "employer": "Google", "title": "Senior Backend Engineer", "years": "2021-2025" },
        { "employer": "Microsoft", "title": "Software Engineer", "years": "2017-2021" }
      ]
    }
  },
  "model": "jev-latest",
  "questions": {
    "same_as_record_18": {
      "type": "noul",
      "instructions": {
        "potential_duplicate": {
          "name": "John Smith",
          "location": "Oakland, California",
          "last_employer": "Google"
        },
        "question": "Is the resume for the same person as `potential_duplicate`?"
      }
    }
  }
}
```

来自代码的 `potential_duplicate` 数据会随时间变。`question` 用反引号引用它。

`criteria` 里的描述也可以是对象。对 Choice，每个选项的描述可以是一个对象：这个选项覆盖什么、什么属于别的选项、再给几个例子。各选项用同一套字段名，模型才能直接对照。

#### 示例：写对照式的 Choice criteria

```json
{
  "state": "How many disposable virtual cards can I make per day?",
  "model": "jev-latest",
  "questions": {
    "card_help_topic": {
      "type": "choice",
      "instructions": {
        "question": "Which disposable virtual card topic is the user asking about?",
        "focus": "Classify the information the user wants."
      },
      "criteria": {
        "get_disposable_virtual_card": {
          "what": "Purpose, eligibility, or setup",
          "not_for": "Quantity, transaction, or merchant restrictions",
          "examples": [
            "How can I get a disposable virtual card?",
            "What are disposable cards for?"
          ]
        },
        "disposable_card_limits": {
          "what": "Quantity, transaction, or merchant restrictions",
          "not_for": "Purpose, eligibility, or setup",
          "examples": [
            "How many disposable cards can I make per day?",
            "Where can I use a disposable card?"
          ]
        }
      }
    }
  }
}
```

每种问题类型的页面都有完整例子：

* [Noul](/primitives/noul#structured-instructions) 把一份简历对照多条候选人记录，一条记录一个问题，问题在代码里生成。
* [Choice](/primitives/choice#structured-instructions-and-criteria) 描述两个容易混淆的选项：各自覆盖什么、不覆盖什么、再加例子。
* [Score](/primitives/score#structured-level-descriptions) 给每个等级一段描述和示例情境。

[结构化数据抽取级联 cookbook](/cookbooks/sde_cascade) 展示「共用措辞」的情况：对抽取记录的每一个字段问同一组问题。

短而没有歧义的问题或标准，可以继续用字符串。当结构能把否则会糊在一起的指引分开时，再加结构。结构能出现在哪些位置，见 [高级：结构](/primitives/advanced)。

### 一次多问 {#ask-a-lot-of-questions}

针对同一份 state，在一次请求里问许多窄的、彼此独立的问题。这是用 API 把每美元的效果和智力最大化的办法：问题并行跑，代码组合信号，不必再串行打模型。

见 [投机扇出](/patterns/fan-out) 和 [并行问题](/cookbooks/parallel_questions)。

### 在代码里组合答案（或喂给经典 ML） {#combine-question-outputs-in-code}

用确定性规则或加权和，把彼此独立的答案合起来。若要学着组合，把概率当特征，交给下游的经典机器学习模型。

#### 示例：用加权分数合成信号

```python
answers = response.answers

# Combine independent signals into one application-specific score.
quality = (
    0.4 * answers["answers_request"].noul
    + 0.4 * answers["citations_are_supported"].noul
    + 0.2 * (1 - answers["contradicts_context"].noul)
)
```

[组合评分](/patterns/composite-scoring) 说明如何在合成时保留每一次单独判断。若没有给下游模型的标签，可以用一组昂贵的推理模型来生成；[自动研究特征发现](/cookbooks/autoresearch_feature_discovery) 展示如何在 System One 的输出上训练经典模型。

### 按不确定性路由 {#route-on-uncertainty}

自信和不自信的答案，让代码走不同动作。不确定的案子升级给人，或交给更贵的推理模型。在你的数据上把置信度对准确率画出来，再定阈值。

#### 示例：按置信度路由

```python
answer = response.answers["card_help_topic"]

if answer.confidence < 0.8:
    route_to_human_review(ticket)
else:
    route_to_handler(answer.choice, ticket)
```

如何选阈值、如何把阈值和每个动作的风险对齐，见 [Confidence](/confidence) 和 [置信度门控路由](/patterns/confidence-routing)。

> 拆开并不需要更多往返。针对同一份 state 的问题并行跑。

## 放在一起

下面这条客服工单工作流：确定性工作留在代码里，只送相关的结构化上下文，一次请求评估许多原子问题，再用明确的置信度门把答案组合起来。

```python
from typesafe_sdk import Choice, Noul, NoulCriteria, Score, TypeSafeClient

def triage_ticket(ticket, customer):
    # Handle deterministic states without calling a model.
    if ticket["status"] == "closed":
        return "no_action"

    open_orders = [
        order for order in customer["orders"] if order["status"] != "delivered"
    ]

    # Include only the structured context needed by the questions below.
    state = {
        "ticket": {
            "message": ticket["message"],
            "sender": ticket["sender"],
            "links": ticket["links"],
        },
        "customer": {
            "plan": customer["plan"],
            "open_orders": open_orders,
        },
        "policy": {
            "sensitive_credentials": ["password", "security code", "API key"],
        },
    }

    # Ask structured, atomic questions together so they run in parallel.
    questions = {
        "topic": Choice(
            instructions={
                "question": "Which team should handle `ticket.message`?",
                "focus": "Classify the customer's primary request.",
            },
            criteria={
                "billing": {
                    "what": "Charges, invoices, refunds, or subscriptions",
                    "not_for": "Order tracking or account access",
                    "examples": ["I was charged twice", "Where is my refund?"],
                },
                "orders": {
                    "what": "Order status, delivery, cancellation, or returns",
                    "not_for": "Charges or account access",
                    "examples": ["Where is my order?", "Cancel my shipment"],
                },
                "account": {
                    "what": "Login, profile, permissions, or security",
                    "not_for": "Charges or order tracking",
                    "examples": ["Reset my password", "I cannot sign in"],
                },
            },
        ),
        "requests_credentials": Noul(
            instructions={
                "question": "Does the message request a sensitive credential?",
                "compare": [
                    "`ticket.message`",
                    "`policy.sensitive_credentials`",
                ],
                "focus": "Look for a request to disclose the credential itself.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Asks the recipient to disclose a listed credential",
                    "examples": [
                        "Reply with your password",
                        "Send us your API key",
                    ],
                },
                false={
                    "what": "Does not ask the recipient to disclose a credential",
                    "not_for": "A legitimate instruction to reset a credential",
                    "examples": ["Use this link to reset your password"],
                },
            ),
        ),
        "sender_identity_mismatch": Noul(
            instructions={
                "question": "Does the claimed sender identity conflict with its domain?",
                "compare": [
                    "`ticket.sender.display_name`",
                    "`ticket.sender.email`",
                ],
                "focus": "Compare the named organization with the email domain.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Claims an organization unrelated to the email domain",
                    "examples": ["Acme Payroll sent from claim-bonus.example"],
                },
                false={
                    "what": "The identity and domain agree or make no conflicting claim",
                    "examples": ["Acme Payroll sent from acme.example"],
                },
            ),
        ),
        "unexpected_reward": Noul(
            instructions={
                "question": "Does the message announce an unexpected reward?",
                "inspect": "`ticket.message`",
                "focus": "Look for an unsolicited prize, payment, or reward claim.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Announces an unrequested prize, payment, or reward",
                    "examples": ["You were selected for a $1,000 bonus"],
                },
                false={
                    "what": "Contains no reward claim or discusses an expected payment",
                    "not_for": "A customer asking about a known refund or payroll deposit",
                    "examples": ["When will my approved refund arrive?"],
                },
            ),
        ),
        "refund_requested": Noul(
            instructions={
                "question": "Does the customer explicitly request a refund or credit?",
                "inspect": "`ticket.message`",
                "focus": "Require a requested remedy, not a billing complaint alone.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Directly asks for money back or an account credit",
                    "examples": ["Please refund the duplicate charge"],
                },
                false={
                    "what": "Does not ask for a refund or credit",
                    "not_for": "A complaint or billing question without a requested remedy",
                    "examples": ["Why was I charged twice?"],
                },
            ),
        ),
        "mentions_open_order": Noul(
            instructions={
                "question": "Does the message refer to a supplied open order?",
                "compare": [
                    "`ticket.message`",
                    "`customer.open_orders`",
                ],
                "focus": "Match an order id or other identifying details.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Refers to an open order by id or identifying details",
                    "examples": ["Where is order A-104?"],
                },
                false={
                    "what": "Does not identify any supplied open order",
                    "not_for": "A generic order question with no matching details",
                    "examples": ["How long does shipping usually take?"],
                },
            ),
        ),
        "frustration": Score(
            instructions={
                "question": "How frustrated does the customer appear?",
                "inspect": "`ticket.message`",
                "focus": "Judge expressed frustration, not issue severity.",
            },
            criteria=[
                {
                    "what": "Calm and matter-of-fact",
                    "signals": ["Neutral wording", "No complaint about the experience"],
                },
                {
                    "what": "Frustrated but civil",
                    "signals": ["Expresses annoyance", "Remains constructive"],
                },
                {
                    "what": "Very angry or threatening to leave",
                    "signals": ["Hostile language", "Threatens cancellation or churn"],
                },
            ],
        ),
    }

    with TypeSafeClient() as client:
        response = client.system_one(
            state=state,
            questions=questions,
        )

    # Compose independent spam signals with weights controlled by code.
    answers = response.answers
    spam_risk = (
        0.45 * answers["requests_credentials"].noul
        + 0.30 * answers["sender_identity_mismatch"].noul
        + 0.25 * answers["unexpected_reward"].noul
    )

    # Escalate uncertain judgments instead of guessing.
    spam_is_uncertain = 0.4 < spam_risk < 0.6
    if spam_is_uncertain or answers["topic"].confidence < 0.75:
        return route_to_human_review(ticket)
    if spam_risk >= 0.6:
        return quarantine_as_spam(ticket)

    # Let code decide which speculative answers matter on this path.
    if answers["topic"].choice == "billing":
        return route_to_billing(
            ticket,
            refund_requested=answers["refund_requested"].noul >= 0.7,
        )
    if answers["topic"].choice == "orders":
        return route_to_orders(
            ticket,
            mentions_open_order=answers["mentions_open_order"].noul >= 0.7,
        )

    priority = (
        "high"
        if answers["frustration"].confidence >= 0.7
        and answers["frustration"].score >= 1.5
        else "normal"
    )
    return route_to_account_support(ticket, priority=priority)
```
