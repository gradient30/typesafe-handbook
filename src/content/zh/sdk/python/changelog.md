# Python 变更记录

> TypeSafe Python SDK 的版本记录。完整条目见英文原文。

本页是短摘要。安装与用法见 [Python SDK](/sdk/python)，签名见 [Python API 参考](/sdk/python/api)。

## v0.7.0（2026-09-18）

**破坏性变更**

* 序列化库从 `msgspec` 换成 `pydantic`

**缺陷修复**

* `str` 子类现在会正确序列化成字符串，而不是字符列表

**功能**

* `system_one` 新增 `response_model` 参数，可传入所需的 `pydantic` 模型，进一步提升 *type-safety*

## v0.6.0（2026-09-15）

**破坏性变更**

* `Score.criteria` 改为有序序列，不再用整数作键的字典

**功能**

* 输入类型注解改为接受 `Mapping`、`Sequence` 等抽象类型
* 错误信息带上 HTTP 细节与元数据

**缺陷修复**

* 处理 `RetryPolicy` 中的非法值
* 异常与响应可 pickle

**文档**

* 从主文档链到更多概念页

## v0.5.7（2026-09-14）

TypeSafe Python SDK 的首次公开发布。详见 [Python SDK](/sdk/python)。
