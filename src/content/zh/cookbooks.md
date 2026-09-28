# 食谱总览

> 端到端食谱：TypeSafe 用在真实问题上，从几个问题到整条流水线。

每篇食谱都是一份做过的例子：真实数据集、用来做决定的 TypeSafe 问题，以及把这些决定接成可运行系统的代码。想看 [原语](/primitives) 和 [模式](/patterns) 怎么落在具体问题上，或想抄一份当起点，就读对应的一篇。

读这节之前，默认你已经知道 [TypeSafe 原语](/primitives)，也理解 [置信度怎么工作](/confidence)。否则先读那两页。

官网原文多数带完整实验日志（30–70 KB）。中文站写清**问题怎么拆、请求怎么发、代码怎么接答案、数字说明什么**，不逐行搬运过程日志。要复现实验，打开每一页底部的官网链接。

## 自洽

把同一次决策重复多次，用各次之间的一致程度当信号。

| 食谱 | 做什么 | 难度 |
| --- | --- | --- |
| [自洽：Noul](/cookbooks/consistency_noul_cookbook) | 把不确定的概率交给人工复核，同时保留底层 noul。 | 入门 |
| [自洽：Choice](/cookbooks/consistency_choice_cookbook) | 给审核决策加一个不确定出口，对照标签一致率与自动动作比例。 | 入门 |

## 批处理

把很多问题打进同一次请求。

| 食谱 | 做什么 | 难度 |
| --- | --- | --- |
| [并行问题](/cookbooks/parallel_questions) | 对 GDPR 维基百科文章跑 13 个监管问题：一次调用比逐条便宜 12.2×、快 10.0×，答案不变。 | 入门 |

## 操作指南

检索、排版、工具选择、护栏等常见任务。

| 食谱 | 做什么 | 难度 |
| --- | --- | --- |
| [重排序](/cookbooks/rerank_typesafe) | 40 条 CLERC 法律查询各建 30 段 BM25 短名单，再逐对重排：top-1 从 5% 到 18%，top-10 从 38% 到 62%。 | 入门 |
| [逐行检索](/cookbooks/semantic_find) | 给 GitHub 服务条款做语义检索：一次请求用 Choice 给 218 个行 id 打分，用 Noul 判断文档里有没有答案。 | 入门 |
| [结构恢复](/cookbooks/autoformat) | 两次请求从丢掉格式的纯文本还原 Markdown：一次缝硬换行，一次给每个块分类（标题、列表、代码、提示框）。 | 入门 |
| [函数调用](/cookbooks/function_calling) | 自然语言交易请求映射到普通带类型函数：函数名和闭集参数都是带置信度的 TypeSafe 问题。 | 进阶 |
| [技能建议](/cookbooks/skill_suggestion) | 从 Nous Research Hermes 目录的 182 个技能里，每个回合最多挑一个：两次请求排序并复核前几名。 | 进阶 |
| [实体对齐](/cookbooks/entity_alignment) | 用一个 Score 加三个伴随 Noul，判断两个啤酒目录里 450 对候选是否同一产品，并标出哪个字段不一致。 | 入门 |
| [给 RAG 段落分类](/cookbooks/classifying_rag_passages) | 一次请求给每段检索结果打分，再在代码里决定哪些进回答模型。 | 进阶 |
| [核对引用](/cookbooks/citation_check) | 对照源文档抓住错误或幻觉引用。一个 Choice 判断引文上下文是否支撑主张。 | 入门 |
| [LLM 护栏](/cookbooks/llm_guardrails) | 一次请求筛进出 LLM 应用的每条消息，按危害概率和严重度决定放行、送审、拦截或改路由。 | 进阶 |

## 抽取

从乱文本里拉出类型化取值。

| 食谱 | 做什么 | 难度 |
| --- | --- | --- |
| [SDE 级联](/cookbooks/sde_cascade) | 两级结构化抽取（mini → 校验 → 推理），接近大推理模型的质量，成本只是零头。 | 进阶 |
| [日期抽取](/cookbooks/date_extraction_cookbook) | 让 TypeSafe 点名文档里的日期部件，再在代码里解析、校验，并按置信度送人审。 | 入门 |
| [预解析值抽取](/cookbooks/pre_parsed_value_extraction_cookbook) | 正则找候选邮箱、电话、金额，TypeSafe 选出要的那一段，代码再规范化逐字取值。 | 入门 |

## 分类

把输入分到任意深度的类别。

| 食谱 | 做什么 | 难度 |
| --- | --- | --- |
| [层级分类](/cookbooks/hierarchical_classification) | 在专利、零售、生物医学、源码层级上，用 TypeSafe Choice 概率做并行束搜索。 | 进阶 |
| [自动研究特征发现](/cookbooks/autoresearch_feature_discovery) | 自动研究循环提出 TypeSafe 问题，把自由文本变成数值特征，用模型误差改进 CatBoost 监督回归。 | 高级 |
| [分类用置信度](/cookbooks/classification_using_confidence) | 一个 Choice 把 SEC 年报分到 75 个行业组，再读置信度决定上报该组还是上一级部门。 | 入门 |

我们一直想知道大家怎么用这些原语。如果你做了值得写成食谱的东西，可以给我们留个言。
