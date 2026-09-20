# Noul

> Noul 问题让 TypeSafe 模型评估一个是/否问题，并返回答案为 yes 的概率。

当答案是是或否时，用 Noul。例如这条消息有没有要求退款、这份简历有没有提到分布式系统、这条评论有没有包含个人数据。如果答案是若干选项中的一项，用 [Choice](/primitives/choice)。如果是谱上的一个位置，用 [Score](/primitives/score)。三种类型的对比见 [选择问题类型](/primitives#choose-a-question-type)。

Noul 答案是一个数字，表示答案为 yes 的概率：0 表示 no，1 表示 yes。

## 请求结构 {#request-structure}

发往 [TypeSafe API](/api) 的 POST 请求体和其他问题类型一样，顶层三个字段：`state`，要评估的内容；`model`；以及 `questions`。每个 Noul 问题有这些字段：

* `type`：始终是 `"noul"`。
* `instructions`：模型要回答的是/否问题，或让它判断的陈述。
* `criteria`：可选。带 `true` 和 `false` 描述的对象，说明 yes 和 no 分别意味着什么。

下面这次请求里，state 是一条客服消息，两个问题分别是客户是否想找人、以及是否以前联系过客服：

```json
{
  "state": "I have asked three times now. Can I please just talk to a real person?",
  "model": "jev-latest",
  "questions": {
    "is_human_escalation": {
      "type": "noul",
      "instructions": "Is the customer asking for a human agent?"
    },
    "is_repeat_contact": {
      "type": "noul",
      "instructions": "Has the customer contacted support about this before?",
      "criteria": {
        "true": "Mentions a prior attempt, ticket, or that they have asked before",
        "false": "No sign of any previous contact"
      }
    }
  }
}
```

问题 id 由你选，这里是 `is_human_escalation` 和 `is_repeat_contact`。id 不会发给模型。每个答案会在同一个 id 下返回。第一个问题只靠 `instructions`。第二个加上 `criteria`，说明什么算 yes、什么算 no。

用 [Python SDK](/sdk/python) 时，同样的问题是 `Noul` 对象：

```python
from typesafe_sdk import Noul, NoulCriteria, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        model="jev-latest",
        state="I have asked three times now. Can I please just talk to a real person?",
        questions={
            "is_human_escalation": Noul(
                instructions="Is the customer asking for a human agent?",
            ),
            "is_repeat_contact": Noul(
                instructions="Has the customer contacted support about this before?",
                criteria=NoulCriteria(
                    true="Mentions a prior attempt, ticket, or that they have asked before",
                    false="No sign of any previous contact",
                ),
            ),
        },
    )

    print(response.answers["is_human_escalation"].noul)
    print(response.answers["is_repeat_contact"].noul)
```

`system_one` 方法和 `https://api.typesafe.ai/v1/systemone` 端点都以 [System One](/concepts/system-one) 命名，也就是 TypeSafe 的 AI 模型。在代码里哪里用它，见 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

如果用编码智能体，先安装 [TypeSafe agent skill](/agent-skill#installation)，让它知道请求和响应的形状。

> `instructions` 可以是字符串、对象或数组。从字符串开始。当问题需要附带数据时再用对象，例如用来和 state 对照的一条记录，或者问题的一部分由代码生成。[在问题里使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions) 说明结构何时有帮助，[下面的例子](#structured-instructions) 展示用代码构建的问题。

## 响应结构 {#response-structure}

响应在 `answers` 里为每个问题留一条，键是请求里的 id：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "is_human_escalation": {
      "type": "noul",
      "noul": 0.99
    },
    "is_repeat_contact": {
      "type": "noul",
      "noul": 0.93
    }
  },
  "usage": {
    "input_tokens": 360,
    "output_tokens": 39
  }
}
```

这里两个答案都接近 1。客户说 "talk to a real person"，所以 `is_human_escalation` 是 0.99。"I have asked three times now" 匹配 `is_repeat_contact` 的 `true` 描述，所以是 0.93。

## 怎么读 Noul {#reading-a-noul}

这个数字同时是答案和确定性。接近 1 是强 yes。接近 0 是强 no。接近 0.5 表示模型给 yes 和 no 相近的概率。

下表是 `jev-1.13.0` 对 `is_human_escalation` 问题、不同客户消息的实测答案：

| State | `noul` |
| --- | --- |
| Thanks, that fixed it! | 0.02 |
| How do I reset my password? | 0.07 |
| I need this sorted today, whatever it takes. | 0.26 |
| Are you a bot? | 0.40 |
| Is there any way to speak to someone about my invoice? | 0.84 |
| I have asked three times now. Can I please just talk to a real person? | 0.99 |

前两条和后两条很清楚。"I need this sorted today" 很急但从未要求找人，得到 0.26。"Are you a bot?" 暗示想找人但没有直接要求，模型几乎均分，0.40。这两类消息都需要你在代码里用阈值做决策。

Noul 没有单独的 `confidence`，这一点和 [Choice](/primitives/choice)、[Score](/primitives/score) 不同。Noul 的概率分布只有两个结果，yes 和 no，所以单个 `noul` 值就能完整描述它。Choice 或 Score 把概率摊在若干选项或等级上，`confidence` 概括那种分散程度。

最常见的做法是把 `noul` 用阈值变成布尔值：

```python
wants_human = response.answers["is_human_escalation"].noul > 0.9

if wants_human:
    route_to_agent(ticket)
else:
    route_to_bot(ticket)
```

阈值设在哪里，取决于做错的代价。yes 和 no 都同样好处理时用 0.5。对假 yes 采取行动很贵时（例如呼叫某人或发出退款）就提高它。漏掉真 yes 很贵时（例如没标出安全问题）就降低它。中间的值可以交给人，而不是走任何一条代码路径。这和 [Confidence](/confidence#three-paths-for-using-confidence-in-your-code) 页对 Choice 和 Score 答案描述的三路拆分是同一套。

Noul 取值从 0 到 1，但它不是你所问之事的量表。它是答案为 yes 的概率。如果问题其实在问程度，这个值并不测量程度。下面把「这位候选人 Python 强吗？」问了四位候选人，旁边是一个带四档的 [Score](/primitives/score)：没有经验、略有了解、工作中常规使用、深厚专长。

| 候选人 | Noul：「这位候选人 Python 强吗？」 | Score：「这位候选人有多少 Python 经验？」 |
| --- | --- | --- |
| My experience is in Java and Go. I have not used Python. | 0.03 | 0.0（没有经验） |
| I have used Python occasionally for small scripts alongside my main Java work. | 0.14 | 1.0（略有了解） |
| I used Python every day for two years in my last job, mostly data pipelines. | 0.81 | 2.05（工作中常规使用） |
| I have written Python daily for eight years, including maintaining a large Django codebase. | 0.92 | 2.89（深厚专长） |

Noul 判断的是一个命题「强」，取值是它有多可能。你可以在代码里把 0 到 1 切成几档，例如 0.3 到 0.7 表示「有一些经验」，但模型看不到这些档，所以答案里没有任何东西是对着它们判断的。中间值可能表示中等经验，也可能表示说不清；候选人之间的间距也不是你选的。Score 单独判断每一档描述，所以每位候选人都落在或靠近你写的某一档，返回的概率还显示模型如何在各档之间分配判断。如果不同意，改一档的措辞再跑一遍。区别见 [选择问题类型](/primitives#choose-a-question-type)。

## 写好 Noul 问题 {#writing-a-noul-question}

每个 Noul 只问一个是/否问题。如果一个问题有两个条件，例如「客户既愤怒又在要求退款吗？」，模型必须同时判断两件事，这个值的意义就变弱。问两个 Noul，再在代码里组合。

把问题写成：高值表示 yes。「消息里有个人数据吗？」很清楚。「消息里没有个人数据吗？」把含义反转了，后面读它的代码会搞反。

陈述和问句一样好用。对「客户正在要求退款」，接近 1 表示这句话为真。用你自己的数据两种写法都试一试，看哪种更好。

把 yes 和 no 的边界写清楚。「这位候选人有没有任何 Python 经验？」效果好，因为「任何」不留中间地带。边界很细时，加上带 `true` 和 `false` 描述的 `criteria`，就像上面的 `is_repeat_contact`。大多数 Noul 只靠 instruction 就够，所以带着和不带 `criteria` 都试一遍，留下在你的文档上答案更好的那种。

## 好习惯：一次调用问多个问题 {#good-practice-ask-more-than-one-question-per-call}

对一份条件清单，在一次请求里问许多 Noul：一个条件一个问题，由代码决定组合意味着什么。问题并行评估，所以多加几个 Noul 几乎不改变响应时间。更完整的说明见 [一次问多个问题](/primitives#ask-multiple-questions-together)。

## 在代码里处理多个 Noul 答案 {#handling-multiple-noul-answers-in-code}

上面那个两问题请求已经够代码用来路由消息。下面的例子在客户要求找人时升级给人工，以前联系过时提高优先级。任一问题上的中间值都交给审核人，而不是走代码路径：

```python
from typesafe_sdk import Noul, NoulCriteria, TypeSafeClient

SUPPORT_QUESTIONS = {
    "is_human_escalation": Noul(
        instructions="Is the customer asking for a human agent?",
    ),
    "is_repeat_contact": Noul(
        instructions="Has the customer contacted support about this before?",
        criteria=NoulCriteria(
            true="Mentions a prior attempt, ticket, or that they have asked before",
            false="No sign of any previous contact",
        ),
    ),
}

YES = 0.8
NO = 0.2

def route(message: str) -> None:
    with TypeSafeClient() as client:
        response = client.system_one(
            model="jev-latest",
            state=message,
            questions=SUPPORT_QUESTIONS,
        )
    answers = response.answers

    wants_human = answers["is_human_escalation"].noul
    repeat = answers["is_repeat_contact"].noul

    if NO < wants_human < YES or NO < repeat < YES:
        # 模型两边都不确定。交给人来决定。
        send_to_review(message)
        return

    priority = "high" if repeat > YES else "normal"
    if wants_human > YES:
        route_to_agent(message, priority=priority)
    else:
        route_to_bot(message, priority=priority)
```

对上面那条消息，`is_human_escalation` 的 noul 是 0.99，`is_repeat_contact` 是 0.93，所以代码以高优先级路由给坐席。"How do I reset my password?" 在两个问题上都是 0.07，路由给机器人。

阈值写在你的代码里。如果审核人看到的消息太多，就缩小 `NO` 和 `YES` 之间的间隔。如果错误路由太多，就拉宽它。以后如果还需要知道消息有没有提到付款，或有没有个人数据，往 `SUPPORT_QUESTIONS` 再加一个 Noul。请求次数仍是一次。

## 结构化 instructions {#structured-instructions}

`instructions` 可以是对象而不是字符串，把问题放在一个字段，补充数据放在其他字段。何时这样做，见 [在问题里使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。这里用在一个由代码构建的问题上：刚到的一份简历，要和候选人库里可能是同一个人的记录对照。每条记录原样放进 `potential_duplicate` 字段，`question` 对每条记录都一样，所有记录在一次请求里检查。代码生成的问题键包含每条记录的数据库 ID：

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
        "potential_duplicate": { "name": "Jon Smith", "location": "Oakland, CA", "last_employer": "Google" },
        "question": "Is the resume for the same person as `potential_duplicate`?"
      }
    },
    "same_as_record_42": {
      "type": "noul",
      "instructions": {
        "potential_duplicate": { "name": "John Smith", "location": "Austin, TX", "last_employer": "Lone Star Freight" },
        "question": "Is the resume for the same person as `potential_duplicate`?"
      }
    },
    "same_as_record_77": {
      "type": "noul",
      "instructions": {
        "potential_duplicate": { "name": "John Smithers", "location": "Oakland, CA", "last_employer": "Bay Health Clinic" },
        "question": "Is the resume for the same person as `potential_duplicate`?"
      }
    }
  }
}
```

响应：

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "same_as_record_18": {
      "type": "noul",
      "noul": 0.74
    },
    "same_as_record_42": {
      "type": "noul",
      "noul": 0.09
    },
    "same_as_record_77": {
      "type": "noul",
      "noul": 0.08
    }
  },
  "usage": {
    "input_tokens": 535,
    "output_tokens": 58
  }
}
```

每个答案是简历属于那条记录里那个人的概率。记录 18 名字拼写不同，但地点和雇主匹配，得到 0.74。记录 42 同名、不同城市、不同雇主，得到 0.09。记录 77 名字相近、地点相同、雇主不同，得到 0.08。在代码里给每个值设阈值，做法见 [在代码里处理多个 Noul 答案](#handling-multiple-noul-answers-in-code)，把中间值交给人。

用 Python SDK 时，问题从候选人记录构建。问题文本固定，记录在变：

```python
from typesafe_sdk import Noul, TypeSafeClient

