# 原语（问题）

> TypeSafe 的三种问题类型（Choice、Score、Noul）、它们返回的类型化答案、如何选择，以及如何一次问多个。

TypeSafe 的原语是你可以在代码里组合的小型、类型化构件。它们成对出现：一个问题定义 [System One 模型](/concepts/system-one) 要对一份 [state](/concepts/state) 做的一次判断，答案则是返回的类型化取值。你在代码里组合这些答案来做决策。一共有三种问题类型，各自返回不同形状的答案。

| 类型 | 回答什么 | 返回 |
| --- | --- | --- |
| [Choice](/primitives/choice) | 这些选项里选哪个？ | `choice`、`probabilities`、`confidence` |
| [Score](/primitives/score) | 落在哪一档？ | `score`、`legend`、`probabilities`、`confidence` |
| [Noul](/primitives/noul) | 这是真的吗？ | `noul`（0 到 1） |

可以只问一个问题，也可以一次发多个。请求里的每个问题看到的是同一份 state，彼此独立评估，并在你指定的 ID 下返回类型化答案。

## 每个问题只问一次瞬时判断 {#ask-for-one-snap-judgment-per-question}

System One 模型为快速、聚焦的判断而建。问一个懂行的人在拿到正确上下文后一秒钟就能做的判断。「这条消息有没有传达紧迫感？」是好问题。「分析这条消息并决定最佳行动方案」不是。后者需要慢推理，也是一个信号：把任务拆成小问题，再在代码里组合答案。

