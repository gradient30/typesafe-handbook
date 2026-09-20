# 实体对齐

> 判断两个啤酒目录里 450 对候选是否描述同一产品。一个 TypeSafe Score 承担全部决策，因为它的三档就是对一对能做的三件事：合并、不链接、交给策展人。没有阈值可调；三个 Noul 搭同一请求，告诉策展人两边在哪个字段上不一致。

## 问题

两个数据源描述重叠的同一批东西，要知道这边哪条对应那边哪条。廉价初筛已经挑出 450 对值得细看。错误合并更贵：任一方的事实都会跟进合并实体，事后拆开要追每条事实从哪来。漏掉匹配只留下重复，所以判断需要第三选项：既不能安全合并、也不能安全丢掉的对。

## 架构

一个 [Score](/primitives/score)，三档就是三个结果：不同产品 / 相关但可能不是同一个 / 同一产品。用 Score 是因为要把语义标签直接贴在每个结果上，包括中间档。Noul 只能靠阈值间接做到；Choice 会丢掉三档的序关系。名称、酒厂、风格各一个 Noul 搭同一请求。酒精度是算术，在代码里比。

```mermaid
%%{init: {"fontFamily": "IBM Plex Sans, Noto Sans SC, sans-serif", "flowchart": {"rankSpacing": 28, "wrappingWidth": 240}}}%%
flowchart LR
    pair["一对候选<br/>两边都在同一 state"] --> call

    subgraph call["一次请求，四个问题"]
        S["Score：两者如何相关"]
        N["Noul：同名？同酒厂？同风格？"]
    end

    S --> R{"四舍五入到最近档"}
    R -->|"不同"| drop["不链接"]
    R -->|"相同"| merge["断言 sameAs"]
    R -->|"相关"| q["策展人队列"]
    N -.->|"哪个字段不一致"| q
```

决策规则是「最近档命名结果」。文件里没有任何阈值常数。

## 结论

Magellan Beer 基准，450 对，`jev-1.12`（2026-08-11）。文本原样保留，包括未还原的 HTML 实体。

| 结果 | 对数 | 占比 |
| --- | --- | --- |
| assert sameAs | 40 | 8.9% |
| curator queue | 50 | 11.1% |
| leave unlinked | 360 | 80.0% |

多数对自动落盘。分数并不整齐落在整数上；多数靠近 0.25。决定一对的是它落在切点哪一侧。上切点 1.5 附近 0.1 内有 9 对（决定谁被并进图）；下切点 0.5 附近有 47 对（只决定策展人是否看见）。

## 关键代码

三档描述就是全部决策。中间档覆盖变体、特别版、以及名字两边都说得通的情况。

```python
LEVELS = [
    "They describe two different products.",
    "They describe closely related products that may or may not be the same one: "
    "a variant, a special edition, or a name that could plausibly refer to either.",
    "They describe one and the same product.",
]
OUTCOME = {0: "leave unlinked", 1: "curator queue", 2: "assert sameAs"}

QUESTIONS = {
    "link_state": Score(
        instructions="How do the two entity descriptions relate as products?",
        criteria=LEVELS,
    ),
    "same_name": Noul(instructions="Do the two entities state the same beer name?"),
    "same_brewery": Noul(instructions="Are the two entities from the same brewery?"),
    "same_style": Noul(instructions="Do the two entities describe the same beer style?"),
}

def route(score_value: float) -> str:
    return OUTCOME[min(int(score_value + 0.5), len(LEVELS) - 1)]
```

完整实验与数据见官网原文：[实体对齐](https://docs.typesafe.ai/cookbooks/entity_alignment)
