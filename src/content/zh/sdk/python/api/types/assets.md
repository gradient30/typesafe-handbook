# Assets

> 将资产附加到 System One 请求，并从请求内容中引用它们。

**注意**

API 从字节检测每个图像的格式。

## typesafe_sdk.Asset

`module-attribute`

`Asset: TypeAlias = Image`

从请求内容引用的资产；目前仅支持图像。

## typesafe_sdk.Image

`dataclass`

由图像文件字节支持的图像资产，或指向图像文件的路径。

示例：

从文件路径：

```python
from pathlib import Path

image = Image(Path("photos/product.png"))
```

从内存中的字节：

```python
def from_bytes(data: bytes) -> Image:
    return Image(data)
```

从 base64 文本，例如上传：

```python
def from_upload(data_base64: str) -> Image:
    return Image.from_base64(data_base64)
```

从 Pillow 图像（需要 `pil` extra）：

```python
import PIL.Image

image = Image.from_pil(PIL.Image.new("RGB", (64, 64)), format="jpeg")
```

从更大缓冲区的切片，而不先将其复制到 `bytes`：

```python
def embedded_photo(container: bytes, offset: int, length: int) -> Image:
    return Image(memoryview(container)[offset : offset + length])
```

从内存映射文件：

```python
import mmap

def map_photo(path: Path) -> Image:
    with path.open("rb") as file:
        return Image(mmap.mmap(file.fileno(), 0, access=mmap.ACCESS_READ))
```

### data

`instance-attribute`

图像内容，表示为以下之一：

* 原始字节（任何支持 [`Buffer` 协议](https://docs.python.org/3/library/stdtypes.html#buffer-objects) 的东西）
* 指向文件系统上图像的 [path-like](https://docs.python.org/3/library/os.html#os.PathLike) 对象

### from_base64

`classmethod`

从 base64 编码的图像字节创建 `Image` 实例。

参数：

* **`data`** (str | Buffer) – base64 编码的图像文件字节，作为文本或 ASCII 缓冲区。空白（如换行的 base64 的换行符）被忽略。

引发：

[TypeSafeError](/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError) – 数据不是有效的 base64 文本。

### from_pil

`classmethod`

从 [Pillow](https://pillow.readthedocs.io/) 图像创建 `Image` 实例。

参数：

* **`image`** (PIL.Image.Image) – 要编码的 Pillow 图像。
* **`format`** (str, default: `'jpeg'`) – 要保存为的图像格式，按其 [Pillow 名称](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html)。

引发：

[TypeSafeError](/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError) – Pillow 无法以这种格式编码图像。
