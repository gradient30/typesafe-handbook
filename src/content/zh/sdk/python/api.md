# Python API 参考

> 同步 / 异步客户端、问题类型、答案、重试、异常与常量。不逐字段搬运自动生成页。

`typesafe_sdk` 提供 `TypeSafeClient` 与 `AsyncTypeSafeClient`。两者构造参数相同，`system_one` 签名相同，异步版需要 `await`。安装与第一次调用见 [Python SDK](/sdk/python)，模式见 [Python 用法](/sdk/python/usage)。

## 客户端（同步 / 异步）

```python
TypeSafeClient(
    *,
    api_key: str | None = None,
    model: str | None = None,
    retry: RetryPolicy | None = None,
    timeout: float | httpx2.Timeout | None = None,
    headers: Mapping[str, str] | None = None,
    transport: httpx2.BaseTransport | None = None,
    http_client: httpx2.Client | None = None,
    base_url: str | None = None,
)
```

`AsyncTypeSafeClient` 的 `transport` 是 `httpx2.AsyncBaseTransport`，`http_client` 是 `httpx2.AsyncClient`。显式参数优先于环境变量；空或纯空白的环境值会被忽略。缺少 API key 或 timeout 非法时抛 `TypeSafeError`。同时传入 `transport` 和 `http_client` 抛 `ValueError`。

| 参数 | 含义 |
| --- | --- |
| `api_key` | 必填。也可设 `TYPESAFE_API_KEY` |
| `model` | 模型名。也可设 `TYPESAFE_DEFAULT_MODEL`，默认 `jev-latest` |
| `retry` | `RetryPolicy`。传入 `RetryPolicy(max_retries=0)` 关闭重试 |
| `timeout` | HTTP 超时。有 `http_client` 时继承其 timeout，否则用 SDK 默认 |
| `headers` | 额外请求头 |
| `transport` | 自定义 HTTP transport，客户端关闭时一并关闭 |
| `http_client` | 自定义 `httpx2.Client` / `AsyncClient`，与 `transport` 互斥 |
| `base_url` | API 根。也可设 `TYPESAFE_BASE_URL` |

SDK 写到 `typesafe_sdk` logger。敏感 headers 会打码，请求和响应 body 不会。

### `system_one`

对文本或结构化 state 回答一组具名问题。详见 [System One](/concepts/system-one) 与 [State](/concepts/state)。

```python
system_one(
    state: JSONContent,
    questions: Mapping[str, Question],
    *,
    model: str | None = None,
    retry: RetryPolicy | None = None,
    timeout: float | httpx2.Timeout | None = None,
    extra_headers: Mapping[str, str] | None = None,
    extra_body: Mapping[str, JSONValue | None] | None = None,
    response_model: type[ResponseT] | None = None,
) -> SystemOneResponse | ResponseT
```

异步版是 `async`，返回同样的类型。

| 参数 | 含义 |
| --- | --- |
| `state` | 要评估的文本、JSON 对象或数组 |
| `questions` | 非空映射：名字 → 问题对象或原始字典 |
| `model` | 覆盖客户端默认模型 |
| `retry` / `timeout` / `extra_headers` | 只覆盖这一次调用 |
| `extra_body` | 浅合并到请求体。后写覆盖 `state` / `model` / `questions`，对象值整段替换，不做深合并 |
| `response_model` | 可选的 Pydantic `BaseModel`，描述 JSON 响应体（含嵌套答案） |

未传 `response_model` 时返回 `SystemOneResponse`。问题为空、Score 的 `criteria` 为空抛 `TypeSafeError`。重试后仍非成功 HTTP 抛 `TypeSafeAPIError`。连不上或超时抛 `TypeSafeAPIConnectionError`。响应体对不上模型抛 `TypeSafeAPIResponseValidationError`。

用命名参数构造问题：

```python
from typesafe_sdk import Choice, Noul, TypeSafeClient

with TypeSafeClient() as client:
    result = client.system_one(
        state="I was charged twice. Please help.",
        questions={
            "billing": Noul(instructions="Is this about billing?"),
            "tone": Choice(
                instructions="What is the tone?",
                criteria={"calm": None, "angry": None},
            ),
        },
    )
    assert 0 <= result.nouls["billing"].noul <= 1
    assert result.choices["tone"].choice in {"calm", "angry"}
```

也可以直接传原始字典（向前兼容）：

```python
with TypeSafeClient() as client:
    result = client.system_one(
        state={"message": "I was charged twice. Please help."},
        questions={
            "billing": {"type": "noul", "instructions": "Is this about billing?"},
            "tone": {
                "type": "choice",
                "instructions": "What is the tone?",
                "criteria": {"calm": None, "angry": None},
            },
        },
    )
```

异步：

```python
import asyncio

from typesafe_sdk import AsyncTypeSafeClient, Choice, Noul

async def main() -> None:
    async with AsyncTypeSafeClient() as client:
        result = await client.system_one(
            state="I was charged twice. Please help.",
            questions={
                "billing": Noul(instructions="Is this about billing?"),
                "tone": Choice(
                    instructions="What is the tone?",
                    criteria={"calm": None, "angry": None},
                ),
            },
        )
        assert 0 <= result.nouls["billing"].noul <= 1

asyncio.run(main())
```

