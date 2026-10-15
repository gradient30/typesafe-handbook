# Box

> Box 是 System One 的一种问题类型，用于在图像中定位某物的位置。答案是围绕它的框的四条边，以图像宽度和高度的分数形式给出。

> **Dreamer-ready。** 图像和 Box 问题尚未达到我们称之为生产就绪的标准，但我们很高兴让梦想者和构建者试用。使用它们来构建原型和尝试想法。此页面的请求格式、答案和限制可能在版本之间变化，准确度也会随模型更新而改变。在 [Discord](https://discord.gg/typesafe) 上告诉我们你构建了什么，以及什么坏了。
>
> 要使用图像或 Box 问题，请在每个包含图像或 Box 问题的请求中发送 `TypeSafe-Danger-Zone-Images: true` 头。参见 [开启图像](/images#turning-on-images)。

当需要知道图像中某物的位置时使用 Box：柜台上的杯子、扫描表单上的签名、门口的人。答案是一个边界框，即包含目标的最小矩形，以四条边给出。Box 问题需要请求中有图像；参见 [Images](/images) 了解如何发送。Box 问题需要 Jev 1.14：将 `model` 发送为 `jev-preview` 或 `jev-1.14.0`。

每条边是图像尺寸的分数，从左上角测量。`left` 和 `right` 是宽度的分数，`top` 和 `bottom` 是高度的分数，因此相同答案适用于任何图像尺寸。

## 请求结构

Box 问题有两个字段：

* `type`：始终为 `"box"`。
* `instructions`：要找什么，以及在哪张图像中。不必是问题："`photo` 中的咖啡杯" 就足够。

Box 不接受 `criteria`。此请求在厨房照片中找到杯子，作为文件部分发送，并带有图像头：

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

要将照片以 base64 编码在 JSON 体中发送，或使用 SDK，参见 [上传图像](/images#uploading-images)。

请求可以混合 Box 问题与其他类型，每个问题都针对相同状态评估。

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

每个 Box 答案有这些值：

* `type`：TypeSafe 问题的类型。
* `box`：四条边，`top`、`bottom`、`left` 和 `right`，每个从 0 到 1。`left` 小于 `right`，`top` 小于 `bottom`。
* `confidence`：从 0 到 1 的数字。越高表示模型对其答案越确定。参见 [使用置信度](#using-confidence)。

## 读取 Box

要绘制框或裁剪到它，将每条边乘以图像的像素宽度或高度：

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

如何根据 Box 的置信度行动取决于你的应用。常见模式是选择一个阈值，对低于它的答案更小心处理。目前没有推荐阈值，因此在你自己的图像上调优。当置信度低于你的阈值时，你可以：

* **在更好的图像上再次询问。** 发送更大版本的图像，或裁剪到框周围区域以更高分辨率，并在裁剪上询问相同的 Box 问题。[编写 Box 问题](#writing-box-questions) 涵盖在大图像中找到小目标。
* **在裁剪前填充框。** 当裁剪必须不切断目标任何部分时，在裁剪前将每条边向外移动。
* **用边缘问题检查框。** 询问目标是否继续超过每条边，如 [用边缘问题检查框](#check-a-box-with-edge-questions) 中所示。

此代码在置信度低于阈值时填充框，并保持在图像内：

```python
PAD = 0.05  # 在每侧添加的图像分数。为你的图像调优。
MIN_CONFIDENCE = 0.6  # 示例阈值。在你自己的图像上调优。

if mug["confidence"] < MIN_CONFIDENCE:
    edges = {
        "left": max(0.0, edges["left"] - PAD),
        "top": max(0.0, edges["top"] - PAD),
        "right": min(1.0, edges["right"] + PAD),
        "bottom": min(1.0, edges["bottom"] + PAD),
    }
```

然后使用填充后的 `edges` 如上代码裁剪。

## 编写 Box 问题

**命名目标和图像。** "`photo` 中的咖啡杯" 命名要找什么以及在哪里。当请求有多张图像时，反引号中的路径标识要搜索哪一张。

**目标可以是图片。** 将目标图像的引用直接放在说明中：

```json
"instructions": "the person in `photo` who matches this badge photo: 9a21c7d3-badge"
```

**Box 答案始终是一个框。** 没有 "未找到" 答案，因此关于缺失事物的 Box 问题仍返回四条边。在同一请求中，询问一个 [Noul](/primitives/noul) 目标是否在图像中，当 Noul 答案低时忽略该框：

```json
"questions": {
  "mug_visible": {"type": "noul", "instructions": "Is there a coffee mug in `photo`?"},
  "mug": {"type": "box", "instructions": "the coffee mug in `photo`"}
}
```

**每个问题一个框。** Box 设计为找到一个目标，每个答案是单个框。要找到几个不同的事物，在同一请求中为每个询问一个 Box 问题。当图像可能持有多个相同事物时，描述你想要的那个以便只有它符合："`photo` 中离水槽最近的杯子"。当你无法用词语区分它们时，在 Box 旁边添加一个 Choice，选项为 `none`、`one` 和 `several`。当答案为 `several` 时，将图像分成区域并在每个上再次询问。

**在寻找小事物前裁剪大图像。** 在非常大的图像中只有几十像素宽的目标可能被错过。首先找到区域，例如用一个 Choice，其选项为图像的图块。然后在该图块上询问 Box 问题，并将其边转换回完整图像的分数。

### 用边缘问题检查框

要检查框是否切断目标的一部分，裁剪到框并每条边询问一个 Noul，例如 "Does the mug in `crop` continue past the left edge of the image?"。对于 Noul 答案为 yes 的每条边向外移动，并再次询问。

在 36 个绘画测试裁剪上，每个有已知的目标部分被切断，四个边缘问题捕捉了 30 个切断。单个 "Is all of the mug inside `crop`?" 问题捕捉了 26 个。将框作为轮廓绘制在完整图像上并询问捕捉了 20 个。
