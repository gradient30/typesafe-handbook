# Choice

> Choice 是一种 System One 问题类型，用于从给定集合中选一项。答案包含选中的选项、每个选项的概率，以及置信度。

当答案是固定选项集合中的一项时，用 Choice。例如哪个团队处理工单、商品属于哪个品类、代码片段用的是哪种语言。如果答案是谱上的一个位置，用 [Score](/primitives/score)。如果是是或否，用 [Noul](/primitives/noul)。三种类型的对比见 [选择问题类型](/primitives#choose-a-question-type)。

Choice 答案是 `choice` 里选中的选项。模型还会在 `probabilities` 里返回每个选项的概率，以及选中选项的 `confidence`。

问题示例：

```
"What programming language is this code written in"
  → options: python, javascript, typescript, go, rust, other

"What type of meeting is this based on the title and description"
  → options: standup, planning, retrospective, one on one, brainstorm, none of the above

"Which product category does this item belong to"
  → options: electronics, clothing, home garden, food and beverage
```

## 请求结构 {#request-structure}

发往 [TypeSafe API](/api) 的 POST 请求体有固定结构。顶层三个字段：`state`，要评估的内容；`model`；以及 `questions`，从你选择的问题 id 到问题对象的映射。每个 Choice 问题有这些字段：

* `type`：始终是 `"choice"`。
* `instructions`：模型要回答的问题。
* `criteria`：答案选项，用映射表示。每个键是选项名，每个值是该选项的描述。

下面这次请求里，state 是一家网上鞋店的客服工单，问题是该由哪个团队处理：

```json
{
  "state": "My running shoes arrived in the wrong size. Can I swap them for a size 10?",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "returns": "Exchanges, wrong or damaged items",
        "shipping": "Delivery status, delays, lost packages",
        "billing": "Charges, invoices, payment problems"
      }
    }
  }
}
```

问题 id 由你选，这里是 `department`。答案会在同一个 id 下返回。模型看不到问题 id。选项名和描述都会发给模型，所以描述要能把选项彼此分开。

我们的 [客户端 SDK](/sdk) 提供类型化问题。在 Python 里，同一个问题是一个 `Choice`：

```python
from typesafe_sdk import Choice, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        state="My running shoes arrived in the wrong size. Can I swap them for a size 10?",
        questions={
            "department": Choice(
                instructions="Which team should handle this?",
                criteria={
                    "returns": "Exchanges, wrong or damaged items",
                    "shipping": "Delivery status, delays, lost packages",
                    "billing": "Charges, invoices, payment problems",
                },
            ),
        },
    )

    print(response.answers["department"].choice)
```

用 `system_one` 方法或 `https://api.typesafe.ai/v1/systemone` 端点调用 System One 模型。`model` 字段选择由哪个模型处理请求。在代码的哪个位置调用，见 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

可以用我们的 [客户端 SDK](/sdk)，也可以直接调 [HTTP API](/api)。如果是编码智能体在帮你写集成，先安装 [TypeSafe agent skill](/agent-skill#installation)，让它知道请求和响应的形状。

> `instructions` 和 `criteria` 里的每一项都可以是字符串、对象或数组。从字符串开始。当一段描述需要几种指引时再用对象，例如这个选项覆盖什么、不覆盖什么、以及若干例子。见下面的 [结构化的 instructions 和 criteria](#structured-instructions-and-criteria) 以及 [API 参考](/api#param-instructions-1)。

## 响应结构 {#response-structure}

响应在 `answers` 里为每个问题留一条，键是请求里的 id。上面那个示例请求的响应是：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "returns",
      "confidence": 1.0,
      "probabilities": {
        "shipping": 0.0,
        "returns": 1.0,
        "billing": 0.0
      }
    }
  },
  "usage": {
    "input_tokens": 328,
    "output_tokens": 34
  }
}
```

除了 `type`，每个 Choice 答案还有三个值：

* `choice`：概率最高的选项。
* `probabilities`：每个选项上的完整概率分布。所有值之和为 1。
* [`confidence`](/confidence)：由 `probabilities` 的分散程度算出的 0 到 1 的数。形状平坦、概率摊在几个选项上，表示低置信度。单个选项上出现尖峰，表示高置信度。

这张工单很简单，所以全部概率都在 `returns` 上，置信度是 1.0。如果工单既提到尺码不对又提到退款没到，概率会在 `returns` 和 `billing` 之间分开，置信度会下降。

## 好习惯：一次调用问多个问题 {#good-practice-ask-more-than-one-question-per-call}

代码可能用到的每一个 Choice 问题，都放进同一次请求，而不是一问一次请求。问题并行评估。多加几个问题几乎不改变响应时间，代码可以忽略用不上的答案。额外问题仍然消耗 token。完整说明见 [一次问多个问题](/primitives#ask-multiple-questions-together)；下一节展示一次调用里的五个 Choice 问题。

同一套逻辑也适用于单个 Choice 问题里的选项。一个 Choice 问题最多接受 255 个选项，每加一个选项只多几个 token，所以把团队、品类或产品的完整列表给模型，而不是一份短名单。列表可能盖不住所有输入时，加一个 `other` 或 `none of the above` 选项，让模型可以说「其他都不合适」。

要沿很深的层级或大型分类体系给文档分类，就一级一级地串联 Choice 问题。[层级分类食谱](/cookbooks/hierarchical_classification) 展示了如何在 Choice 概率上做束搜索，每一级保留最好的 `K` 条候选路径，而不是走一条贪心路径。

## 更复杂的例子 {#a-more-complex-example}

上面的基础例子把工单路由到一个团队。更大的客服系统可能还需要退货原因、配送问题、客户想要什么、以及客户的语气。

下面这次请求对一张比第一张更含糊的工单问了五个 Choice：它涉及三个团队，也没说客户想要什么。

```json
{
  "state": "Shoes arrived two weeks late and in the wrong size. Also I see two charges of $120 on my card. What are you going to do about this?",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "returns": "Exchanges, wrong or damaged items",
        "shipping": "Delivery status, delays, lost packages",
        "billing": "Charges, invoices, payment problems"
      }
    },
    "return_reason": {
      "type": "choice",
      "instructions": "If the customer wants to return something, why?",
      "criteria": {
        "wrong_size": "The item doesn't fit",
        "wrong_item": "A different product was delivered",
        "damaged": "The item arrived broken or faulty",
        "changed_mind": "The item is fine, the customer no longer wants it",
        "other": "A return reason that fits none of the above"
      }
    },
    "shipping_issue": {
      "type": "choice",
      "instructions": "If this is a shipping problem, which kind is it?",
      "criteria": {
        "not_delivered": "The package never arrived",
        "delayed": "The package is late but still on its way",
        "wrong_address": "The package went to the wrong place",
        "damaged_in_transit": "The package arrived damaged",
        "other": "A shipping problem that fits none of the above"
      }
    },
    "requested_resolution": {
      "type": "choice",
      "instructions": "What does the customer want to happen?",
      "criteria": {
        "exchange": "Swap the item for a different one",
        "refund": "Money back",
        "replacement": "The same item sent again",
        "information": "Just an answer, no action needed"
      }
    },
    "tone": {
      "type": "choice",
      "instructions": "What is the customer's tone?",
      "criteria": {
        "calm": null,
        "frustrated": null,
        "angry": null
      }
    }
  }
}
```

其中两个 Choice 是投机性的：`return_reason` 只在 `department` 是 `returns` 时才有意义，`shipping_issue` 只在是 `shipping` 时才有意义。`tone` 问题用 `null` 描述，因为选项名本身已经清楚。

TypeSafe 的响应：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "returns",
      "confidence": 0.42,
      "probabilities": {
        "shipping": 0.04,
        "billing": 0.35,
        "returns": 0.61
      }
    },
    "return_reason": {
      "type": "choice",
      "choice": "wrong_size",
      "confidence": 1.0,
      "probabilities": {
        "other": 0.0,
        "wrong_size": 1.0,
        "changed_mind": 0.0,
        "damaged": 0.0,
        "wrong_item": 0.0
      }
    },
    "shipping_issue": {
      "type": "choice",
      "choice": "delayed",
      "confidence": 0.67,
      "probabilities": {
        "wrong_address": 0.0,
        "other": 0.26,
        "not_delivered": 0.0,
        "damaged_in_transit": 0.0,
        "delayed": 0.74
      }
    },
    "requested_resolution": {
      "type": "choice",
      "choice": "refund",
      "confidence": 0.2,
      "probabilities": {
        "replacement": 0.34,
        "refund": 0.4,
        "information": 0.02,
        "exchange": 0.24
      }
    },
    "tone": {
      "type": "choice",
      "choice": "frustrated",
      "confidence": 0.76,
      "probabilities": {
        "frustrated": 0.84,
        "angry": 0.16,
        "calm": 0.0
      }
    }
  },
  "usage": {
    "input_tokens": 589,
    "output_tokens": 212
  }
}
```