`close()` 释放网络资源并关闭底层 HTTP 客户端（包括你传入的那个）。上下文管理器会自动调用。

### 模型列表

`client.models`（同步是 `Models`，异步是 `AsyncModels`）访问账号可用模型。

```python
list(
    *,
    retry: RetryPolicy | None = None,
    timeout: float | httpx2.Timeout | None = None,
    extra_headers: Mapping[str, str] | None = None,
) -> ListModelsResponse
```

`ListModelsResponse.models` 里每项有 `name`、`description`、`release_date`。当前列表主要是别名；像 `jev-1.13.0` 这样的版本化 ID 即使不出现在列表里，也可以写进 `model` 字段。见 [模型](/models)。

```python
with TypeSafeClient() as client:
    models = client.models.list()
```

```python
async with AsyncTypeSafeClient() as client:
    models = await client.models.list()
```

## 问题类型 Choice / Score / Noul

`state` 是要提问的文本或 JSON 对象，不能是 `None`，但对象内部的值可以是 `None`。用 `Noul`、`Choice`、`Score` 定义问题。三种问题的 `instructions` 都可以是字符串、对象或数组。详见 [原语](/primitives) 与 [高级：结构](/primitives/advanced)。

公共别名：

```python
JSONValue = str | int | float | bool | Sequence[JSONValue | None] | Mapping[str, JSONValue | None]
JSONContent = str | Mapping[str, JSONValue | None] | Sequence[JSONValue | None]
```

### `Noul`

是/否问题，可选地描述 yes / no。见 [Noul](/primitives/noul)。

```python
Noul(
    instructions: JSONContent | None = None,
    criteria: NoulCriteria | None = None,
)
```

`type` 固定为 `"noul"`。`NoulCriteria` 是 TypedDict：`true` / `false` 各为 `JSONContent | None`，`None` 表示不加描述。

### `Choice`

从具名选项里选一项。见 [Choice](/primitives/choice)。每个 Choice 最多 255 个选项。

```python
Choice(
    instructions: JSONContent | None = None,
    criteria: Mapping[str, JSONContent | None],
)
```

`type` 固定为 `"choice"`。`criteria` 必填：选项名 → 描述，或 `None` 表示不加描述。

### `Score`

按有序量表打分。见 [Score](/primitives/score)。至少两个等级，API 最多接受 10 个。

```python
Score(
    instructions: JSONContent | None = None,
    criteria: Sequence[JSONContent],
)
```

`type` 固定为 `"score"`。`criteria` 是非空有序列表，从 0 起每个分数一档。v0.6.0 起不再用整数键的字典。

```python
questions = {
    "billing": Noul(instructions="Is this ticket about billing?"),
    "tone": Choice(
        instructions="What is the customer's tone?",
        criteria={"calm": None, "frustrated": None, "angry": None},
    ),
    "urgency": Score(
        instructions="How urgent is this ticket?",
        criteria=["can wait", "this week", "today"],
    ),
}
```

## 答案类型

`SystemOneResponse` 按问题类型分组答案，并带上模型和用量。未知额外字段忽略；模型冻结且严格。

| 属性 | 类型 | 含义 |
| --- | --- | --- |
| `model` | `str` | 实际作答的模型，别名会解析成版本化 ID（例如 `jev-1.13.0`） |
| `usage` | `Usage` | `input_tokens` / `output_tokens`，API 未报告时为 `None` |
| `answers` | `dict[str, Answer]` | 全部答案，按问题名索引 |
| `nouls` | `dict[str, NoulAnswer]` | 只含 Noul |
| `choices` | `dict[str, ChoiceAnswer]` | 只含 Choice |
| `scores` | `dict[str, ScoreAnswer]` | 只含 Score |
| `request_id` | `str` | `x-typesafe-request-id` 响应头 |
| `raw_http_response` | `httpx2.Response` | 底层 HTTP 响应 |

### `NoulAnswer`

| 字段 | 含义 |
| --- | --- |
| `type` | `"noul"` |
| `noul` | yes / 为真的概率，0–1。靠近 1 偏 yes，靠近 0 偏 no，靠近 0.5 表示不确定 |

### `ChoiceAnswer`

| 字段 | 含义 |
| --- | --- |
| `type` | `"choice"` |
| `choice` | `criteria` 里概率最高的选项名 |
| `probabilities` | 每个选项的概率，按选项名索引，约和为 1 |
| `confidence` | 对所选选项的置信度，0–1。低值适合送人工。见 [Confidence](/confidence) |

### `ScoreAnswer`

| 字段 | 含义 |
| --- | --- |
| `type` | `"score"` |
| `score` | 期望分数：各等级按概率加权。可以落在整数档之间 |
| `legend` | 等级序号 → 描述 |
| `probabilities` | 各等级的概率 |
| `confidence` | 对分数的置信度，0–1 |

