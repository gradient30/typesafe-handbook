# Images

> 在 System One 请求中发送图像：在 state 中、问题的 instructions 内，以及作为问题评判标准的 criteria。

图像可以出现在 System One 请求中文本可以出现的任何地方：在 `state` 中、问题的 `instructions` 中，以及其 `criteria` 中。每种问题类型都接受图像，[Box](/primitives/box) 问题类型返回某物在图像中的位置。

## 开启图像

图像和 [Box](/primitives/box) 问题默认关闭。要使用它们，必须在每个包含图像或 Box 问题的请求中发送 `TypeSafe-Danger-Zone-Images: true` 头。[上传图像](#uploading-images) 下的示例展示了如何操作。本页其他示例仅展示请求正文。

## 在请求中发送图像

每个图像在请求的顶级 `assets` 映射中列出一次。该映射中的键是一个引用字符串。在图像所属的地方写入该引用，作为完整字符串值或更长字符串内部，模型就会在其位置接收到图像。

此请求将一只找到的狗的照片作为 state 发送，并将走失狗海报中的照片直接放入一个问题中：

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

问题可以通过名称或路径（用反引号）引用 state 中的图像，方式与引用任何其他字段相同（参见 [引用特定字段](/primitives#reference-specific-fields)）。仅一个问题使用的图像直接放入该问题的 `instructions` 或 `criteria` 中，如上例中的海报照片。

Jev 1.13 和 Jev 1.14 都接受图像。[Box](/primitives/box) 问题需要 Jev 1.14。

### Asset 字段

以一种方式发送每个图像，使用 `part` 或 `data_base64`。如果 asset 同时具有两者，API 使用 `part`。

### 引用

引用作为纯文本在请求的字符串中任何位置匹配，因此引用可以在句子中间工作，也可以作为完整值。短引用如 `cat` 也可能在 `category` 内部匹配。使用不会意外出现在你文本中的引用。每个请求中每个图像使用新的 UUID 是最安全的选择。

* **每个 asset 必须被引用。** 包含未被任何地方引用的 asset 的请求返回 `400`。
* **完整值优先匹配。** 完全等于引用的字符串成为该图像。在更长字符串中，引用从左到右替换，匹配从不重叠。
* **每次使用都会再次添加图像。** 文件上传一次，但其引用出现的每个地方都会向模型读取的内容添加另一份图像副本，每份副本都计入 [扩展请求限制](#limits)。
* **对象键不被替换。** Choice 选项名称、问题 ID 或任何其他对象键保持为文本。要用图片定义 Choice 选项，将引用放在选项的描述中，如 [Criteria](#criteria)。
* **答案包含引用，而非图像，** 无论它们在何处重复你的 criteria，例如 Score 的 `legend`。
* **保持键简短。** 每个引用最多 1,024 字节 UTF-8，请求中所有引用合计最多 65,536 字节。这些限制计算字节，而非字符。引用不能为空或仅空白。

Python 和 JavaScript SDK 会为你创建引用。参见 [上传图像](#uploading-images)。

## 上传图像

使用最新的 Python 或 JavaScript SDK，将图像对象放在文本可以出现的任何地方。SDK 为其创建引用并上传文件。此示例将一张门铃照片作为 state 发送并询问两个问题：

要将图像放入句子中，或选择自己的引用，请参阅 [SDK 指南](/sdk)。

### 通过 HTTP

不使用 SDK 时，将每个图像作为 `multipart/form-data` 请求中的文件部分发送。Multipart 是更好的选择：它按原样发送文件，而 base64 使每个图像大约大三分之一，额外大小计入 32 MiB [请求正文限制](#limits)。仅当无法发送 multipart 时，才将图像 base64 编码到 JSON 中。

## 图像放置

### State

`state` 中的图像是 state 的一部分，与其中的任何文本或 JSON 相同。模型将它们与其余 state 一起评估，请求中的每个问题都针对它们进行评估。state 可以混合图像与文本，并可以容纳多个图像，像任何其他 state 数据一样标记或嵌套。此 state 保存相机帧的简短历史，最旧的在前：

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

问题可以询问“这些帧期间 `frames` 中的门是否打开？”或通过路径引用一帧，例如 `` `frames[2].frame` ``。

### Instructions

问题 `instructions` 中的图像是该问题的一部分，仅与该问题一起发送。将引用放在问题需要图像的句子中：

```json
{
  "state": {"door": "e48a6f30-door"},
  "questions": {
    "is_badge_holder": {
      "type": "noul",
      "instructions": "Is the person in `door` the same person as in this badge photo: 9a21c7d3-badge?"
    }
  }
}
```

`instructions` 中的图像对于包含它的每个问题都会发送一次给模型。当多个问题使用同一图像时，将其放入 `state` 一次，并从每个问题通过路径引用它。这使用更少的 token 和更少的 [大小限制](#limits)。

### Criteria

Choice 选项、Score 级别和 Noul 的 `true` 与 `false` 定义都可以包含图像。此 Choice 对手势进行分类，每个选项由示例图片定义。选项名称是你的代码在 `choice` 中接收的值，图片是模型将手与之比较的内容：

```json
{
  "state": {"camera": "e48a6f30-cam"},
  "questions": {
    "gesture": {
      "type": "choice",
      "instructions": "Which gesture is the hand in `camera` making?",
      "criteria": {
        "thumbs_up": "0b6c51aa-thumb",
        "open_palm": {
          "description": "A hand held up with the palm facing the camera.",
          "examples": ["4fd2e7b9-palm1", "c83a0e15-palm2"]
        },
        "fist": "a7e94d02-fist",
        "none": "No hand, or a hand that matches none of the examples."
      }
    }
  }
}
```

选项可以是单独的图像（`thumbs_up`）、带有一个或多个示例的描述（`open_palm`），或仅文本（`none`）。`description` 和 `examples` 键是本示例中选择的名称，而非必需字段：criteria 接受任何 [结构](#structured-data)。

Score 和 Noul criteria 以相同方式接受图像：

* **Score 级别** 可以各自包含示例图片。手张开程度的 Score 可以使用闭合拳头、半开手和张开手作为其三个级别。
* **Noul criteria** 可以用图片定义 `true` 和 `false`。
