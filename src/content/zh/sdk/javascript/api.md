# JavaScript API 参考

> `TypeSafeClient`、`choice` / `score` / `noul` 工厂、答案推断与错误类型。不展开自动生成的 class 子页。

包名 `@typesafe-ai/sdk`，需要 Node.js 20+。安装与第一次调用见 [JavaScript SDK](/sdk/javascript)。HTTP 形状见 [HTTP API](/api)。

## 客户端

```ts
class TypeSafeClient {
  constructor(config?: TypeSafeClientConfig);
  readonly baseURL: string;
  readonly defaultModel: string;
  readonly logLevel: LogLevel;
  readonly logger: Logger;
  readonly retry: RetryPolicy;
  readonly timeout: number;
  readonly defaultHeaders: Readonly<Record<string, string>>;
  readonly fetch: Fetch;
  readonly models: Models;

  systemOne<const Q extends Questions>(
    request: SystemOneRequest<Q>,
    options?: RequestOptions,
  ): APIPromise<SystemOneResult<Q>>;
}
```

显式配置优先于环境变量，再回落到 SDK 默认。空或纯空白的环境值会被忽略。缺少 API key、配置非法或不支持的运行时抛 `TypeSafeError`。浏览器默认拒绝；只有设了 `dangerouslyAllowBrowser: true` 才允许（会把 API key 暴露给页面用户）。

### `TypeSafeClientConfig`

| 字段 | 含义 | 默认 |
| --- | --- | --- |
| `apiKey` | API key；否则读 `TYPESAFE_API_KEY` | 必填 |
| `baseURL` | API 根；否则 `TYPESAFE_BASE_URL` | `https://api.typesafe.ai` |
| `defaultModel` | 默认模型；否则 `TYPESAFE_DEFAULT_MODEL` | `jev-latest` |
| `logLevel` | `debug` / `info` / `warn` / `error` / `off`；否则 `TYPESAFE_LOG_LEVEL` | `warn` |
| `logger` | 按 `logLevel` 过滤的 logger | 带前缀的 `console` |
| `retry` | 对默认 `RetryPolicy` 的部分覆盖 | 见下 |
| `timeout` | 单次尝试超时（毫秒），没有总重试预算 | `10000` |
| `defaultHeaders` | 额外请求头；单次调用的 headers 优先 | `{}` |
| `dangerouslyAllowBrowser` | 允许在浏览器里用 | `false` |
| `fetch` | 自定义 `fetch` | 全局 `fetch` |

`info` 打请求摘要；`debug` 再打 headers 和 body。已知凭证类 headers 会打码，body 不会。

### `systemOne`

```ts
const response = await client.systemOne({
  state: { document: "I was charged twice. Please fix this ASAP." },
  questions: {
    category: choice("What is this ticket about?", {
      billing: null,
      technical: null,
      other: null,
    }),
  },
});

console.log(response.answers.category.choice);
```

`SystemOneRequest<Q>`：

| 字段 | 含义 |
| --- | --- |
| `state` | 文本、JSON 对象 / 数组，或 `null` |
| `questions` | 非空；键是答案里用的名字 |
| `model` | 覆盖 `defaultModel` |

请求对象上的额外属性会原样转发，包括 `null`。问题为空、Score 的 `criteria` 不是至少两项的列表时抛 `TypeSafeError`。

`RequestOptions` 只覆盖这一次：`signal`（`AbortSignal`）、`timeout`（毫秒）、`retry`（`Partial<RetryPolicy>`）、`headers`。

返回 `APIPromise<SystemOneResult<Q>>`。答案类型从问题推断：`response.answers.category` 是 `ChoiceResponse`，其 `choice` 是你在 `criteria` 里写过的键。

```ts
interface SystemOneResult<Q extends Questions> {
  readonly model: string;
  readonly answers: { readonly [K in keyof Q]: ResultFor<Q[K]> };
  readonly usage: Usage; // input_tokens, output_tokens
}
```

### 模型列表

```ts
const models = await client.models.list();
for (const model of models) {
  console.log(model.name, model.release_date, model.description);
}
```

`ModelCard`：`name`、`description`、`release_date`。可用模型与别名见 [模型](/models)。

## 问题工厂

`choice`、`noul`、`score` 生成带 `type` 的问题对象。`instructions` 与 `criteria` 都可以是字符串、对象、数组或 `null`。

