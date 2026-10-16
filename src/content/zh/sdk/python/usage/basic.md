# 基本用法

## 调用 System One API

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

同步版本：

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

## 选择模型

检查可用模型：

```python
import asyncio

from typesafe_sdk import AsyncTypeSafeClient

async def main() -> None:
    async with AsyncTypeSafeClient() as client:
        print(await client.models.list())

asyncio.run(main())
```

在构造客户端时选择模型：

```python
client = AsyncTypeSafeClient(model="jev")
```

## 附加媒体资产

System One 请求可以包含媒体资产。

**支持的资产类型**

目前仅支持图像，未来将支持更多模态。

**图像目前仅为 dreamer-ready**

截至 2026 年 11 月 14 日，图像支持仅为 dreamer-ready。勇敢者可通过 HTTP 头选择启用此功能：

```python
client = TypeSafeClient(headers={"TypeSafe-Danger-Zone-Images": "true"})
```

了解图像支持：

* [**API 文档**](https://docs.typesafe.ai/go/images)：如何启用并使用图像与 TypeSafe 的 System One API
* [**SDK 文档**](/sdk/python/api/types/assets#typesafe_sdk.Image)：使用图像与 `typesafe-sdk` 的文档和代码示例

**上传格式**

带有资产的请求以 `multipart/form-data` 发送，每个资产的原始字节在其自己的部分中。

`state` 或 `questions` 内容中的 **资产引用** 将被替换为实际资产数据，该数据单独提供给客户端。

有两种创建 **资产引用** 的方式：

1. [自动引用](/sdk/python/usage/basic#automatic-references)：将资产直接放在内容中，或将其格式化到字符串中。SDK 然后为每个资产生成唯一引用。
2. [命名引用](/sdk/python/usage/basic#named-references)：为资产选择自己的引用，通过 `system_one` 的 `assets` 参数传递。

两种类型的资产引用可以在同一请求中一起使用。

### 自动引用

#### 结构化对象中的资产

将资产直接放在 `state` 或问题 instructions 和 criteria 中：

```python
from pathlib import Path

from typesafe_sdk import AsyncTypeSafeClient, Image, Noul, SystemOneResponse

async def compare_return(
    client: AsyncTypeSafeClient, returned: Path, listing: Path, *, model: str
) -> SystemOneResponse:
    return await client.system_one(
        state=["The customer returned this item:", Image(returned)],
        questions={
            "same_item": Noul(
                instructions=["Is it the item in this listing photo?", Image(listing)]
            )
        },
        model=model,
    )
```

### 命名引用

要为资产选择自己的引用，通过 `assets` 传递它，以该引用为键。使用不同的分隔符以避免匹配普通文本。

## 类型化的 `system_one` 响应

可以为 `system_one` 提供响应模型，使使用响应更加 *类型安全*：

```python
import asyncio

from typesafe_sdk import AsyncTypeSafeClient, Noul, NoulAnswer, SystemOneResponse

class BillingResponse(SystemOneResponse):
    billing: NoulAnswer

async def main() -> None:
    async with AsyncTypeSafeClient() as client:
        result = await client.system_one(
            "I was charged twice.",
            {"billing": Noul(instructions="Is this about billing?")},
            response_model=BillingResponse,
        )
        assert 0 <= result.billing.noul <= 1
        assert result.billing == result.nouls["billing"]
        print(result.request_id)

asyncio.run(main())
```

## 重试

将自定义 [`RetryPolicy`](/sdk/python/api/retries) 作为客户端或每次调用的 `retry` 传递。无效的 API 密钥在客户端创建期间引发 `TypeSafeError`，在任何请求或重试之前。

## 错误处理

处理 SDK 引发的 [异常](/sdk/python/api/exceptions)。
