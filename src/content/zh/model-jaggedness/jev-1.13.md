# Jev 1.13 锯齿

> Jev 并不完美。下面是 `jev-1.13` 已知的毛边。很多会在后续版本修掉。

> **适用于 `jev-1.13`。** 最近审阅 2026-09-17。

`jev-1.13` 快、校准好、常识判断强，但不是万能的。它最擅长 [System One](/concepts/system-one) 任务。需要多层间接的任务会吃力。理解偏字面。需要数字精度的任务也不行。

## 失败模式一览

| # | 失败模式 | 改这样做 |
| --- | --- | --- |
| 1 | [字面阅读](#literal-reading) | 把条件写死，每个选项都给标准 |
| 2 | [数学和数字](#math-and-numbers) | 算术放在代码里 |
| 3 | [日期时间比较](#date-and-time-comparison) | 抽部件，比较放代码 |
| 4 | [间接](#indirection) | 减少跳转，指到相关 state |
| 5 | [一大坨无关细节的 state](#large-state) | 先过滤，只送问题需要的 |
| 6 | [对抗内容](#adversarial) | 提示写精确，上线前测边角 |
| 7 | [互相打架的 instruction 和 criteria](#contradictory) | 把标准和问题对齐 |
| 8 | [常识性结构不变量](#invariants) | 每个决策只问一种问法，恒等式用代码强制 |
| 9 | [生成](#generation) | 用生成模型 |

## 字面阅读 {#literal-reading}

`jev-1.13` 回答你写下来的问题，不是你心里那个。范围词、否定、暗示条件都按字面读。人会读意图，它读的是 instruction 里的词。

**改这样：** 在 `instructions` 里写精确条件。把边界案例放进 criteria。看到错答案时，你用来解释「我其实想问的是」的那句话，就是 instruction 缺的那一半。解释不可避免时，拆成两个字面问题，在代码里组合。

## 数学和数字 {#math-and-numbers}

Jev 不是计算器。数学逻辑请放代码。它更擅长语义问题，不擅长数学问题。

### 计数

`jev-1.13` 计数不可靠：词里的字符、段落里某词出现几次、长列表有几项。它认的是答案的「样子」，不是在数，东西越大错得越多。

问计数问题之前，先问：这还需要模型吗？正则或解析器能找到的单位，计数属于代码。

**改这样：** 在代码里数。要数符合某标准的项，对每个候选各问一次，再自己把答案加起来。

```python
from typesafe_sdk import Noul, TypeSafeClient

client = TypeSafeClient(model="jev-1.13")
YES = 0.5  # up to you on what you want the threshold to be, depends on your usecase.

items = ["typesafe", "apple", "california", "banana", "likes", "calibration", "orange", "vertex"]

result = client.system_one(
    {"items": items},
    {
        f"item_{i}": Noul(instructions=f"Is `items[{i}]` the name of a fruit?")
        for i in range(len(items))
    },
)

count = sum(result.nouls[f"item_{i}"].noul > YES for i in range(len(items)))
```

### 数字表示

语义表示比数字表示好。问颜色用英文名，比用 hex 强。给 RGB 或 hex，它不能可靠判断两个值靠不靠近。

同理，高级语言的问题好过汇编或二进制指令。

**改这样：** 转换放代码，传入算好的数或命名分桶。模型只做真正是判断的那部分，比如这个颜色算不算警告色。

### 用 Score 做数学

不要用 Score 的期望或概率，去在两档之间反推精确数值。期望可以拿来过阈值，但 `jev-1.13` 的分数档在数值校准上弱，插值还原不出精确数字。

## 日期时间比较 {#date-and-time-comparison}

`jev-1.13` 把日期当文本读，不当有序量。问哪个日期在前、隔多远、是否落在窗口里，都不可靠。格式混用、相对指称、季度/结算窗/计提期这类领域边界会更差。

**改这样：** 拆开。抽取是判断，给模型。算术不是，留在代码。

日期的每一部分都是小闭集：十二个月、最多三十一天、有界的年份。抽取变成带枚举选项的 [Choice](/primitives/choice)，还可以显式放「未写明」，缺的部分被报告而不是被猜。代码把部件拼成真正的 `date`，之后的排序、时长、偏移、星期全归代码。

完整做法见 [日期抽取](/cookbooks/date_extraction_cookbook)，包括相对日期和置信度门控。

## 间接 {#indirection}

「根据政策第三节，对照用户上周的那封邮件……」这种跳转它吃力。问题离 state 里真正要评的那一段越远，越容易评错对象。

**改这样：** 把相关片段放进 state，问题直接指过去。能少一跳就少一跳。

## 一大坨无关细节的 state {#large-state}

上下文越长、无关内容越多，目标判断越容易被带偏。64k 的预算不是「把整份知识库塞进去」的理由。

**改这样：** 先过滤。只送这个问题需要的字段、段落、记录。见 [State](/concepts/state) 和 [投机扇出](/patterns/fan-out)。

## 对抗内容 {#adversarial}

提示注入、角色扮演、指令覆盖，它没有生成模型那么多对齐层。别指望它当防火墙，除非你按 [LLM 护栏](/cookbooks/llm_guardrails) 那样专门出题。

**改这样：** 问题写精确。上线前用对抗样本测。高风险动作必须过 [置信度门控](/patterns/confidence-routing)。

## 互相打架的 instruction 和 criteria {#contradictory}

instruction 说「选最紧急的」，criteria 里最紧急的选项描述却在谈金额，模型会卡住或随便挑一个。

**改这样：** 每条标准都直接回答 instruction 里的问题。改了一边，检查另一边。

## 常识性结构不变量 {#invariants}

互斥、总和为 1、父子包含这类恒等式，不要指望模型替你维持。两个 Noul 问「是 A」「是 B」，即使 A 和 B 互斥，两个概率加起来也不保证 ≤ 1。

**改这样：** 互斥的东西用一个 Choice。必须同时问时，用代码强制恒等式。

## 生成 {#generation}

Jev 不写回复、不写代码、不解释推理。要生成文本，用生成模型。TypeSafe 负责窄决策，LLM 负责需要写出来的那一段。见 [智能家居助手](/demos/smart-home) 的回退路径。