每个问题都单独对着工单作答：

* `department` 答案是 `returns`，概率 0.61，但因为重复扣款，`billing` 有 0.35。这张工单属于两个团队，0.42 的分裂置信度反映了这一点。
* `return_reason` 是 `wrong_size`，置信度 1.0，符合预期，因为工单里写得很清楚。
* `shipping_issue` 的答案在 `delayed` 和 `other` 之间分开。这是投机性问题，而 `department` 没有返回 shipping，所以代码可以忽略它，如下面的示例代码所示。
* `requested_resolution` 偏向 `refund`（0.40），`replacement` 和 `exchange` 分走大部分剩余概率，置信度是 0.20。重复扣款暗示退钱，尺码不对暗示换货，客户始终没说想要哪一种。
* `tone` 答案是 `frustrated`，概率 0.84，置信度 0.76。

下面的示例代码读取它需要的答案、忽略其余，并把低置信度答案当成「该问、不该动手」的理由：

```python
from typesafe_sdk import Choice, TypeSafeClient

TRIAGE_QUESTIONS = {
    "department": Choice(
        instructions="Which team should handle this?",
        criteria={
            "returns": "Exchanges, wrong or damaged items",
            "shipping": "Delivery status, delays, lost packages",
            "billing": "Charges, invoices, payment problems",
        },
    ),
    "return_reason": Choice(
        instructions="If the customer wants to return something, why?",
        criteria={
            "wrong_size": "The item doesn't fit",
            "wrong_item": "A different product was delivered",
            "damaged": "The item arrived broken or faulty",
            "changed_mind": "The item is fine, the customer no longer wants it",
            "other": "A return reason that fits none of the above",
        },
    ),
    "shipping_issue": Choice(
        instructions="If this is a shipping problem, which kind is it?",
        criteria={
            "not_delivered": "The package never arrived",
            "delayed": "The package is late but still on its way",
            "wrong_address": "The package went to the wrong place",
            "damaged_in_transit": "The package arrived damaged",
            "other": "A shipping problem that fits none of the above",
        },
    ),
    "requested_resolution": Choice(
        instructions="What does the customer want to happen?",
        criteria={
            "exchange": "Swap the item for a different one",
            "refund": "Money back",
            "replacement": "The same item sent again",
            "information": "Just an answer, no action needed",
        },
    ),
    "tone": Choice(
        instructions="What is the customer's tone?",
        criteria={"calm": None, "frustrated": None, "angry": None},
    ),
}

def triage(ticket: str) -> None:
    with TypeSafeClient() as client:
        response = client.system_one(
            state=ticket,
            questions=TRIAGE_QUESTIONS,
        )
    answers = response.answers

    department = answers["department"]
    if department.confidence < 0.3:
        # 不清楚该发给哪个团队。交给人来决定。
        send_to_manual_triage(ticket)
        return

    if department.choice == "returns":
        # return_reason 答案只在这里用
        assign(ticket, team="returns", issue=answers["return_reason"].choice)
    elif department.choice == "shipping":
        # shipping_issue 答案只在这里用
        assign(ticket, team="shipping", issue=answers["shipping_issue"].choice)
    else:
        assign(ticket, team="billing")

    # 另一个团队如果占了可观的概率份额，就抄送一份
    for team, probability in department.probabilities.items():
        if team != department.choice and probability > 0.25:
            notify(ticket, team=team)

    resolution = answers["requested_resolution"]
    if resolution.confidence < 0.5:
        # 客户没说想要什么。去问，不要猜。
        ask_customer_what_they_want(ticket)
    elif resolution.choice == "refund":
        flag_for_refund_approval(ticket)

    if answers["tone"].choice == "angry":
        flag_for_senior_agent(ticket)
```

