# 模型

> Jev 1.13 的价格、限流、上下文、别名与语言支持。

Jev 是 TypeSafe 的旗舰模型，也是第一款 [System One 模型](/concepts/system-one)。本页所有模型走同一个端点 `POST /v1/systemone`。请求里的 `model` 字段决定由谁处理；完整请求形状见 [HTTP API](/api)。

## 当前模型

| Jev 1.13 | `jev-1.13.0` |
| :-- | :-- |
| 价格（每 Btok / 每 Mtok） | $42 / $0.042 |
| 限流 | 每秒 250,000 tokens / 每分钟 1,200 次请求 |
| 上下文长度 | 每次请求 64k tokens；`state` 加上最长那条问题 32k tokens |
| 输入 | 仅文本。字符串、JSON 对象，或文本值数组。不接受图像、音频、视频 |

* **价格：** 按输入 token 计费。输出 token 免费。Btok 是十亿 tokens，Mtok 是百万 tokens。
* **限流：** 按每秒 tokens 和每分钟请求数计量。超过任一上限返回 `429 Too Many Requests`。[客户端 SDK](/sdk) 默认带退避重试，响应里有 `retry-after` 时会尊重它。直接打 HTTP API 时见 [处理限流](/api#handling-rate-limits)。
* **上下文长度：** Jev 只摄入一次 `state`，再并行地对每一个问题评估。64k 预算覆盖 `state` 加全部问题；32k 预算覆盖 `state` 加最长那一条问题。把许多问题塞进一次请求见 [投机扇出](/patterns/fan-out)；state 变大时准确率怎么变，见 [Jev 1.13 锯齿](/model-jaggedness/jev-1.13)。
* **输入：** Jev 评估自然语言文本。非文本输入（图像、音频、视频、二进制）先预处理成文本或结构化字段，再作为 `state` 发送。支持的形状见 [State](/concepts/state)。

> 限流正在动态调整。当前需求量很大，上面的数字可能随时变——大额 GPU 到位、放更多用户进来时都会改。稳定之后才能给出更固定的上限。定制和企业套餐可以申请更高限额，联系 [sales@typesafe.ai](mailto:sales@typesafe.ai)。

## 别名

别名是解析到某个版本化模型 ID 的名字。和其他名字一样，写进 `model` 字段即可。

| 别名 | 指向 | 含义 |
| :-- | :-- | :-- |
| `jev-latest` | `jev-1.13.0` | 最近一次稳定、正式发布。客户端 SDK 的默认值，也是文档示例用的名字。 |
| `jev-preview` | `jev-1.13.0` | 最近一次发布，不论是否正式。有 preview 构建时会走到 `jev-latest` 前面。 |

> 目前 `jev-preview` 与 `jev-latest` 指向同一模型。眼下没有可用的 preview 构建。

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

`GET /v1/models` 返回你账号可以写进 `model` 字段的名字，以及每项的描述和发布日期。目前列出的是别名。像 `jev-1.13.0` 这样的版本化 ID，即使不出现在列表里，`model` 字段也接受。

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

* `name` — 模型 ID 或别名，与 `model` 字段接受的值相同。
* `description` — 这个模型是干什么的。
* `release_date` — 模型或别名的发布日期。

完整方法签名见 [Python](/sdk/python/api) 与 [JavaScript](/sdk/javascript/api) SDK 参考。
