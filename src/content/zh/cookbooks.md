# 食谱总览

> 官方 cookbook 的中文导读：架构、结论和关键代码。完整实验日志仍以英文原文为准。

官网食谱多数是可运行的 notebook：一次完整实验、重复次数、对照模型和费用表。中文站不把 30–70 KB 的过程日志逐行搬过来，而是把**问题怎么拆、请求怎么发、代码怎么接答案、数字说明什么**写清楚。要复现实验，打开每一页底部的官网链接。

| 食谱 | 做什么 | 关键数字 |
| --- | --- | --- |
| [并行问题](/cookbooks/parallel_questions) | 一份文档 + 13 个监管问题，一次调用 vs 逐条 | 便宜 12.2×、快 10×，答案不变 |
| [自洽：Noul](/cookbooks/consistency_noul_cookbook) | 理赔 14 个 Noul 重复 15 次 | 不确定的概率交给人工，原始 noul 仍可见 |
| [自洽：Choice](/cookbooks/consistency_choice_cookbook) | 审核 8 个 Choice 重复 15 次 | 加「不确定」出口，对照自动动作比例 |
| [分类用置信度](/cookbooks/classification_using_confidence) | SEC 年报分到 75 个行业组 | 不够自信就升到上级部门 |
| [重排序](/cookbooks/rerank_typesafe) | BM25 短名单再用 TypeSafe 重排 | 法律检索 top-1 5% → 18%，top-10 38% → 62% |
| [逐行检索](/cookbooks/semantic_find) | 一次请求给 218 行 GitHub ToS 打分 | Choice 排序 + Noul 判断有没有答案 |
| [结构恢复](/cookbooks/autoformat) | 两步把丢了格式的纯文本还原成 Markdown | 模型不改写原文，代码负责渲染 |
| [函数调用](/cookbooks/function_calling) | 自然语言交易请求 → 带置信度的函数调用 | 低置信度不执行 |
| [技能建议](/cookbooks/skill_suggestion) | 182 个 Hermes 技能里最多挑一个 | 错载和空载都降一半以上 |
| [实体对齐](/cookbooks/entity_alignment) | 450 对啤酒目录用一个 Score 决定 | 合并 / 不链 / 交给策展人 |
| [给 RAG 段落分类](/cookbooks/classifying_rag_passages) | 检索段打分后再决定谁进回答模型 | 矛盾、注入、无关分开处理 |
| [核对引用](/cookbooks/citation_check) | Choice 判断引文是否支撑主张 | 低置信度送人工 |
| [LLM 护栏](/cookbooks/llm_guardrails) | 进出 LLM 的消息用一轮 TypeSafe 筛 | Noul 标危害，Score 标严重度 |
| [SDE 级联](/cookbooks/sde_cascade) | mini 抽取 → TypeSafe 校验 → 推理模型 | 接近大模型质量、成本更低 |
| [日期抽取](/cookbooks/date_extraction_cookbook) | 问日期部件，代码里拼成 date | 模型不做日历运算 |
| [预解析值抽取](/cookbooks/pre_parsed_value_extraction_cookbook) | 正则找候选，TypeSafe 选出要的那段 | 邮箱 / 电话 / 金额 |
| [层级分类](/cookbooks/hierarchical_classification) | 专利、零售、生物医学、源码层级 | 并行束搜索 |
| [自动研究特征发现](/cookbooks/autoresearch_feature_discovery) | 提出问题，把文本变成数值特征 | 改进监督回归 |

完整英文原文： [docs.typesafe.ai](https://docs.typesafe.ai/introduction) 侧栏 Cookbooks。