```ts
function noul(
  instructions?: EntryType,
  criteria?: { true?: EntryType; false?: EntryType } | null,
): NoulQuestion;

function choice<T extends ChoiceCriteria>(
  instructions: EntryType | undefined,
  criteria: T,
): ChoiceQuestion<T>;

function score<T extends ScoreCriteria>(
  instructions: EntryType | undefined,
  criteria: T,
): ScoreQuestion<T>;
```

`ScoreCriteria` 是至少两项的只读元组。也可以手写对象：

```ts
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();
const { answers } = await client.systemOne({
  state: "I was charged twice. Please help ASAP.",
  questions: {
    billing: noul("Is this about billing?"),
    tone: choice("What is the tone?", { calm: null, angry: null }),
    urgency: score("How urgent is this?", ["low", "medium", "high"]),
  },
});

console.log(answers.billing.noul, answers.tone.choice, answers.urgency.score);
```

| 问题 | `type` | `criteria` | 答案 |
| --- | --- | --- | --- |
| `NoulQuestion` | `"noul"` | 可选 `{ true?, false? }` | `NoulResponse`：`noul`（0–1） |
| `ChoiceQuestion` | `"choice"` | 选项名 → 描述或 `null` | `ChoiceResponse`：`choice`、`probabilities`、`confidence` |
| `ScoreQuestion` | `"score"` | 有序等级，至少两项 | `ScoreResponse`：`score`、`legend`、`probabilities`、`confidence` |

`ResultFor<Q>` 根据问题的 `type` 选出对应答案，并保留 Choice / Score 的 `criteria` 键。Choice 和 Score 的 `confidence` 从概率分布得到，见 [Confidence](/confidence)。原语语义见 [Choice](/primitives/choice)、[Score](/primitives/score)、[Noul](/primitives/noul)。

## 重试

```ts
interface RetryPolicy {
  readonly maxRetries: number;          // 默认 2；0 关闭
  readonly backoffInitialMs: number;    // 默认 500
  readonly backoffMaxMs: number;        // 默认 5000
  readonly backoffJitter: number;       // 默认 0.25
  readonly httpStatuses: ReadonlySet<number>; // 默认 408、429、500–599
  readonly respectRetryAfter: boolean;  // 默认 true
  readonly maxRetryAfterMs: number;     // 默认 60000
  readonly apiConnectionError: boolean; // 默认 true
  readonly apiTimeoutError: boolean;    // 默认 true
}
```

构造客户端或单次 `systemOne` 都可以传 `Partial<RetryPolicy>`，未写的字段继承上一级。超时是**每次尝试**的毫秒数，没有总重试预算。服务端 `Retry-After` 超过 `maxRetryAfterMs` 时改用本地退避。

```ts
const client = new TypeSafeClient({
  retry: { maxRetries: 3, httpStatuses: new Set([429, 500, 502, 503, 504]) },
  timeout: 10_000,
});
```

## 异常

基类 `TypeSafeError`。HTTP 错误都继承 `APIError`：`status`、`headers`、`body`、`requestId`。

| 类 | 何时 |
| --- | --- |
| `BadRequestError` | 400 |
| `AuthenticationError` | 401 |
| `PermissionDeniedError` | 403 |
| `NotFoundError` | 404 |
| `UnprocessableEntityError` | 422 |
| `RateLimitError` | 429；另有 `retryAfterMs` |
| `InternalServerError` | ≥ 500 |
| `APIConnectionError` | 连不上或读响应失败 |
| `APITimeoutError` | 超过 `timeoutMs` |
| `APIUserAbortError` | 调用方 abort |

```ts
import { APIError, TypeSafeClient } from "@typesafe-ai/sdk";

try {
  await client.systemOne({ state, questions });
} catch (error) {
  if (error instanceof APIError) {
    console.error(error.status, error.requestId);
  }
  throw error;
}
```

`APIPromise` 包装底层 `fetch` Promise，解析 JSON 后把答案收成 `SystemOneResult`。

## 常量与环境变量

| 符号 | 含义 |
| --- | --- |
| `VERSION` | SDK 版本字符串 |
| `ENV` | 环境变量名（`apiKey`、`baseURL`、`defaultModel`、`logLevel`） |
| `LOG_LEVELS` | 合法日志级别 |
| `DEFAULT_BASE_URL` | `https://api.typesafe.ai` |
| `DEFAULT_MODEL` | `jev-latest` |

环境变量与 Python 客户端对齐：`TYPESAFE_API_KEY`、`TYPESAFE_BASE_URL`、`TYPESAFE_DEFAULT_MODEL`、`TYPESAFE_LOG_LEVEL`。
