# Python 变更记录

> TypeSafe AI API 的 Python 客户端

## v0.7.2（2026-09-26）

**杂项**

* 为 `typesafe-sdk` 包增加 `http2` 额外依赖

**文档**

* 补充 `typesafe-sdk` 的 HTTP/2 使用说明

## v0.7.1（2026-09-21）

**缺陷修复**

* 提前校验 API key，并在日志异常中排除其值

**文档**

* 增加与 AI 网关配合使用的示例

## v0.7.2（2026-09-26）

**杂项**

* `typesafe-sdk` 增加 `http2` extra

**文档**

* 写明如何带 HTTP/2 使用 `typesafe-sdk`

## v0.7.1（2026-09-21）

**缺陷修复**

* 更早校验 API key，并避免把密钥写进已记录的异常

**文档**

* 补充通过 AI 网关使用 SDK 的示例

## v0.7.0（2026-09-18）

**破坏性变更**

* 序列化/反序列化库由 `msgspec` 改为 `pydantic`

**缺陷修复**

* `str` 子类现在会正确序列化为字符串，而非字符列表

**功能**

* `system_one` 方法新增 `response_model` 参数，可指定所需 `pydantic` 模型以获得额外 *type-safety*

## v0.6.0（2026-09-15）

**破坏性变更**

* `Score.criteria` 改为有序序列，不再使用以整数为键的字典

**功能**

* 改进 SDK 输入的类型注解，接受 `Mapping`、`Sequence` 等抽象类型
* 错误信息包含 HTTP 细节与元数据

**缺陷修复**

* 处理 `RetryPolicy` 中的非法值
* 使异常与响应可 pickle

**文档**

* 从主文档链接到更多概念页

## v0.5.7（2026-09-14）

TypeSafe Python SDK 的首次公开发布。详见 [Python SDK](/sdk/python)。