```python
print(response.nouls["billing"].noul)
print(response.choices["tone"].choice)
print(response.choices["tone"].confidence)
print(response.scores["urgency"].score)
print(response.usage.input_tokens, response.request_id)
```

用 `response_model` 把答案提升成属性，见 [Python 用法](/sdk/python/usage)。

## 重试

`RetryPolicy` 是 dataclass，控制尝试次数、可重试状态码、退避，以及是否尊重重试头。

```python
RetryPolicy(
    max_retries: int = 2,
    backoff_initial: float = 0.5,
    backoff_max: float = 5.0,
    backoff_jitter: float = 0.25,
    http_statuses: set[int] = {408, 429, *range(500, 600)},
    respect_retry_after: bool = True,
    api_connection_error: bool = True,
    api_timeout_error: bool = True,
    exceptions: set[type[BaseException]] = set(),
    predicate: Callable[[BaseException], bool] | None = None,
    timeout: float | None = 30.0,
)
```

| 字段 | 含义 |
| --- | --- |
| `max_retries` | 首次尝试之后的最大重试次数；`0` 关闭重试 |
| `backoff_initial` | 第一次退避秒数，之后加倍直到 `backoff_max`；`0` 关闭退避 |
| `backoff_max` | 退避上限（秒） |
| `backoff_jitter` | 从每次退避里随机减去的比例，0–1 |
| `http_statuses` | 会重试的 HTTP 状态码。默认 `408`、`429`、`500–599` |
| `respect_retry_after` | 是否尊重 `Retry-After` 与 `retry-after-ms` |
| `api_connection_error` | 是否重试 `TypeSafeAPIConnectionError` |
| `api_timeout_error` | 是否重试 `TypeSafeAPITimeoutError` |
| `exceptions` | 额外会触发重试的异常类型 |
| `predicate` | 可选谓词，对抛出的异常返回 `True` 则再试一次 |
| `timeout` | 整次 SDK 调用的重试预算（秒），含首次尝试和等待；`None` 不限制。下一次等待会用尽预算时停止，并重新抛出最后一次错误 |

```python
from typesafe_sdk import RetryPolicy, TypeSafeClient

client = TypeSafeClient(
    retry=RetryPolicy(
        max_retries=3, timeout=10.0, http_statuses={429, 500, 502, 503, 504}
    )
)
```

限流语义见 [HTTP API](/api)。

## 异常

基类 `TypeSafeError`。HTTP 错误都继承 `TypeSafeAPIError`。

### `TypeSafeAPIError`

不成功的 HTTP 响应，带 body 与请求元数据。

| 属性 | 含义 |
| --- | --- |
| `status` | HTTP 状态码 |
| `body` | 服务器 JSON 错误体、纯文本，或空 body 时的 `None` |
| `headers` | 响应头 |
| `endpoint` | 方法与 URL，不含凭证、查询串、fragment |
| `request_id` | `x-typesafe-request-id`，没有则为 `None` |

| 子类 | 状态 | 含义 |
| --- | --- | --- |
| `TypeSafeBadRequestError` | 400 | 请求非法 |
| `TypeSafeAuthenticationError` | 401 | 鉴权失败 |
| `TypeSafePermissionDeniedError` | 403 | 拒绝访问 |
| `TypeSafeNotFoundError` | 404 | 资源不存在 |
| `TypeSafeUnprocessableEntityError` | 422 | 服务端校验失败 |
| `TypeSafeRateLimitError` | 429 | 超出限流。另有 `retry_after_ms` |
| `TypeSafeInternalServerError` | 5xx | 服务端处理失败 |

```python
from typesafe_sdk import TypeSafeAPIError

try:
    client.system_one(state, questions)
except TypeSafeAPIError as error:
    print(error.status, error.request_id)
```

### 连接错误

* `TypeSafeAPIConnectionError` — 没有拿到 HTTP 响应（也是 `ConnectionError`）
* `TypeSafeAPITimeoutError` — 超过配置的超时（也是 `TimeoutError`）。`timeout` 是这次请求用的超时设置

### 响应校验

`TypeSafeAPIResponseValidationError`：HTTP 成功，但 body 缺字段或结构不对。`field_path` 是出错字段的点分路径，例如 `answers.tone.confidence`。

## 常量

`typesafe_sdk.constants` 里的环境变量名和客户端默认值：

| 常量 | 值 |
| --- | --- |
| `API_KEY_ENV` | `'TYPESAFE_API_KEY'` |
| `BASE_URL_ENV` | `'TYPESAFE_BASE_URL'` |
| `DEFAULT_MODEL_ENV` | `'TYPESAFE_DEFAULT_MODEL'` |
| `LOG_LEVEL_ENV` | `'TYPESAFE_LOG_LEVEL'` |
| `DEFAULT_BASE_URL` | `'https://api.typesafe.ai'` |
| `DEFAULT_MODEL` | `'jev-latest'` |
| `DEFAULT_TIMEOUT` | `10.0`（每次 HTTP 操作，秒） |
