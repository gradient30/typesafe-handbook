# 高级用法

## 性能

如果你的应用每秒发送数百个请求，请遵循这些建议。

### 重用客户端

发送多个请求时确保重用客户端实例。设置新客户端涉及启动新连接和 TLS 握手的开销。

### 确保 `zstd` 可用

客户端使用 [zstd](https://facebook.github.io/zstd/) 压缩 1 KiB 或更大的请求正文，这减少了上传大小和时间，尤其对于大型 state。

确保在 Python 3.14 之前的版本上安装 `zstd`：

```shell
uv add "typesafe-sdk[zstd]"
```

可以通过 `compression` 客户端构造函数参数配置或禁用压缩。

### 为异步代码使用 `aiohttp`

对于高请求率的异步代码，从 [`httpx-aiohttp`](https://pypi.org/project/httpx-aiohttp/) 传递基于 [aiohttp](https://docs.aiohttp.org/) 的 HTTP 客户端：

```shell
uv add "httpx-aiohttp[httpx2]"
```

```python
from httpx_aiohttp.httpx2 import Httpx2AiohttpClient

from typesafe_sdk import AsyncTypeSafeClient

client = AsyncTypeSafeClient(http_client=Httpx2AiohttpClient())
```

### 每个线程创建一个客户端

`TypeSafeClient` 可以在线程间共享，但在高负载下其连接池成为瓶颈。为每个线程创建一个客户端，并在该线程发送的每个请求中重用它。

### HTTP/2

客户端默认使用 HTTP/1.1，可以切换到 HTTP/2：

* **HTTP/1.1** 每个连接一次发送一个请求，并为每个并发请求打开一个连接，直到 [连接限制](/sdk/python/usage/advanced#keep-a-connection-limit)。并发随连接数扩展，代价是每个新连接的 TLS 握手。
* **HTTP/2** 将一个客户端的每个请求复用到单个连接上。它只需要一次握手和一个套接字，但该连接限制了客户端的吞吐量。

对于高请求率保持默认的 HTTP/1.1。对于低到中等并发使用 HTTP/2，当你想要更少的连接时，例如在限制连接的代理或防火墙后面。

要启用 HTTP/2，安装 `'typesafe-sdk[http2]'` extra 并传递 HTTP/2 客户端。

### 保持连接限制

默认客户端最多打开 100 个连接，并在空闲时将所有连接保持打开 30 秒，因此突发请求重用连接而不是打开新连接。提供自己的 `http_client` 时确保设置适当的限制。

## 日志记录

SDK 记录到 `typesafe_sdk` 日志记录器。根据 [标准日志记录](https://docs.python.org/3/library/logging.html) 指南配置它：

```python
import logging

logging.getLogger("typesafe_sdk").setLevel(logging.DEBUG)
```

或在导入 SDK 之前将 `TYPESAFE_LOG_LEVEL` 设置为 `debug`、`info`、`warning`、`error` 或 `off` 之一。

`info` 每个请求记录一行摘要；`debug` 还记录请求和响应头以及正文。密钥头——授权、API 密钥、cookies 以及名称包含 `token` 或 `secret` 的任何头——从日志输出中被编辑。请求和响应正文 **不被** 编辑。

## 向前兼容性

SDK 随着 TypeSafe API 的演进而继续工作，因此你可以在 SDK 发布添加一流支持之前采用新的 API 功能。

### 额外请求字段

使用 [`extra_body`](/sdk/python/api/clients/sync) 发送额外的 API 请求字段。下面的 `beam_width` 字段是说明性的；仅发送 API 支持的字段。

### 原始问题字典

可以传递原始字典而不是类型化对象。

### 未知答案类型

SDK 记录警告并跳过无法识别的答案类型。使用 `raw_http_response` 检查完整的 API 响应，包括那些答案。

### 未知响应字段

已识别响应上的未知额外字段被忽略。
