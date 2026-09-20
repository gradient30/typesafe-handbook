# Python 用法

> TypeSafe Python SDK 的调用方式、响应模型、环境变量与重试。

## 调用 System One API

### Async

```python
import asyncio

from typesafe_sdk import AsyncTypeSafeClient, Choice, Noul, Score

async def main() -> None:
    async with AsyncTypeSafeClient() as client:
        result = await client.system_one(
            "I was charged twice. Please help ASAP.",
            {
                "billing": Noul(instructions="Is this about billing?"),
                "tone": Choice(
                    instructions="What is the tone?",
                    criteria={"calm": None, "angry": None},
                ),
                "urgency": Score(
                    instructions="How urgent is this?",
                    criteria=["low", "medium", "high"],
                ),
            },
        )
        print(
            result.nouls["billing"].noul,
            result.choices["tone"].choice,
            result.scores["urgency"].score,
        )

asyncio.run(main())
```

### Sync

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

client = TypeSafeClient()
state = "I was charged twice. Please help ASAP."
questions = {
    "billing": Noul(instructions="Is this about billing?"),
    "tone": Choice(
        instructions="What is the tone?", criteria={"calm": None, "angry": None}
    ),
    "urgency": Score(
        instructions="How urgent is this?", criteria=["low", "medium", "high"]
    ),
}
result = client.system_one(state, questions)
print(
    result.nouls["billing"].noul,
    result.choices["tone"].choice,
    result.scores["urgency"].score,
)
```

`state` 可以是字符串、JSON 对象或数组。三种问题可以混在同一次调用里，答案按问题名取回。详见 [State](/concepts/state) 与 [原语](/primitives)。

## 类型化 `system_one` 响应

可以把响应模型传给 `system_one`，让返回值更 *type-safe*：

```python
from typesafe_sdk import Noul, NoulAnswer, SystemOneResponse, TypeSafeClient

class BillingResponse(SystemOneResponse):
    billing: NoulAnswer

with TypeSafeClient() as client:
    result = client.system_one(
        "I was charged twice.",
        {"billing": Noul(instructions="Is this about billing?")},
        response_model=BillingResponse,
    )
    assert 0 <= result.billing.noul <= 1
    assert result.billing == result.nouls["billing"]
    print(result.request_id)
```

### 自定义响应类型

也可以完全不继承 `SystemOneResponse`，自己定义响应模型：

```python
from pydantic import BaseModel

from typesafe_sdk import Noul, NoulAnswer, TypeSafeClient

class BillingAnswers(BaseModel):
    billing: NoulAnswer

class BillingResponse(BaseModel):
    answers: BillingAnswers

result = TypeSafeClient().system_one(
    "I was charged twice.",
    {"billing": Noul(instructions="Is this about billing?")},
    response_model=BillingResponse,
)
assert 0 <= result.answers.billing.noul <= 1
```

## 选择模型

查看当前账号可用的模型：

```python
from typesafe_sdk import TypeSafeClient

print(TypeSafeClient().models.list())
```

构造客户端时指定模型：

```python
client = TypeSafeClient(model="jev")
```

可用模型与别名见 [模型](/models)。方法签名见 [Python API 参考](/sdk/python/api)。

## 重试

把自定义 [`RetryPolicy`](/sdk/python/api) 作为 `retry` 传给客户端，或只传给某一次调用。

### 客户端

```python
from typesafe_sdk import RetryPolicy, TypeSafeClient

client = TypeSafeClient(retry=RetryPolicy(max_retries=3, backoff_max=0.2, timeout=1.0))
```

### 单次调用

```python
from typesafe_sdk import RetryPolicy

client.system_one(
    state, questions, retry=RetryPolicy(max_retries=3, backoff_max=0.2, timeout=1.0)
)
```

默认会重试 `408`、`429` 和 `5xx`，并尊重 `Retry-After`。直接打 HTTP 时的限流处理见 [HTTP API](/api)。

## 错误处理

捕获 SDK 抛出的 [异常](/sdk/python/api)：

```python
from typesafe_sdk import TypeSafeAPIError

try:
    client.system_one(state, questions)
except TypeSafeAPIError as error:
    print(error.status, error.request_id)
```

## 日志

SDK 写到 `typesafe_sdk` logger。按 [标准 logging](https://docs.python.org/3/library/logging.html) 配置：

```python
import logging

logging.getLogger("typesafe_sdk").setLevel(logging.DEBUG)
```

也可以在导入 SDK 之前把 `TYPESAFE_LOG_LEVEL` 设为 `debug`、`info`、`warning`、`error` 或 `off`。

`info` 每条请求打一行摘要；`debug` 还会打请求和响应的 headers 与 body。敏感 headers——authorization、API key、cookie，以及名字里含 `token` 或 `secret` 的——会从日志里打码。请求和响应 body **不会**打码。

## 环境变量

SDK 读取并使用以下环境变量：

| 变量 | 作用 | 默认 |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | API key（必填） | — |
| `TYPESAFE_BASE_URL` | API 根 URL | `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` | 默认模型 | `jev-latest` |
| `TYPESAFE_LOG_LEVEL` | `typesafe_sdk` logger 级别，导入时生效一次 | 未设置 |

SDK 默认值见 [常量](/sdk/python/api)。

## 向前兼容

SDK 会跟着 TypeSafe API 一起演进，所以可以在 SDK 还没一等支持某项新能力之前就先用上。

### 额外请求字段

用 [`extra_body`](/sdk/python/api) 发送当前 SDK 版本尚未建模的请求字段：

```python
from typesafe_sdk import Noul, TypeSafeClient

with TypeSafeClient() as client:
    client.system_one(
        "I was charged twice.",
        {"billing": Noul(instructions="About billing?")},
        extra_body={"beam_width": 4},
    )
```

### 原始问题字典

```python
from typesafe_sdk import TypeSafeClient

with TypeSafeClient() as client:
    client.system_one(
        "I was charged twice.",
        {"billing": {"type": "noul", "instructions": "About billing?", "weight": 2}},
    )
```

> 未知字段是向前兼容的逃生口。类型检查报错可以先忽略，更稳妥的做法是升级 SDK。

### 未知答案种类

SDK 会打一条 warning，并跳过无法识别的答案种类。用 `raw_http_response` 查看完整 API 响应，包括那些答案：

```python
from typesafe_sdk import Noul, TypeSafeClient

result = TypeSafeClient().system_one(
    "I was charged twice.",
    {"billing": Noul(instructions="Is this about billing?")},
)
raw_answers = result.raw_http_response.json()["answers"]
```

### 未知响应字段

已识别响应上的未知额外字段会被忽略。
