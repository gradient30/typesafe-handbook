# Python SDK

> 安装 TypeSafe Python SDK，用异步或同步客户端发出第一次请求。

浏览 [Python SDK 源码（GitHub）](https://github.com/typesafe-ai/typesafe-sdk-python)。

TypeSafe API 的异步与同步 Python 客户端。用法见本站 [简介](/introduction) 与 [HTTP API](/api)。

## 快速开始

1. 安装 SDK：

### uv

```sh
uv add typesafe-sdk
```

### pip

```sh
pip install typesafe-sdk
```

2. 在环境里设置 `TYPESAFE_API_KEY`（在 [控制台](https://console.typesafe.ai/) 创建）
3. 调用 System One API：

### Async

配合 [`AsyncTypeSafeClient`](/sdk/python/api)：

```python
from typesafe_sdk import AsyncTypeSafeClient, Choice, Noul, Score

async def main() -> None:
    async with AsyncTypeSafeClient() as client:
        response = await client.system_one(
            state={"document": "I was charged twice. Please fix this ASAP."},
            questions={
                "billing": Noul(instructions="Is this ticket about billing?"),
                "tone": Choice(
                    instructions="What is the customer's tone?",
                    criteria={"calm": None, "frustrated": None, "angry": None},
                ),
                "urgency": Score(
                    instructions="How urgent is this ticket?",
                    criteria=["can wait", "this week", "today"],
                ),
            },
        )

    print(response.nouls["billing"].noul)
    print(response.choices["tone"].choice)
    print(response.scores["urgency"].score)
```

### Sync

配合 [`TypeSafeClient`](/sdk/python/api)：

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        state={"document": "I was charged twice. Please fix this ASAP."},
        questions={
            "billing": Noul(instructions="Is this ticket about billing?"),
            "tone": Choice(
                instructions="What is the customer's tone?",
                criteria={"calm": None, "frustrated": None, "angry": None},
            ),
            "urgency": Score(
                instructions="How urgent is this ticket?",
                criteria=["can wait", "this week", "today"],
            ),
        },
    )

print(response.nouls["billing"].noul)
print(response.choices["tone"].choice)
print(response.scores["urgency"].score)
```

## 用法

更多调用方式、响应模型、重试与环境变量，见 [Python 用法](/sdk/python/usage)。API 签名见 [Python API 参考](/sdk/python/api)。变更记录见 [changelog](/sdk/python/changelog)。
