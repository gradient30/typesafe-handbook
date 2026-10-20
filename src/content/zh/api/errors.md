# 请求规则与错误

> 请求限制、压缩，以及 HTTP 状态码

## 请求规则

以下规则适用于每一次请求：

| 规则 | 限制 |
| - | - |
| Body size | 最多 32 MiB。Headers 不计入。 |
| Encoding | UTF-8 JSON，且不得带字节顺序标记（BOM）。 |
| Nesting | `state`、`instructions`、`criteria` 各自最多 64 层对象 / 数组嵌套。更深的内容请先拍平。 |
| Numbers | 只接受有限数字。`NaN`、`Infinity`，以及大到无法表示的数（如 `1e400`）都会被拒绝。标识符和需要精确的大数量请用字符串发送。 |

正文超过 32 MiB 返回 `413`；其余规则违反返回 `400`。

### Compression

可以用 `Content-Encoding: gzip`（或 `x-gzip`）或 `zstd` 压缩正文。只允许一层压缩，zstd 的窗口最多 8 MiB。32 MiB 限制同时适用于压缩前后的正文。不支持的 `Content-Encoding` 或超过一层压缩返回 `415`；压缩正文损坏返回 `400`。

## Errors

错误使用标准 HTTP 状态码，并附带说明问题的 JSON 正文。

| Status | Meaning |
| - | - |
| `400 Bad Request` | 正文违反了某条[请求规则](#request-rules)，例如非法 UTF-8、嵌套过深、非有限数字，或压缩正文损坏。若带 `max_tokens_exceeded`，表示请求超过了模型的[上下文长度](/models)。 |
| `401 Unauthorized` | 缺少或无效的 API key。请检查 `Authorization` 头。 |
| `413 Payload Too Large` | 正文超过 32 MiB。见[请求规则](#request-rules)。 |
| `415 Unsupported Media Type` | 正文使用了不支持的 `Content-Encoding`，或超过一层压缩。见 [Compression](#compression)。 |
| `422 Unprocessable Entity` | 请求体未通过校验，例如缺少必填字段或问题格式错误。正文会指出出错字段。 |
| `429 Too Many Requests` | 超过了限流。请退避后稍后再试。 |
| `529 Overloaded` | TypeSafe 暂时过载。请稍后重试。 |

## 处理限流 {#handling-rate-limits}

收到 `429 Too Many Requests` 或 `529 Overloaded` 时，请用指数退避重试，不要立刻连打。[客户端 SDK](/sdk) 默认会处理重试；若使用 SDK 且保留默认重试策略，无需额外处理。
