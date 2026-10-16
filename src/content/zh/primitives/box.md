# Box

> Box 是 System One 的一种问题类型，用于在图像中定位目标。答案是包围目标的四个边，以图像宽度和高度的分数表示。

**Dreamer-ready。** 图像和 Box 问题目前尚未达到我们可称为生产就绪的标准，但我们鼓励探索者和构建者试用它们来制作原型和验证想法。请求格式、答案和本页限制可能在版本间变化，准确率也会随模型更新而改变。请在 [Discord](https://discord.gg/typesafe) 告诉我们你构建了什么以及遇到了什么问题。

要使用图像或 Box 问题，必须在每个包含图像或 Box 问题的请求中发送 `TypeSafe-Danger-Zone-Images: true` 头。详见 [开启图像](/images#turning-on-images)。

当需要知道图像中某物的位置时使用 Box：柜台上的杯子、扫描表单上的签名、门口的人。答案是一个边界框——包含目标的最小矩形，由四个边给出。Box 问题需要请求中包含图像；如何发送图像请参阅 [Images](/images)。Box 问题需要 Jev 1.14：将 `model` 设为 `jev-preview` 或 `jev-1.14.0`。

每个边是图像尺寸的分数，从左上角开始测量。`left` 和 `right` 是宽度的分数，`top` 和 `bottom` 是高度的分数，因此同一答案适用于任意图像尺寸。

## 请求结构

Box 问题有两个字段：

* `type`：始终为 `"box"`。
* `instructions`：要查找什么，以及在哪张图像中。不必是疑问句：“`photo` 中的咖啡杯”即可。

Box 不接受 `criteria`。以下请求在厨房照片中查找杯子，照片作为文件部分发送，并带有图像头：

```bash
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "TypeSafe-Danger-Zone-Images: true" \
  -F 'request={
    "model": "jev-preview",
    "state": {"photo": "6e1d0b7c-kitchen"},
    "assets": {"6e1d0b7c-kitchen": {"type": "image", "part": "kitchen-photo"}},
    "questions": {
      "mug": {"type": "box", "instructions": "the coffee mug in `photo`"}
    }
  };type=application/json' \
  -F 'kitchen-photo=@kitchen.jpg;type=image/jpeg'
```

要以 base64 编码在 JSON 正文中发送照片，或使用 SDK，请参阅 [上传图像](/images#uploading-images)。

一个请求可以混合 Box 问题与其他类型，所有问题都针对同一 state 进行评估。

## 响应结构

```json
{
  "model": "jev-1.14.0",
  "answers": {
    "mug": {
      "type": "box",
      "box": {
        "top": 0.25,
        "bottom": 0.82,
        "left": 0.44,
        "right": 0.84
      },
      "confidence": 0.92
    }
  },
  "usage": {"input_tokens": 290, "output_tokens": 21}
}
```

每个 Box 答案包含：

* `type`：TypeSafe 问题的类型。
* `box`：四个边 `top`、`bottom`、`left`、`right`，每个值在 0 到 1 之间。`left` < `right`，`top` < `bottom`。
* `confidence`：0 到 1 的数字。越高表示模型对答案越有把握。详见 [使用置信度](#using-confidence)。

## 读取 Box

要绘制或裁剪到该框，将每个边乘以图像的像素宽度或高度：

```python
from PIL import Image

image = Image.open("kitchen.jpg")
width, height = image.size
mug = response["answers"]["mug"]
edges = mug["box"]

box = (
    round(edges["left"] * width),
    round(edges["top"] * height),
    round(edges["right"] * width),
    round(edges["bottom"] * height),
)
image.crop(box).save("mug.jpg")
```

### 使用置信度

如何根据 Box 的置信度采取行动由你的应用决定。常见模式是选择一个阈值，对低于阈值的答案更加谨慎。目前没有推荐阈值，请在自己的图像上调优。当置信度低于阈值时，你可以：

* **在更好的图像上再问一次。** 发送更大版本的图像，或裁剪到框周围的区域并以更高分辨率询问相同的 Box 问题。[编写 Box 问题](#writing-box-questions) 涵盖了在大图像中查找小目标。
* **在裁剪前填充框。** 当裁剪不得切断目标任何部分时，在裁剪前将每个边向外移动。
* **用边缘问题检查框。** 询问目标是否越过每个边缘，如 [用边缘问题检查框](#check-a-box-with-edge-questions)。

以下代码在置信度低于阈值时填充框，并确保它保持在图像内：

```python
PAD = 0.05  # 每侧添加的图像分数。针对你的图像调优。
MIN_CONFIDENCE = 0.6  # 示例阈值。在你自己的图像上调优。

if mug["confidence"] < MIN_CONFIDENCE:
    edges = {
        "left": max(0.0, edges["left"] - PAD),
        "top": max(0.0, edges["top"] - PAD),
        "right": min(1.0, edges["right"] + PAD),
        "bottom": min(1.0, edges["bottom"] + PAD),
    }
```

然后使用填充后的 `edges` 进行裁剪，如上所示。

## 编写 Box 问题

**命名目标和图像。** “`photo` 中的咖啡杯”既指明了要找什么，也指明了在哪里找。当请求有多张图像时，反引号中的路径标识要搜索哪一张。

**目标可以是图片。** 将目标图像的引用直接放在 instructions 中：

```json
"instructions": "the person in `photo` who matches this badge photo: 9a21c7d3-badge"
```

**Box 答案始终是一个框。** 没有“未找到”的答案，因此关于不存在事物的 Box 问题仍会返回四个边。在同一请求中，用 [Noul](/primitives/noul) 询问目标是否在图像中，当 Noul 答案较低时忽略该框：

```json
"questions": {
  "mug_visible": {"type": "noul", "instructions": "Is there a coffee mug in `photo`?"},
  "mug": {"type": "box", "instructions": "the coffee mug in `photo`"}
}
```

**每个问题一个框。** Box 设计用于查找一个目标，每个答案是单个框。要查找多个不同事物，在同一请求中为每个询问一个 Box 问题。当图像可能包含多个相同事物时，描述你想要的那个，使其唯一匹配：“`photo` 中离水槽最近的杯子”。当无法用语言区分时，在 Box 旁添加一个 Choice，选项为 `none`、`one`、`several`。当答案为 `several` 时，将图像分割成区域并在每个区域上再次询问。

**在查找小事物前裁剪大图像。** 非常大图像中只有几十像素宽的目标可能被遗漏。先找到区域，例如用 Choice，其选项是图像的分块。然后在该分块上询问 Box 问题，并将其边转换回完整图像的分数。

### 用边缘问题检查框

要检查框是否切断了目标的一部分，裁剪到该框并针对每个边询问一个 Noul，例如“`crop` 中的杯子是否越过图像的左边缘？”对于 Noul 答案为 yes 的每个边向外移动，然后再次询问。

在 36 个绘画测试裁剪中（每个都有已知的目标部分被切断），四个边缘问题捕获了 30 个切断。单个“杯子的全部是否都在 `crop` 内？”问题捕获了 26 个。在完整图像上绘制框轮廓并询问捕获了 20 个。
