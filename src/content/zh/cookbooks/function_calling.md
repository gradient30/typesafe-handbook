# 函数调用

> 把自然语言交易请求变成对普通带类型函数的调用：函数名和闭集参数映射到带置信度的 TypeSafe 问题。

## 问题

点「大杯冰燕麦拿铁、不加糖」，店员不会把整句记下来，而是在杯子上勾四个选项。这份食谱对交易 API 做同样的事：一句话进去，出来函数名和参数（已求值的枚举），每个都带置信度。

十个普通函数，参数来自固定列表，类型上已经是 `Literal`。不用改函数，加一份 spec 用白话说明每个参数是什么意思。最终是可指向自有函数的 `Dispatcher`。

## 架构

`closed_sets` 读签名，把参数分成三种形状：choice（一个 `Literal`）、set（`list[Literal[...]]`）、flag（`bool`）。自由文本、数字、日期不问，保留函数默认值。`Dispatcher` 从 spec 建问题；每次命令一次请求，带着函数选择和所有函数的参数，调度器只读被选中函数的答案。`stated` 是第二个是否问题：命令有没有提到该参数；没有则省略，用默认。

```mermaid
%%{init: {"fontFamily": "IBM Plex Sans, Noto Sans SC, sans-serif", "flowchart": {"rankSpacing": 28, "wrappingWidth": 240}}}%%
flowchart LR
    cmd["自然语言命令"] --> call["一次请求：选函数 + 全部闭集参数"]
    call --> tool["Choice：哪个函数"]
    call --> args["Choice / Noul：参数"]
    tool --> disp["只读被选函数的答案"]
    args --> disp
    disp --> conf{"最低置信度"}
    conf --> run["调用普通函数"]
```

## 结论

10 个函数、28 个可填参数、每条命令 54 个问题。14 条命令全部路由正确。长句「plot rolling correlation between nvda and spy for the past month」填了四个参数；`symbol` 和 `benchmark` 来自同一组六个代码，因问题写清了角色而各就各位。`confidence` 是这次调用里最不确定的那次判断，不是全部的乘积。

| 命令 | 调用 | 置信度 |
| --- | --- | --- |
| plot rolling correlation between nvda and spy for the past month | `rolling_correlation(symbol='NVDA', benchmark='SPY', window='1mo')` | 0.91 |
| compare nvda amd and msft over the past three months | `compare_returns(symbols=['NVDA', 'AMD', 'MSFT'], window='3mo')` | 0.94 |
| what tickers do you have | `list_symbols()` | 1.00 |
| is amd tracking nvidia lately | `rolling_correlation(symbol='AMD', benchmark='NVDA')` | 0.82 |

「lately」那条省略了 `window` 和 `resolution`，函数走自己的默认（一个月、小时线）。`jev-1.12`。

## 关键代码

spec 用函数真正接受的字符串当选项键，不用事后再映射。`stated` 让参数变成可选。

```python
{
  "style": {
    "question": "Does the user want a plain line or candles?",
    "stated": "Does the user say how the chart should be drawn, such as a line, candles, or OHLC bars?",
    "options": {
      "line": "a simple line through the closing prices",
      "candles": "a candlestick or OHLC chart, showing each bar's open, high, low and close"
    }
  }
}
```

每条命令一次请求。集合参数对每个成员问一次：`"Does the user want {} in the comparison?"`。

```python
assistant = Dispatcher(SPEC, TOOLS, client)
CALLS = {command: assistant(command) for command in COMMANDS}
call.confidence  # 最弱的那次判断
```

完整实验与数据见官网原文：[函数调用](https://docs.typesafe.ai/cookbooks/function_calling)
