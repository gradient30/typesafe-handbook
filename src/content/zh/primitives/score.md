# Score

> Score 是一种 System One 问题类型，用于按有序、可描述的等级给内容打分。答案包含分数、每个等级的概率，以及置信度。

当答案是你可以分步描述的谱上的一个位置时，用 Score。例如缺陷有多严重、客户有多满意、候选人有多少 Python 经验。如果答案是彼此没有顺序的固定选项中的一项，用 [Choice](/primitives/choice)。如果是是或否，用 [Noul](/primitives/noul)。三种类型的对比见 [选择问题类型](/primitives#choose-a-question-type)。

Score 答案是 `score` 里沿你的等级的一个位置，可以落在两档之间。模型还会在 `probabilities` 里返回每个等级的概率，以及该答案的 `confidence`。

每一步前面的数字是位置，说明见 [等级](#levels)。

## 请求结构 {#request-structure}

发往 [TypeSafe API](/api) 的 POST 请求体和其他问题类型一样，顶层三个字段：`state`，要评估的内容；`model`；以及 `questions`。每个 Score 问题有这些字段：

* `type`：始终是 `"score"`。
* `instructions`：模型要回答的问题。它在给什么打分。
* `criteria`：从量表低端到高端的有序等级描述数组。至少两个等级；API 最多接受 10 个。

下面这次请求里，state 是一份缺陷报告，问题是缺陷有多严重：

```json
{
  "state": "The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari.",
  "model": "jev-latest",
  "questions": {
    "bug_severity": {
      "type": "score",
      "instructions": "How severe is the reported issue?",
      "criteria": [
        "Cosmetic; no impact to functionality",
        "Broken or degraded feature, but workaround exists",
        "Blocking issue; no workaround exists"
      ]
    }
  }
}
```

问题 id 由你选，这里是 `bug_severity`。这个 id 不会发给模型。答案会在同一个 id 下返回。

### 等级 {#levels}

`criteria` 里的每一项是一个等级：可能答案谱上的一个点，用文字描述。等级编号是它在 `criteria` 数组里的位置，从 0 开始，所以上面三项是等级 0、1 和 2。数组顺序就是编号。

模型拿到的是描述，没有别的；每个等级都单独对着 state 判断。

响应里的 `score` 是等级谱上的一个位置。三档量表从 0 到 2，可以落在两档之间。

我们的 [客户端 SDK](/sdk) 提供类型化问题。在 Python 里，同一个问题是一个 `Score`：

```python
from typesafe_sdk import Score, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        state="The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari.",
        questions={
            "bug_severity": Score(
                instructions="How severe is the reported issue?",
                criteria=[
                    "Cosmetic; no impact to functionality",
                    "Broken or degraded feature, but workaround exists",
                    "Blocking issue; no workaround exists",
                ],
            ),
        },
    )

    print(response.answers["bug_severity"].score)
```

用 `system_one` 方法或 `https://api.typesafe.ai/v1/systemone` 端点调用 System One 模型。`model` 字段选择由哪个模型处理请求。在代码的哪个位置调用，见 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

可以用我们的 [客户端 SDK](/sdk)，也可以直接调 [TypeSafe API](/api)。如果是编码智能体在帮你写集成，先安装 [TypeSafe agent skill](/agent-skill#installation)，让它知道请求和响应的形状。

> `instructions` 和 `criteria` 里的每个等级都可以是字符串、对象或数组。从字符串开始。当一个等级需要描述再加几个示例情形时再用对象。见下面的 [结构化等级描述](#structured-level-descriptions) 以及 [API 参考](/api#param-instructions-2)。

## 响应结构 {#response-structure}

响应在 `answers` 里为每个问题留一条，键是请求里的 id。上面那个示例请求的响应是：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "bug_severity": {
      "type": "score",
      "score": 1.43,
      "confidence": 0.35,
      "legend": {
        "0": "Cosmetic; no impact to functionality",
        "1": "Broken or degraded feature, but workaround exists",
        "2": "Blocking issue; no workaround exists"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.57,
        "2": 0.43
      }
    }
  },
  "usage": {
    "input_tokens": 332,
    "output_tokens": 18
  }
}
```

每个 Score 答案有五个值：

* `type`：TypeSafe 问题的类型。
* `probabilities`：每个等级的概率，键是作为字符串的等级编号。所有值之和为 1。
* `score`：等级数轴上的位置，从 0 到最高等级编号，这里是 2。它是每个等级编号乘以其概率再相加：0 × 0.0 + 1 × 0.57 + 2 × 0.43 = 1.43。
* `legend`：每个等级编号映射回它的描述。
* [`confidence`](/confidence)：由 `probabilities` 的分散程度算出的 0 到 1 的数。单个等级上出现尖峰表示高置信度。概率摊在几个等级上表示低置信度。

分数 1.43 表示模型在等级 1 和 2 之间分裂，偏向等级 1。这和报告一致：导出坏了，换 Chrome 对大多数客户是变通办法，但对只用 Safari 的那些客户不是。模型把 0.57 放在「有变通办法」、0.43 放在「没有变通办法」，因为分裂，置信度是 0.35。

用 Python SDK 时，`ScoreAnswer` 有类型化的 `score`、`confidence`、`probabilities` 和 `legend`。SDK 用整数等级而不是字符串来做 `probabilities` 和 `legend` 的键。

## 怎么读 Score {#reading-a-score}

来看分数如何随不同输入变化。以上面请求里的问题和等级为例：

```
"How severe is the reported issue?"
  → 0: Cosmetic; no impact to functionality
  → 1: Broken or degraded feature, but workaround exists
  → 2: Blocking issue; no workaround exists
```

不同缺陷报告会怎样改变分数：

| State | `score` | `confidence` | 等级 0 | 等级 1 | 等级 2 |
| --- | --- | --- | --- | --- | --- |
| The export button is misaligned by a few pixels on the settings page. | 0.0 | 1.0 | 1.0 | 0.0 | 0.0 |
| The PDF export button does nothing when clicked. I can still export to CSV and convert it myself, but that takes ages. | 1.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| Export to PDF fails with a spinner that never finishes. Some of our team say CSV export still works for them, others say it fails too. | 1.11 | 0.84 | 0.0 | 0.89 | 0.11 |
| The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari. | 1.43 | 0.35 | 0.0 | 0.57 | 0.43 |
| Nobody on our team can log in since this morning. We get a 500 error on every attempt. | 2.0 | 1.0 | 0.0 | 0.0 | 1.0 |

这些例子里，置信度 1.0 表示返回的分布把全部概率放在一个等级上。它描述的是模型的答案，并不保证答案正确。

分数是等级编号的概率加权均值。第三、四个例子里，概率在等级 1 和 2 之间分裂。等级 2 上的权重越大，分数越高。它并不测量没有变通办法的客户占比。

不同分布可以产生同一个分数。分数 1.0 可能表示全部概率在等级 1 上，也可能表示等级 0 和 2 各占一半。把 `probabilities` 和 `confidence` 和分数一起看，才能区分这些情况。

带小数的分数是一个位置。你可以拿它按严重度给报告排序，或者在代码需要一个结果时四舍五入到最近的等级。我们的 [实体对齐食谱](/cookbooks/entity_alignment) 展示了四舍五入到最近等级再做决策的例子。

Score 上的低置信度通常意味着三件事之一：对这些 state 来说等级有重叠、问题在同时测量不止一件事、或者 state 说得不够、没法落点。如何在代码里使用它，见 [Confidence](/confidence)。

## 写好等级 {#writing-good-levels}

描述情形，不要描述程度。「功能损坏或降级，但有变通办法」给模型一个可以和 state 对照的东西。「中等严重」没有。具体描述能帮助模型区分等级。用已知例子核对答案；单靠更高的置信度并不能说明一段描述更好。

每个等级都单独评估。模型看不到等级编号，也看不到相邻等级，所以「比上一级更差」对它毫无意义，描述或 instructions 里的数字也帮不上忙。下面是等级只有数字时，对上表里「按钮没对齐」那份报告会发生什么：

```
instructions: "Rate severity from 0 to 2, where 2 is worst"
criteria: ["0", "1", "2"]
→ score 0.55, confidence 0.33, probabilities 0: 0.45, 1: 0.55, 2: 0.0
```

同一份报告配上三段描述性等级，分数是 0.0，置信度 1.0。只有数字时，模型没有可以对照的东西，就把概率摊在 0 和 1 之间。

能清楚区分的等级能写多少写多少，最多 10 个。三个也完全可以。写不出清楚区别的等级就不要加。

每个 Score 问题只测一个维度。如果一段描述说「守时而且聪明而且有经验」，这个问题在同时测三件事，一份在其中一项上高、另一项上低的输入就落不了点。置信度下降，分数的意义也变弱。拆成一件事一个 Score，再在代码里组合，下一节会展示。

如果量表顶端有一个少见的极端情形、你需要区别对待，就给它单独一档。以「非常愤怒」结尾的情绪量表，可以再加「辱骂或威胁」。没有这一档，两类消息都可能拿到接近顶端的分数。单靠分数可能分不开它们。

如果中间态根本不存在，答案是几个离散类别中的一个，就改用 [Choice](/primitives/choice)，或拆成若干 [Noul](/primitives/noul)。用你自己的数据测试等级很重要。同一把尺的两种措辞，在你的数据上可能表现不同。

## 把复杂判断拆成若干 Score {#splitting-a-complex-judgment-into-several-scores}

复杂判断，也就是依赖好几件事的判断，最好一件事一个 Score。然后在代码里把 TypeSafe 返回的 Score 组合起来做判断。有些 Score 可能比另一些更重要，所以按相对重要性给每个 Score 一个权重。权重由你定。合成结果和团队会做的决定对不上时，改代码里的权重再跑一遍。把这些 Score 放进一次请求。它们并行评估。多加几个问题几乎不改变响应时间，只多花几个问题 token；见 [一次问多个问题](/primitives#ask-multiple-questions-together)。

下面这次请求是上表里那张转圈工单，加了一些上下文。它问三个 Score：缺陷有多严重、客户有多沮丧、报告给工程师多少可下手的信息。

```json
{
  "state": "Export to PDF fails with a spinner that never finishes. Some of our team say CSV export still works for them, others say it fails too. This is the third time I'm writing in and honestly I'm done. Steps: open any report, click Export, choose PDF. Chrome 128 on macOS.",
  "model": "jev-latest",
  "questions": {
    "severity": {
      "type": "score",
      "instructions": "How severe is the reported issue?",
      "criteria": [
        "Cosmetic; no impact to functionality",
        "Broken or degraded feature, but workaround exists",
        "Blocking issue; no workaround exists"
      ]
    },
    "frustration": {
      "type": "score",
      "instructions": "How frustrated is the customer?",
      "criteria": [
        "Calm, just stating facts",
        "Frustrated but civil",
        "Very angry, strong language or threatening to leave"
      ]
    },
    "report_quality": {
      "type": "score",
      "instructions": "How much does the report give an engineer to work with?",
      "criteria": [
        "No detail; just says something is broken",
        "Names the feature but no steps or environment",
        "Steps to reproduce or environment, but not both",
        "Steps to reproduce and environment"
      ]
    }
  }
}
```

TypeSafe 的响应：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "severity": {
      "type": "score",
      "score": 1.24,
      "confidence": 0.64,
      "legend": {
        "0": "Cosmetic; no impact to functionality",
        "1": "Broken or degraded feature, but workaround exists",
        "2": "Blocking issue; no workaround exists"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.76,
        "2": 0.24
      }
    },
    "frustration": {
      "type": "score",
      "score": 1.28,
      "confidence": 0.58,
      "legend": {
        "0": "Calm, just stating facts",
        "1": "Frustrated but civil",
        "2": "Very angry, strong language or threatening to leave"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.72,
        "2": 0.28
      }
    },
    "report_quality": {
      "type": "score",
      "score": 3.0,
      "confidence": 1.0,
      "legend": {
        "0": "No detail; just says something is broken",
        "1": "Names the feature but no steps or environment",
        "2": "Steps to reproduce or environment, but not both",
        "3": "Steps to reproduce and environment"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.0,
        "2": 0.0,
        "3": 1.0
      }
    }
  },
  "usage": {
    "input_tokens": 468,
    "output_tokens": 43
  }
}
```

每个问题都单独对着工单作答并给出分数：

* `severity` 是 1.24，置信度 0.64。读法和开头的例子一样：导出坏了，一部分人有变通办法。
* `frustration` 是 1.28，置信度 0.58。措辞还算礼貌，但「第三次」和「I'm done」把一部分分数推向最高档，所以模型在「沮丧但文明」和「非常愤怒」之间按 0.72 和 0.28 分裂。对这张工单，这两个等级有重叠，所以置信度中等。
* `report_quality` 是 3.0，置信度 1.0。步骤和浏览器版本都写了。

三把尺长度不同，所以组合之前先把每个分数归一化。四档量表返回 0 到 3，三档返回 0 到 2，一把尺的满分比另一把大。用每个分数除以它的最高等级编号 `len(criteria) - 1`，把每个分数放到 0 到 1。这样权重才名副其实：严重度 0.6、沮丧程度 0.3，表示严重度算两倍。

下面的 TypeSafe Python SDK 代码问这三个问题，归一化每个分数，再用一个示例优先级公式组合：

```python
from typesafe_sdk import Score, TypeSafeClient

TRIAGE_QUESTIONS = {
    "severity": Score(
        instructions="How severe is the reported issue?",
        criteria=[
            "Cosmetic; no impact to functionality",
            "Broken or degraded feature, but workaround exists",
            "Blocking issue; no workaround exists",
        ],
    ),
    "frustration": Score(
        instructions="How frustrated is the customer?",
        criteria=[
            "Calm, just stating facts",
            "Frustrated but civil",
            "Very angry, strong language or threatening to leave",
        ],
    ),
    "report_quality": Score(
        instructions="How much does the report give an engineer to work with?",
        criteria=[
            "No detail; just says something is broken",
            "Names the feature but no steps or environment",
            "Steps to reproduce or environment, but not both",
            "Steps to reproduce and environment",
        ],
    ),
}

def normalized(answers, question_id: str) -> float:
    """用最高等级编号去除，把分数放到 0 到 1。"""
    top_level = len(TRIAGE_QUESTIONS[question_id].criteria) - 1
    return answers[question_id].score / top_level

def priority(ticket: str) -> float:
    with TypeSafeClient() as client:
        response = client.system_one(
            state=ticket,
            questions=TRIAGE_QUESTIONS,
        )
    answers = response.answers

    severity = normalized(answers, "severity")
    frustration = normalized(answers, "frustration")
    report_quality = normalized(answers, "report_quality")

    # 详细的报告帮工程师调查，所以稍微提高优先级。
    return 0.6 * severity + 0.3 * frustration + 0.1 * report_quality
```

对上面的示例响应，归一化后的分数是严重度 0.62、沮丧程度 0.64、报告质量 1.0。优先级是 `0.6 × 0.62 + 0.3 × 0.64 + 0.1 × 1.0 = 0.664`，四舍五入为 `0.66`。

权重写在你的代码里，所以你能看清这个数字到底怎么来的；排序和团队会做的决定对不上时，也可以改它。以后如果还需要更多 Score，把它们加进 `TRIAGE_QUESTIONS`。请求次数仍是一次。把复杂判断拆成独立 Score、再在代码里用权重组合，这种做法叫做 [组合评分](/patterns/composite-scoring) 模式。

## 结构化等级描述 {#structured-level-descriptions}

每个等级先从一段基本文字描述开始。当模型在你觉得很清楚的输入上总是打在相邻两档之间时，给每个等级一个对象而不是字符串，一个字段写这个等级覆盖什么，一个字段放几个示例情形。每个等级用同样的字段名，模型才能像对像地比较。

下面这次请求还是前面那张转圈工单，但每个等级带了例子：

```json
{
  "state": "Export to PDF fails with a spinner that never finishes. Some of our team say CSV export still works for them, others say it fails too.",
  "model": "jev-latest",
  "questions": {
    "bug_severity": {
      "type": "score",
      "instructions": "How severe is the reported issue?",
      "criteria": [
        {
          "what": "Cosmetic; no impact to functionality",
          "examples": ["typo in a label", "misaligned icon"]
        },
        {
          "what": "Broken or degraded feature, but workaround exists",
          "examples": ["export fails in one browser but works in another"]
        },
        {
          "what": "Blocking issue; no workaround exists",
          "examples": ["cannot log in", "data loss"]
        }
      ]
    }
  }
}
```

响应：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "bug_severity": {
      "type": "score",
      "score": 1.09,
      "confidence": 0.87,
      "legend": {
        "0": {
          "what": "Cosmetic; no impact to functionality",
          "examples": [
            "typo in a label",
            "misaligned icon"
          ]
        },
        "1": {
          "what": "Broken or degraded feature, but workaround exists",
          "examples": [
            "export fails in one browser but works in another"
          ]
        },
        "2": {
          "what": "Blocking issue; no workaround exists",
          "examples": [
            "cannot log in",
            "data loss"
          ]
        }
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.91,
        "2": 0.09
      }
    }
  },
  "usage": {
    "input_tokens": 379,
    "output_tokens": 18
  }
}
```

用纯字符串时这张工单打了 1.11，置信度 0.84。带例子后打 1.09，置信度 0.87，小幅偏移，因为纯字符串已经把它放得不错。当纯字符串让模型分裂时，效果会更大，如下表。

例子会引导模型，而且只有看起来像你的真实输入时才有用。下表是开头那份 Safari 报告，配三套不同的等级对象：

| 等级描述 | `score` | `confidence` |
| --- | --- | --- |
| 纯字符串：没有带例子的对象 | 1.43 | 0.35 |
| 加上有用的 examples 数组："export fails in one browser but works in another" | 1.03 | 0.96 |
| 加上和浏览器无关的 examples 数组："search fails, but browsing categories still works" | 1.43 | 0.35 |

在这组对照里，匹配的例子几乎把全部概率集中到一个等级上。无关的例子返回和纯字符串一样的结果。更高的置信度并不能证明哪个答案正确。用已知期望等级来选例子，再在另外的输入上测试改过的描述，然后再留下它们。