如果目标判断依赖若干彼此独立的因素，就分别问每个因素，再用你自己的逻辑把答案合起来。不要问「给这份创业路演打分」，而是分别问市场规模、技术可行性、差异化，再按相对重要性在代码里加权。优先级变了，改权重的数值就行，不用重写提示词。[一次问多个问题](#ask-multiple-questions-together) 说明具体做法。

## 定义一个问题 {#define-a-question}

每个问题都有 ID、`type` 和 `instructions`。Choice 和 Score 还要带 `criteria`：Choice 用来定义选项，Score 用来定义等级。Noul 的 `criteria` 是可选的，用来澄清「是」和「否」分别意味着什么。

* ID。你自己选的键，例如 `refund_requested`。它用来在响应里标识答案。
* `type`。`choice`、`score` 或 `noul` 之一。
* `instructions`。你对这份 state 提出的问题。评估逻辑写在这里。写成清楚、具体的问句，或写成让模型判断的陈述。大多数问题用字符串就够。也可以是对象或数组，把问题放在一个字段、把问题所指的数据放在其他字段；见 [在问题里使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。
* `criteria`。可能的答案：Choice 是选项映射，Score 是有序的等级列表，Noul 是对 yes / no 的可选描述。每种问题类型的页面会讲各自的形状。

这个问题问客户是否要求退款：

```python
from typesafe_sdk import Noul

questions = {
    "refund_requested": Noul(
        instructions="Does the customer request a refund?",
    ),
}
```

> 问题 ID 是给你的代码用的，不会发给模型。即使 ID 看起来已经自解释，也要把完整问题写进 `instructions`。

## 选择问题类型 {#choose-a-question-type}

选和你需要的答案形状匹配的类型。

* **Choice** 适合答案是已知集合中的一项、且选项之间没有顺序的情况：把工单路由到某个部门、判断文档类型、识别编程语言。给出完整选项列表；列表可能盖不住所有输入时，加一个 `other` 或 `none of the above` 选项。

* **Score** 适合答案落在一条谱上、并且你能描述谱上每一点意味着什么的情况：缺陷严重度、客户沮丧程度、技能水平。等级由你定义，模型返回沿这些等级的一个位置。

* **Noul** 适合干净的是/否问题，概率本身就是有用信号：这条消息有没有个人身份信息、客户是否要求退款、简历有没有提到分布式系统。

> 是/否判断用 Noul，测量谱上的位置用 Score。「这位候选人 Python 强吗？」需要先把「强」定义清楚。Noul 取值 0.5 表示模型给 yes 和 no 同等概率，并不表示候选人是中等水平。定义不清，这个概率就很难解释。

  如果要测量技能水平，用带明确等级的 Score，例如没有经验、略有了解、日常使用、深厚专长。如果需要是/否决策，把条件写清楚，例如「简历是否写明候选人在工作中使用过 Python？」

如果两种类型看起来都合适，优先选你的代码能直接拿来行动的那种。在 `refund`、`rebook`、`information` 之间做 Choice，可以直接映射到三条代码路径。客户沮丧程度的 Score 可以映射到阈值。Noul 可以映射到一个 `if`。

## 返回什么 {#what-comes-back}

答案本身也是原语。每种问题类型返回一个类型化取值，代码可以拿来比较、设阈值、排序、传入后续逻辑，或放进后续请求的 state（见 [当一个问题依赖另一个](#when-one-question-depends-on-another)）。

| 类型 | 答案字段 | 怎么读 |
| --- | --- | --- |
| Choice | `choice`、`probabilities`、`confidence` | `choice` 是选中的选项。`probabilities` 是每个选项上的分布。`confidence` 概括这个分布有多尖。 |
| Score | `score`、`legend`、`probabilities`、`confidence` | `score` 是沿你的等级的一个位置，可以落在两档之间。`legend` 按编号重复这些等级。`probabilities` 是各等级上的分布。 |
| Noul | `noul` | 答案为 yes 的概率。接近 1 是强 yes，接近 0 是强 no，接近 0.5 不确定。Noul 没有单独的 `confidence`。 |

这些答案有两个让它们可组合的性质：

* **每个答案都被约束在你提供的选项里。** 模型返回的是你的选项或等级上的概率分布，绝不会给出范围外的值。代码永远不必从生成的散文里把值再解析回来。
* **每个答案都是独立的。** 一个问题的答案不会成为另一个问题的隐藏上下文。增删问题不会改变其他问题的结果。

[Confidence](/confidence) 说明 `confidence` 如何从 `probabilities` 导出，以及如何用它决定何时自动行动、何时升级给人工。

## 引用具体字段 {#reference-specific-fields}

被评估的内容，也就是 [state](/concepts/state)，经常是带若干部分的 JSON 对象：一段对话、一条记录、一份政策。当问题只关于其中一部分时，在 `instructions` 里用点号和索引路径点出它的键，并加上反引号。模型就知道该判断 state 的哪一部分。

以 State 页里的客服对话为例：

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

下面两个问题用路径分别指向客户消息、政策和扣款记录：

```python
questions = {
    "refund_requested": {
        "type": "noul",
        "instructions": "Does `ticket.messages[0].text` request a refund?",
    },
    "policy_supports_refund": {
        "type": "noul",
        "instructions": (
            "Does `refund_policy` support the refund requested "
            "in `ticket.messages[0].text`, given `order.charges`?"
        ),
    },
}
```

显式路径能说清结构化 state 里哪些部分应当进入每一次判断。如何组织输入见 [State](/concepts/state)。

## 一次问多个问题 {#ask-multiple-questions-together}

用到同一份 state 的问题，全部放进一次请求。问题类型可以自由混用。System One 模型会并行评估请求里的每一个问题。多加几个问题，响应时间几乎不变，成本也只是这几个额外问题的 token，很便宜。问一个你可能用不上的问题，接近免费。

下面这次请求同时给客户消息分类、检查紧迫性、并给沮丧程度打分：

```json
{
  "state": "Our API integration started returning 500 errors on every request about 20 minutes ago, and we can't process any customer orders until this is fixed.",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this",
      "criteria": {
        "billing": "Payment or subscription issues",
        "technical": "Bugs or integration problems",
        "sales": "Pricing or account questions"
      }
    },
    "is_urgent": {
      "type": "noul",
      "instructions": "The message conveys urgency or time-sensitivity"
    },
    "frustration": {
      "type": "score",
      "instructions": "How frustrated the customer appears",
      "criteria": [
        "Calm, just stating facts",
        "Frustrated but civil",
        "Very angry, strong language"
      ]
    }
  }
}
```

我们的 [客户端 SDK](/sdk) 提供类型化的问题和答案。在 Python 里，把由 `Choice`、`Noul`、`Score` 对象组成的 `questions` 字典传给 `client.system_one(...)`。下面这次请求把工单和退款政策只发一次，每个问题拿回一个类型化答案：

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

state = {
    "ticket_message": "My flight was cancelled. Can I get a refund?",
    "refund_policy": "Cancelled flights are eligible for a full refund.",
}

with TypeSafeClient() as client:
    response = client.system_one(
        state=state,
        questions={
            "refund_requested": Noul(
                instructions="Does `ticket_message` request a refund?",
            ),
            "request_type": Choice(
                instructions="What is the main request in `ticket_message`?",
                criteria={
                    "refund": "The customer wants money returned.",
                    "rebooking": "The customer wants a replacement flight.",
                    "information": "The customer is asking for information only.",
                },
            ),
            "frustration": Score(
                instructions="How frustrated does the customer appear in `ticket_message`?",
                criteria=[
                    "Calm and neutral.",
                    "Concerned but civil.",
                    "Very angry or using strong language.",
                ],
            ),
        },
    )

print(response.answers["refund_requested"].noul)
print(response.answers["request_type"].choice)
print(response.answers["frustration"].score)
```

安装和用法见 [客户端 SDK](/sdk)。

### 问投机性问题 {#ask-speculative-questions}

把代码可能用到的每个问题都问出来，包括那些答案只对部分输入才有意义的问题，再让代码决定用哪些答案。如果工单其实不是缺陷报告，就忽略严重度答案。我们把这叫做 [投机扇出](/patterns/fan-out) 模式。[并行问题食谱](/cookbooks/parallel_questions) 展示了把 13 个问题打成一次调用，比 13 次分开调用便宜 11.5 倍、快 9.6 倍，答案不变。

> 编码智能体比人更容易养成「一次调用只问一个问题」的习惯。[TypeSafe agent skill](/agent-skill#installation) 会告诉你的智能体：每次调用放进许多问题，包括那些只对部分输入才有意义的问题。

### 把复杂判断拆成若干问题 {#split-a-complex-judgment-into-several-questions}

依赖好几件事的判断，最好一件事一个问题。在代码里组合答案，按相对重要性给每个答案一个权重。权重由你定。合成结果和团队会做的决定对不上时，改代码里的权重再跑一遍。多加几个问题几乎不改变响应时间，因为它们在同一次请求里并行。拆分只多花几个问题 token。

例如，工单优先级可以由三个 Score 组成：缺陷有多严重、客户有多沮丧、报告给工程师多少可下手的信息。Score 页在 [把复杂判断拆成若干 Score](/primitives/score#splitting-a-complex-judgment-into-several-scores) 里走了一遍这次请求，以及把答案归一化并加权的代码。这种做法叫做 [组合评分](/patterns/composite-scoring) 模式。

### 当一个问题依赖另一个 {#when-one-question-depends-on-another}

同一次请求里的问题是独立的：一个答案不会变成另一个问题的上下文。如果后续判断依赖前一个答案，就在代码里发第二次请求。只有当你的代码在拿到第一个答案之前组不出第二次请求时，这种依赖才是真的：它需要这个答案去拉取更多数据填进 state、决定 state 由什么组成，或挑选下一个问题的选项。否则，把问题一起问，再在代码里组合答案。

两次请求是例外，不是常规。如果第二次请求的问题本来就可以对着原始 state 问，就把它们放进第一次请求，让代码忽略用不上的那些。有三份食谱是因为真正的理由才发第二次请求。[技能建议](/cookbooks/skill_suggestion) 在一次请求里给 182 个技能排序，再拉取前三名的全文，用更好的证据重新判断。[结构恢复](/cookbooks/autoformat) 问每一个换行是不是把句子拆开了，根据这些答案把行合并成块，再给这些块分类——这些块在第一次请求答完之前并不存在。[层级分类](/cookbooks/hierarchical_classification) 用每一个 Choice 答案决定下一次请求提供哪些选项。

如何把工作流拆成聚焦的判断，见 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

## 下一步 {#next-steps}

* [Choice](/primitives/choice) — 从固定列表中选一项。
* [Score](/primitives/score) — 按有序等级给 state 打分。
* [Noul](/primitives/noul) — 得到一句话为真的概率。

要看它们如何组成系统架构，去 [模式](/patterns)。
