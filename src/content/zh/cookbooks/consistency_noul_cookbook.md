# 自洽：Noul

> 把不确定的概率交给人工审核，同时保留底层 noul 值可见。

## 问题

一份车险理赔，14 条 Noul 量表，每种条件重复 15 次。每条答案是 P(true)。理赔分拣要把案子分成赔、拒、送人；阈值附近一点点抖动就会改动作。

对照条件包括：非推理 LLM（`claude-haiku-4-5`、`gpt-5.4-mini`，温度 0 与默认）、同一模型的是/否硬切、推理 LLM（`gpt-5.5`、`claude-opus-4-8`），以及 TypeSafe 一次 `system_one` 回答全部 14 个 Noul。每次请求加一个一次性 `uid`，理赔与量表不变。

## 架构

14 个 Noul 同一次调用。代码再把 0.30–0.70 的概率映射成 `uncertain`，交给人工；原始 noul 仍印在决策下面。

```mermaid
%%{init: {"fontFamily": "IBM Plex Sans, Noto Sans SC, sans-serif", "flowchart": {"rankSpacing": 28, "wrappingWidth": 240}}}%%
flowchart LR
    claim["车险理赔 JSON"] --> call["一次 system_one<br/>14 个 Noul"]
    call --> p["每个问题一个 noul"]
    p --> gate{"0.30 ≤ noul ≤ 0.70？"}
    gate -->|"否"| auto["自动：是 / 否"]
    gate -->|"是"| human["人工审核"]
    p -.->|"原始概率仍可见"| human
```

## 结论

LLM 答案每次都会动，温度 0 也一样，判断题上模型还会和自己打架。TypeSafe 每题概率标准差均值是 `0.0102`，低于这里所有 LLM 概率条件。`covered` 的答案跨 `0.43` 到 `0.53`，正好跨过 0.5 决策线——所以要把中间带标成不确定，而不是硬切是/否。

| 条件 | 每次耗时 | 每次费用 | 相对 TypeSafe 时延 | 相对费用 |
| --- | --- | --- | --- | --- |
| claude-haiku-4-5 t=0 | 1780ms | $0.001798 | 16.0× | 42.2× |
| gpt-5.4-mini t=0 | 1405ms | $0.001089 | 12.7× | 25.6× |
| gpt-5.5-reasoning | 11125ms | $0.033157 | 100.2× | 778.9× |
| typesafe_noul | 111ms | $0.000043 | 1.0× | 1.0× |

`jev-latest`，2026-09-11 采样。`uid` 扰动无法把「对无关字段敏感」和「相同请求上的自然抖动」分开。

## 关键代码

量表：是 = 正在检查的那件事为真，这样每行的概率可比。

```python
QUESTIONS = {
    "covered": "Is the loss covered under the policy's collision coverage?",
    "exclusion": "Does a policy exclusion apply to this loss?",
    "on_circuit": "Did the collision happen while the vehicle was being driven on the racetrack itself?",
    "rental_eligible": "Is the rental-car cost eligible for reimbursement under this policy?",
    "fraud_flag": "Are there indicators that warrant a fraud review?",
    "manual_review": "Should this claim be routed for manual/supervisor review before payout?",
    "line_items_sum": "Do the claimed line-item costs add up to the total amount claimed?",
    "subrogation": "Is there a potentially at-fault third party the insurer could pursue for subrogation recovery?",
}
NOUL_UNCERTAINTY_LOW = 0.30
NOUL_UNCERTAINTY_HIGH = 0.70
```

TypeSafe 一次调用吃完整份理赔；`noul` 就是 P(true)。应用层再把中间带标成 `uncertain`，底层概率不丢。

完整实验与数据见官网原文：[自洽：Noul](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook)
