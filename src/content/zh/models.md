# 模型

Jev 是 TypeSafe 的旗舰模型，也是第一款 [System One 模型](/concepts/system-one)。本页所有模型走同一个端点 `POST /v1/systemone`。请求里的 `model` 字段决定由谁处理；完整请求形状见 [API 参考](/api)。

## 当前模型

| | Jev 1.14 | Jev 1.13 |
| :- | :- | :- |
| Model ID | `jev-1.14.0` | `jev-1.13.0` |
| 价格（每 Btok / 每 Mtok） | $42 / $0.042 | $42 / $0.042 |
| 上下文长度 | 每次请求 64k / 每个问题 32k | 每次请求 64k / 每个问题 32k |
| 输入 | 文本 | 文本 |

Jev 1.14 是最新的 Jev 版本，自 2026 年 10 月 14 日起可用。

* **价格：** 按输入 token 计费。输出 token 免费。Btok 是十亿 tokens，Mtok 是百万 tokens。
* **上下文长度：** 两个上限——每次请求上下文与每个问题上下文。见 [上下文长度](#context-length)。要同时提高两者，见 [Long context](#long-context)。
* **输入：** Jev 读取自然语言文本，可以是字符串、JSON 对象，或文本值数组。不接受音频或视频。请先转换成文本或结构化字段，再作为 `state` 发送。`state` 支持的形状见 [State](/concepts/state)。

## 上下文长度 {#context-length}

Jev 只摄入一次 `state`，再并行地对每一个问题评估。一次请求必须同时满足两个上下文上限：

* **每次请求上下文**（`per_request_context`）：`state` 加上全部问题。
* **每个问题上下文**（`per_question_context`）：`state` 加上任意一条问题。

请求里问题数量没有单独上限。只要同时落在这两个上限内，问题可以任意多。把许多问题塞进一次请求见 [投机扇出](/patterns/fan-out)；state 变大时准确率怎么变，见 [Jev 1.13 锯齿](/model-jaggedness/jev-1.13)。

要同时提高两个上限，见 [Long context](#long-context)。

### Long context {#long-context}

Long context 默认关闭，Jev 1.14 与 Jev 1.13 都可用。需要时，在每次请求上发送 `TypeSafe-Danger-Zone-Long-Context: true` 头。带上该头后，每次请求上下文与每个问题上下文均为 262k tokens。不带该头的请求仍使用上表默认上限。

```bash
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "TypeSafe-Danger-Zone-Long-Context: true" \
  -d '{
    "model": "jev-latest",
    "state": "<a long contract, transcript, or record>",
    "questions": {
      "has_termination_clause": {
        "type": "noul",
        "instructions": "Does the `state` include a clause that lets either party end the agreement early?"
      }
    }
  }'
```

Long context 的每 token 价格与普通请求相同。它比落在默认上限内更慢、准确率更低，因此只在真正需要时开启。

## 限流

限流按组织设置。当前组织限额见 [开发者控制台](https://console.typesafe.ai/rate-limits)。

按每秒 tokens 与每秒请求数计量。超过任一上限返回 `429 Too Many Requests`。[客户端 SDK](/sdk) 默认会重试这类请求，并在响应包含 `retry-after` 时遵循它。若直接调用 HTTP API，见 [处理限流](/api/errors#handling-rate-limits)。

定制和企业套餐可申请更高限额，联系 [sales@typesafe.ai](mailto:sales@typesafe.ai)。

## 别名

别名是解析到某个版本化模型 ID 的名字。和其他名字一样，写进 `model` 字段即可。

| 别名 | 指向 | 含义 |
| :- | :- | :- |
| `jev-latest` | `jev-1.13.0` | 最近一次稳定、正式发布。客户端 SDK 的默认值，也是文档示例用的名字。 |
| `jev-preview` | `jev-1.14.0` | 最近一次发布，不论是否正式。有 preview 构建时会走到 `jev-latest` 前面。 |

新版本发布时别名会跟着走，所以你这边代码不变，答案也可能变。响应里的 `model` 字段报告实际作答的版本化 ID，便于记录每次结果出自哪一版。如果置信度阈值是对着某一版调的，请钉住那一版的 ID，而不是别名，再按自己的节奏迁到新版本。

## 定制 Jev

Jev 不会用客户数据做 fine-tune 或 LoRA。它用 [RLCD](/introduction/machine-learning-primer) 训练，返回校准过的决策，同一套权重服务所有账号。你通过请求塑造答案，而不是靠每账号一份权重：

* 把专有内容、记录、参考材料放进 `state` 字段。见 [State](/concepts/state)。
* 把领域规则和边界情况写进每个问题的 `instructions` 和 `criteria`。见 [如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one) 与 [高级：结构](/primitives/advanced)。
* 把宽泛判断拆成原子问题，再在代码里组合输出。见 [组合评分](/patterns/composite-scoring)；用 Jev 的概率训练下游经典模型，见 [自动研究特征发现](/cookbooks/autoresearch_feature_discovery)。

## 语言支持

Jev 接受自然语言文本。英语是主要训练语言，目前准确率也最高。其他语言（含 CJK 文字）能处理，但效果不均等；非英语工作负载上线前请用自己的内容测试，路由时密切关注 [Confidence](/confidence)。

## 数据处理

Jev 不拿客户请求或响应做训练。见 [法律](/legal) 中的数据处理协议、隐私政策，以及企业客户的零数据留存（ZDR）。

## 列出模型

`GET /v1/models` 返回你账号可以写进 `model` 字段的名字，以及每项的描述和发布日期。目前列出的是别名。像 `jev-1.14.0` 这样的版本化 ID，即使不出现在列表里，`model` 字段也接受。

```bash
curl https://api.typesafe.ai/v1/models \
  -H "Authorization: Bearer $TYPESAFE_API_KEY"
```

```python
from typesafe_sdk import TypeSafeClient

with TypeSafeClient() as client:
    for model in client.models.list().models:
        print(model.name, model.release_date, model.description)
```

```typescript
import { TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();
const models = await client.models.list();
for (const model of models) {
  console.log(model.name, model.release_date, model.description);
}
```

每个模型或别名一条。字段：

* **`name`**（string，必填）：`model` 字段可接受的模型 ID 或别名。
* **`description`**（string，必填）：该模型用途说明。
* **`release_date`**（string，必填）：模型或别名的发布日期。

完整方法签名见 [Python](/sdk/python/api/clients/sync#typesafe_sdk.Models.list) 与 [JavaScript](/sdk/javascript/api/interfaces/Models) SDK 参考。
