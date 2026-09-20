# 自洽：Choice

> 给审核决策加一个不确定出口，并对照标签一致率与自动动作比例。

## 问题

一条卡在边界上的用户帖，8 个 Choice 审核量表，每种条件重复 15 次。标签就是路由：删还是留、升级还是自动结、送威胁 / 垃圾 / 普通队列。标签一次一变，同一条帖就会无故走不同路径。

对照与 [自洽：Noul](/cookbooks/consistency_noul_cookbook) 相同：非推理 LLM（温度 0 与默认）、推理 LLM、以及 TypeSafe 一次 `system_one` 回答全部 8 个 Choice，每次带新 `uid`。

## 架构

8 个互斥 Choice 同一次调用。应用层再要求最高概率至少 `0.60`，否则标 `uncertain` 送人工。

```mermaid
%%{init: {"fontFamily": "IBM Plex Sans, Noto Sans SC, sans-serif", "flowchart": {"rankSpacing": 28, "wrappingWidth": 240}}}%%
flowchart LR
    post["边界帖 JSON"] --> call["一次 system_one<br/>8 个 Choice"]
    call --> lab["每题一个标签 + 分布"]
    lab --> gate{"最高概率 ≥ 0.60？"}
    gate -->|"是"| auto["自动动作"]
    gate -->|"否"| human["uncertain → 人工"]
```

## 结论

标签会在同一条件内翻转，TypeSafe 也会。LLM 分布设置把多数标签重复 87.5%–100%；TypeSafe 是 90.8%。TypeSafe 的均值概率抖动低于 6 个 LLM 分布条件中的 5 个；Haiku 温度 0 更稳。接近的概率仍会改路由：TypeSafe 在 8 题里翻了 2 题。

加上 `0.60` 门槛后，TypeSafe 一致率升到 99.2%，74.2% 的答案仍走自动标签。

| 条件 | 每次耗时 | 每次费用 | 相对 TypeSafe 时延 | 相对费用 |
| --- | --- | --- | --- | --- |
| claude-haiku-4-5 t=0 | 3853ms | $0.003498 | 33.8× | 76.1× |
| gpt-5.4-mini t=0 | 2293ms | $0.002299 | 20.1× | 50.0× |
| gpt-5.5-reasoning | 12978ms | $0.041255 | 113.7× | 897.4× |
| typesafe_choice | 114ms | $0.000046 | 1.0× | 1.0× |

`jev-latest`，2026-09-11 采样。

## 关键代码

每个 Choice 有固定、互斥的标签集。TypeSafe 返回选中的 `choice` 和整份 `probabilities`。

```python
QUESTIONS = {
    "action": (
        "What enforcement action should be taken on this post?",
        {
            "Allow": "Leave the post up with no action.",
            "Warn": "Leave the post up but attach a warning label.",
            "Remove": "Remove the post, but do not penalize the account.",
            "Strike": "Remove the post and add a strike to the account.",
            "Escalate": "Take no automated action; hold for a human decision.",
        },
    ),
    "severity": (
        "What is the overall severity of this post?",
        {
            "None": "No violation.",
            "Low": "Rude or dismissive, but essentially harmless.",
            "Medium": "Personal harassment with no clearly credible threat.",
            "High": "Harassment together with a threat that could be read as credible.",
        },
    ),
}
MIN_CHOICE_PROBABILITY = 0.60
```

消费答案时：看选中标签，再用最高概率决定是否自动执行。低于 0.60 就标 `uncertain`，不把接近的分布硬切成动作。

完整实验与数据见官网原文：[自洽：Choice](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook)