SAME_PERSON = "Is the resume for the same person as `potential_duplicate`?"

def duplicate_questions(candidates: list[dict]) -> dict[str, Noul]:
    """每个候选人记录一个 Noul，问的都是同一个问题。"""
    return {
        f"same_as_record_{candidate['id']}": Noul(
            instructions={
                "potential_duplicate": {
                    "name": candidate["name"],
                    "location": candidate["location"],
                    "last_employer": candidate["last_employer"],
                },
                "question": SAME_PERSON,
            },
        )
        for candidate in candidates
    }

def find_duplicates(resume: dict, candidates: list[dict]) -> list[str]:
    with TypeSafeClient() as client:
        response = client.system_one(
            model="jev-latest",
            state={"resume": resume},
            questions=duplicate_questions(candidates),
        )
    return [
        question_id
        for question_id, answer in response.answers.items()
        if answer.noul > 0.7
    ]
```

[结构化数据抽取级联食谱](/cookbooks/sde_cascade) 用结构化 instructions 校验抽出来的记录。每个字段拿到同一组问题。每个问题的 `instructions` 对象把问题文本放在 `main_question` 属性里，还有随字段变化的 `field_spec` 和 `extracted_field`。

## 食谱里的 Noul {#noul-in-the-cookbooks}

看看这些用 Noul 问题的应用食谱：

* [并行问题](/cookbooks/parallel_questions) 在一次请求里对一篇文章跑 13 个监管清单问题。
* [自洽：Noul](/cookbooks/consistency_noul_cookbook) 用 15 问量表给一份保险理赔打分，并测量跨次运行取值有多稳。
* [重排序](/cookbooks/rerank_typesafe) 直接用概率本身，而不是阈值：每个查询-候选对一个 Noul，再按取值给候选排序。
* [逐行检索](/cookbooks/semantic_find) 把找到匹配行的 Choice 和一个检查文档里到底有没有答案的 Noul 配对。
* [结构恢复](/cookbooks/autoformat) 对每一对相邻行问一个 Noul——换行是不是把句子拆开了——从而从纯文本重建段落。
