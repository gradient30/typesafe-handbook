# Images

> 在 System One 请求中发送图像：在状态中、问题的说明内，以及作为问题判断的标准。

> **Dreamer-ready。** 图像和 Box 问题尚未达到我们称之为生产就绪的标准，但我们很高兴让梦想者和构建者试用。使用它们来构建原型和尝试想法。此页面的请求格式、答案和限制可能在版本之间变化，准确度也会随模型更新而改变。在 [Discord](https://discord.gg/typesafe) 上告诉我们你构建了什么，以及什么坏了。
>
> 要使用图像或 Box 问题，请在每个包含图像或 Box 问题的请求中发送 `TypeSafe-Danger-Zone-Images: true` 头。参见 [开启图像](/images#turning-on-images)。

图像可以出现在 System One 请求中文本可以出现的任何地方：在 `state` 中、问题的 `instructions` 中，以及其 `criteria` 中。每种问题类型都接受图像，[Box](/primitives/box) 问题类型返回某物在图像中的位置。

## 开启图像

图像和 [Box](/primitives/box) 问题默认关闭。要使用它们，请在每个包含图像或 Box 问题的请求中发送 `TypeSafe-Danger-Zone-Images: true` 头。[上传图像](#uploading-images) 下的示例显示了如何。本页面的其他示例只显示请求体。

## 在请求中发送图像

每张图像在请求的顶级 `assets` 映射中列出一次。该映射中的键是引用字符串。将引用写在图像所属的地方，作为完整字符串值或在更长字符串内，模型会在其位置接收图像。

此请求将找到的狗的照片作为状态发送，并将走失狗海报的照片直接放入一个问题中：

```json
{
  "model": "jev-latest",
  "state": {
    "photo": "a3f1c2e8-found"
  },
  "assets": {
    "a3f1c2e8-found": {"type": "image", "format": "jpg", "data_base64": "/9j/4AAQSkZJRg..."},
    "77b0d4a1-poster": {"type": "image", "format": "jpg", "data_base64": "/9j/4AAQSkZJRg..."}
  },
  "questions": {
    "same_dog": {
      "type": "noul",
      "instructions": "Is the dog in `photo` the same dog as in this picture: 77b0d4a1-poster?"
    },
    "has_collar": {
      "type": "noul",
      "instructions": "Is the dog in `photo` wearing a collar?"
    },
    "coat": {
      "type": "choice",
      "instructions": "What is the coat of the dog in `photo` like?",
      "criteria": {
        "short": "Short and smooth.",
        "long": "Long or feathered.",
        "curly": "Curly or wiry."
      }
    }
  }
}
```

问题可以通过反引号中的名称或路径引用状态中的图像，方式与引用任何其他字段相同（参见 [引用特定字段](/primitives#reference-specific-fields)）。仅一个问题使用的图像直接放在该问题的 `instructions` 或 `criteria` 中，如上海报照片所示。

Jev 1.13 和 Jev 1.14 都接受图像。[Box](/primitives/box) 问题需要 Jev 1.14。

### 资产字段

`assets` 是请求中的图像，按引用字符串键控。每个引用必须出现在 `state`、`instructions` 或 `criteria` 中某处。

资产属性：

- `type`：资产种类。可选。如果发送，必须是 `"image"`。
- `part`：在 multipart 请求中，持有图像的文件部分的名称。参见 [上传图像](#uploading-images)。
- `data_base64`：图像文件，base64 编码。除非设置了 `part`，否则必需。使用标准 base64 字母表，带 `=` 填充，无换行或其他空白，无 `data:` 前缀。
- `format`：图像格式，小写。与 `data_base64` 一起必需。与 `part` 一起可选。`"jpeg"` 是 `"jpg"` 的另一个名称。

每种图像一种方式发送，用 `part` 或 `data_base64`。如果资产两者都有，API 使用 `part`。

### 引用

引用作为纯文本在请求的字符串中任何地方匹配，因此引用在句子中途和作为完整值都有效。短引用如 `cat` 也可能匹配在 `category` 内。使用不会意外出现在文本中的引用。每个请求中每张图像的新 UUID 是最安全的选择。

* **每个资产必须被引用。** 有未在任何地方引用的资产的请求返回 `400`。
* **完整值首先匹配。** 恰好是引用的字符串变成该图像。在更长字符串中，引用从左到右替换，匹配从不重叠。
* **每次使用再次添加图像。** 文件上传一次，但其引用出现的每个地方都会向模型读取的内容添加另一份图像副本，每个副本计入 [扩展请求限制](#limits)。
* **对象键不被替换。** Choice 选项名称、问题 ID 或任何其他对象键保持文本。要用图片定义 Choice 选项，将引用放在选项的描述中，如 [Criteria](#criteria) 中所示。
* **答案包含引用，而不是图像，** 无论它们在哪里重复你的标准，如 Score 的 `legend`。
* **保持键短。** 每个引用最多 1,024 字节 UTF-8，请求中所有引用一起最多 65,536 字节。这些限制计算字节，而非字符。引用不能为空或仅空白。

Python 和 JavaScript SDK 为你创建引用。参见 [上传图像](#uploading-images)。

## 上传图像

使用最新的 Python 或 JavaScript SDK，将图像对象放在文本可以去的任何地方。SDK 为其创建引用并上传文件。此示例将一张门铃照片作为状态发送，并询问关于它的两个问题：

```python
from pathlib import Path

from typesafe_sdk import Choice, Image, Noul, TypeSafeClient

with TypeSafeClient() as client:
    result = client.system_one(
        state={"door": Image(Path("door-camera.jpg"))},
        questions={
            "person_present": Noul(instructions="Is there a person in `door`?"),
            "carrying": Choice(
                instructions="What is the person in `door` carrying?",
                criteria={
                    "package": "A box or parcel.",
                    "bag": "A bag of groceries or shopping.",
                    "nothing": "Empty hands.",
                },
            ),
        },
        extra_headers={"TypeSafe-Danger-Zone-Images": "true"},
    )
    print(result.answers)
```

```typescript
import { openAsBlob } from "node:fs";
import { choice, image, noul, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();
const door = image(await openAsBlob("door-camera.jpg"));

const { answers } = await client.systemOne(
  {
    state: { door },
    questions: {
      person_present: noul("Is there a person in `door`?"),
      carrying: choice("What is the person in `door` carrying?", {
        package: "A box or parcel.",
        bag: "A bag of groceries or shopping.",
        nothing: "Empty hands.",
      }),
    },
  },
  { headers: { "TypeSafe-Danger-Zone-Images": "true" } },
);
console.log(answers);
```

要将图像放入句子内，或选择自己的引用，参见 [SDK 指南](/sdk)。

### 通过 HTTP

没有 SDK 时，在 `multipart/form-data` 请求中将每张图像作为文件部分发送。Multipart 是更好的选择：它按原样发送文件，而 base64 使每张图像大约大三分之一，该额外大小计入 32 MiB [请求体限制](#limits)。仅当你无法发送 multipart 时，将图像 base64 编码到 JSON 中。

**Multipart（推荐）：** 将 JSON 体作为第一部分发送，名为 `request`，内容类型 `application/json`。将每张图像作为其自己的文件部分发送，并在 `assets` 中将该图像的 `part` 设置为文件部分的名称：

```bash
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "TypeSafe-Danger-Zone-Images: true" \
  -F 'request={
    "model": "jev-latest",
    "state": {"door": "a3f1c2e8-door"},
    "assets": {"a3f1c2e8-door": {"type": "image", "part": "door-photo"}},
    "questions": {
      "person_present": {"type": "noul", "instructions": "Is there a person in `door`?"}
    }
  };type=application/json' \
  -F 'door-photo=@door-camera.jpg;type=image/jpeg'
```

multipart 请求规则：

* 第一部分名为 `request` 并持有 JSON 体。
* 部分名称唯一且非空。`request` 为 JSON 体保留。
* 每个图像部分有内容类型 `image/png`、`image/jpeg`、`image/jpg` 或 `application/octet-stream`，或无内容类型。任何其他内容类型返回 `400`。
* 每个文件部分恰好属于一个资产。没有资产命名的部分、两个资产命名相同部分，以及其部分缺失的资产都返回 `400`。

要在多个地方使用同一图像，在每个地方写入其引用。

**JSON 中的 Base64：** 将文件 base64 编码到 `data_base64` 并设置 `format`，遵循 [资产字段](#asset-fields) 中的规则。Python 的 `base64.b64encode` 产生正确编码。

## 图像放置

### State

`state` 中的图像是状态的一部分，与那里的任何文本或 JSON 相同。模型与状态的其余部分一起评估它们，请求中的每个问题都针对它们评估。状态可以混合图像与文本，并可持有多张图像，像任何其他状态数据一样标记或嵌套。此状态持有相机帧的简短历史，最旧的在前：

```json
{
  "state": {
    "frames": [
      {"seconds_ago": 2, "frame": "5c0e9a12-f1"},
      {"seconds_ago": 1, "frame": "1d7be0c4-f2"},
      {"seconds_ago": 0, "frame": "e48a6f30-f3"}
    ]
  }
}
```

问题可以询问 "Did the door in `frames` open during these frames?" 或通过路径引用一个帧，如 `` `frames[2].frame` ``。

### Instructions

问题 `instructions` 中的图像是该问题的一部分，仅与该问题一起发送。将引用放在问题需要图像的句子中。

（更多细节、限制和最佳实践请参见官网完整页面。本译本聚焦架构与关键用法。）
