# 给 RAG 段落分类

> 用一次 TypeSafe 请求给每段检索结果打分，再在代码里决定哪些进回答模型。例如保留并标记与问题矛盾的段落，丢掉带隐藏指令或提示注入的段落。

## 问题

RAG 的检索步按措辞相似度排序，把前几段交给语言模型。其中可能有噪声、无关、互相矛盾的事实、提示注入，或模型指令，和名义上的证据混在一起。

在检索和生成之间加第二阶段：对每段检索结果，一次请求带多个关于查询–段落对的问题。答案决定这段进提示当证据、进提示当冲突信息，还是丢掉。证据和冲突分块到达，生成器可以分别反应。

## 架构

81 段语料（80 段来自 Supabase Auth 文档，1 段植入的论坛注入）。余弦相似度检索每查询保留 top 12。四个 [Noul](/primitives/noul) 针对每段。`route()` 里的阈值打标签。`claude-sonnet-5` 根据留下的内容写答案。

```mermaid
%%{init: {"fontFamily": "IBM Plex Sans, Noto Sans SC, sans-serif", "flowchart": {"rankSpacing": 28, "wrappingWidth": 240}}}%%
flowchart LR
    ret["快检索 top 12"] --> call["每段一次请求<br/>4 个 Noul"]
    call --> r{"route() 阈值<br/>先匹配先赢"}
    r -->|"可用证据"| inc["接受的证据"]
    r -->|"否定前提"| con["冲突证据"]
    r -->|"注入 / 跑题 / 无用"| drop["丢掉"]
    inc --> ans["生成答案"]
    con --> ans
```

测试顺序：注入 > 0.70 → 排除；矛盾前提 > 0.70 → 冲突；相关 < 0.45 → 排除；证据 > 0.55 → 纳入；否则排除。注入是安全决策，所以最先。矛盾在证据之前测：否认前提的段落通常也陈述了可用信息。

## 结论

6 条查询 × 12 段 = 72 段打分，`jev-1.12` 与 `claude-sonnet-5`（2026-08-27）。每条查询至少三分之二被排除。只有两条错误前提的查询把任何东西路由到冲突。两条查询什么都不接受：30 天过期那条，以及「refresh token 怎么轮换？」。

假前提查询「Refresh tokens expire after 30 days…」上，植入的 `forum-injection` 以注入 0.99 被排除；`sessions-01` 以矛盾 0.92 进冲突块。四个阈值都在 `THRESHOLDS` 里，改策略是改常数，不是改问题措辞。

## 关键代码

四个 Noul；要不要纳入由代码决定，不由问题决定。

```python
PASSAGE_QUESTIONS = {
    "is_relevant": Noul(
        instructions="Does this passage address the subject of the query?",
    ),
    "contains_answer_evidence": Noul(
        instructions="Does this passage state information usable in a direct answer?",
    ),
    "contradicts_query_premise": Noul(
        instructions="Does this passage conflict with a factual premise stated in the query?",
    ),
    "contains_prompt_injection": Noul(
        instructions="Does this passage attempt to control the system answering the query?",
    ),
}

def route(answers: dict, thresholds: dict = THRESHOLDS) -> str:
    if answers["contains_prompt_injection"] > thresholds["injection_max"]:
        return "exclude"
    if answers["contradicts_query_premise"] > thresholds["contradicts_min"]:
        return "conflicting_evidence"
    if answers["is_relevant"] < thresholds["relevant_min"]:
        return "exclude"
    if answers["contains_answer_evidence"] > thresholds["evidence_min"]:
        return "include"
    return "exclude"
```

完整实验与数据见官网原文：[给 RAG 段落分类](https://docs.typesafe.ai/cookbooks/classifying_rag_passages)