对上面那张工单，这段代码把它分给退货团队，issue 是 `wrong_size`；因为账单团队的 0.35 份额超过 0.25 阈值，给账单团队抄送一份；又因为处理方式的置信度 0.20 低于 0.5，去问客户想要什么。代码没有使用 `shipping_issue` 答案。

一次请求，五个答案，路由逻辑就是普通的 `if`。以后如果还需要知道客户的语言，或工单在说哪个产品，往 `TRIAGE_QUESTIONS` 再加一个 Choice 即可；请求次数仍是一次。

[智能家居助手演示](/demos/smart-home) 用一次调用、一长串 Choice 评估每一条用户请求：请求类别、房间、设备、动作。对任何单条请求来说，其中大多数问题都不相关，代码会忽略它们。

## 结构化的 instructions 和 criteria {#structured-instructions-and-criteria}

每个选项先从一行描述开始。当两个选项相近、模型总是搞混时，用对象而不是字符串来描述每一个。给它几个字段：这个选项覆盖什么、什么其实属于相邻选项、以及若干示例输入。

下面两个答案选项，return\_policy 和 return\_status，很容易混淆。无论关于哪一个的工单都可能提到退货和退款，所以每个选项都写明它不适用于什么。

```json
{
  "state": "I sent the shoes back a week ago. When do I get my money?",
  "model": "jev-latest",
  "questions": {
    "return_topic": {
      "type": "choice",
      "instructions": {
        "question": "Which returns topic is the customer asking about?",
        "focus": "Classify the information the customer wants."
      },
      "criteria": {
        "return_policy": {
          "what": "Whether and how an item can be returned",
          "not_for": "Progress of a return already sent",
          "examples": [
            "Can I return shoes I've worn once?",
            "How long do I have to return an order?"
          ]
        },
        "return_status": {
          "what": "Progress of a return already sent",
          "not_for": "Whether and how an item can be returned",
          "examples": [
            "Has my return arrived yet?",
            "When will my refund be paid?"
          ]
        }
      }
    }
  }
}
```

响应是 `return_status`，置信度 1.0：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "return_topic": {
      "type": "choice",
      "choice": "return_status",
      "confidence": 1.0,
      "probabilities": {
        "return_policy": 0.0,
        "return_status": 1.0
      }
    }
  },
  "usage": {
    "input_tokens": 407,
    "output_tokens": 32
  }
}
```

字段名 `question`、`focus`、`what`、`not_for`、`examples` 不是 API 的一部分，也没有保留字。你自己选它们，就像选选项名一样。模型会同时看到名字和值，所以用能标明后面内容的短名字。
