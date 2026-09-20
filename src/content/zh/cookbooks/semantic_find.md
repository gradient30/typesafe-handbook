# 逐行检索

> 给 GitHub 服务条款做语义检索。一次请求用 Choice 给 218 个行 id 对照自然语言查询打分，再用 Noul 判断文档里有没有答案。

## 问题

手头是 GitHub 服务条款和一句白话问题。要找到作答的行，还要能发现文档根本没答。排序会把直接作答的行放最前；`exists` 阈值把其余情况分成缺失或部分。最终是 `find()`：返回 `exists` 概率和每行一个相关分。

## 架构

三步：(1) 每行打上 id，让 TypeSafe 能指到它；(2) [Choice](/primitives/choice) 按「多能回答查询」给行 id 排序——概率和为 1，所以即使没一行作答也会有人排第一；(3) 同一次请求里用 [Noul](/primitives/noul) 问文档到底有没有答案。Choice 最多 255 个选项；更长的文档要两趟：先选窗口，再给窗口内排序。

```mermaid
%%{init: {"fontFamily": "IBM Plex Sans, Noto Sans SC, sans-serif", "flowchart": {"rankSpacing": 28, "wrappingWidth": 240}}}%%
flowchart LR
    doc["打过 id 的 218 行"] --> call
    q["白话查询"] --> call

    subgraph call["一次请求"]
        C["Choice：哪一行作答？"]
        N["Noul：有没有答案？"]
    end

    C --> rank["按概率排序行"]
    N --> v{"exists"}
    v -->|">= 0.7"| yes["本文档有答案"]
    v -->|"< 0.35"| no["不在本文档"]
    v -->|"中间"| part["部分涉及"]
```

## 结论

218 行，43,980 字符，`jev-1.12`。

| 查询 | exists | 判定 | 第一名 |
| --- | --- | --- | --- |
| who owns the code I upload? | 0.98 | 本文档有答案 | L052 0.95 |
| can GitHub kick me off without warning? | 0.97 | 本文档有答案 | L168 0.97 |
| do I have to take disputes to arbitration? | 0.14 | 不在本文档 | L205 0.86（最近但不相关） |
| can minors use GitHub with parental permission? | 0.46 | 部分涉及 | L029 0.90（年龄规则，没答监护许可） |

仲裁那条说明为什么必须有存在性检查：排序给最近行 0.86，但 `exists` 只有 0.14。排序告诉你往哪看，`exists` 告诉你结果算不算答案。阈值要对照自己的文档再调。

## 关键代码

Choice 的选项就是行 id；描述为 `None`，因为正文已在 state 里。Noul 不依赖其他选项，没答案时可以掉到接近 0。

```python
def where_question(query: str) -> Choice:
    return Choice(
        instructions=f'Which line of the document contains the answer to: "{query}"?',
        criteria={line_id(i): None for i in range(len(LINES))},
    )

def exists_question(query: str) -> Noul:
    return Noul(
        instructions=f'Does any line of the document address or answer: "{query}"?',
        criteria=NoulCriteria(
            true="At least one line of the document states or directly implies the answer",
            false="No line of the document addresses this",
        ),
    )

response = client.system_one(
    state=state,
    questions={"where": where, "exists": exists},
    model=model,
)
```

完整实验与数据见官网原文：[逐行检索](https://docs.typesafe.ai/cookbooks/semantic_find)
