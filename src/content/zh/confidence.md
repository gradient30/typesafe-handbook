# Confidence

> 确定性如何报告、它与概率的差别，以及如何用它控制行为。

Choice 和 Score 的答案都带 `probabilities`：Choice 是各选项上的分布，Score 是各等级上的分布。分布的**形状**才告诉你模型有多确定——集中在一个结果上，答案自信；摊开，就不自信。

答案上的 `confidence` 把这形状压成 0 到 1 的一个数，你可以直接拿它设阈值，不必自己算。（Noul 答案不带这个字段。）

## Confidence 从概率里算出来

`confidence` 是已有概率分布上的一个统计量。TypeSafe 替你算好，写在每一个 Choice 和 Score 答案上，常见用法不用你再动手。

### 公式

设选项（Choice）或等级（Score）个数为 `n`，分布里最大的那个概率为 `p_max`：

```
confidence = max(0, min(1, (n * p_max - 1) / (n - 1)))
```

它度量的是「质量有多集中」：

* 全部概率落在一项（`p_max = 1`）→ `confidence = 1.0`
* 均匀摊开（`p_max = 1/n`）→ `confidence = 0`
* 三个选项时，公式简化成 `(3 * p_max - 1) / 2`

举例。三个选项、概率 `[0.90, 0.06, 0.04]`：

```
(3 * 0.90 - 1) / 2 = 0.85
```

均匀的 `[0.333, 0.333, 0.334]` 接近 0。没有明显赢家的 `[0.40, 0.33, 0.27]` 大约是 0.10。

Noul 不返回 `confidence`：它本身就是 0–1 的概率，已经是「这句话为真」的校准估计。

> **一个稳妥的默认值：** 我们提供 `confidence`，是因为它对多数用例够用；但你不必被我们的定义锁死。评估对象不同，另一种度量可能更合适——所以响应里始终给你完整的 `probabilities`。各种算法的取舍是专门话题，会另开一篇 cookbook，做好了再把链接补到这里。

对 [Choice](/primitives/choice)，分布是 `probabilities` 在各选项上。对 [Score](/primitives/score)，是在各等级上。两种情况下，更平坦的分布都意味着更低的置信度：Choice 上低置信度，常常是没有哪个选项明显压过其他；Score 上低置信度，常常是等级含糊、问题本身多维，或 state 里信息不够。

## 「我不知道」是有用的信号

一个智能系统——无论是人还是机器——如果无法诚实表达不确定，这个系统就不能被信任。

Confidence 给模型一个内建机制来说「这一次我没把握」。代码可以按不同确定程度走不同行为，这是做出真正能依赖的系统的基础。

## 代码里用置信度的三条路

一个好用的起点是把置信度分成三段，每段对应不同的系统行为：

**高置信度：** 自动执行。模型读得很清楚，不必人介入。

**中置信度：** 谨慎推进。模型有一个说得过去的答案，但不确定。视场景，可以让用户确认、标出来复核，或先补信息再动手。

**低置信度：** 不要动手。路由给人工、请求澄清，或回退到另一套系统。模型在告诉你：信息不够，或这个问题不合适。

边界画在哪，取决于赌注有多大。

## 阈值跟着风险走

置信度阈值不是一个数。同一套系统里，不同动作该用不同门槛，取决于做错的后果。

```python
response = client.system_one(
    state=user_message,
    questions={
        "action": Choice(
            instructions="What is the user trying to do?",
            criteria={
                "check_balance": "View account balance",
                "approve_transfer": "Approve the pending withdrawal request",
                "support": "Get help with an issue",
            },
        ),
    },
)

action = response.answers["action"]
confidence = action.confidence

if confidence < 0.5:
    # Model is genuinely unsure. Don't guess.
    route_to_human(user_message)

elif action.choice == "check_balance":
    # Low stakes. Showing the wrong screen is recoverable.
    show_balance(account_id)

elif action.choice == "approve_transfer":
    if confidence > 0.9:
        # High stakes, high confidence. Proceed with confirmation.
        confirm_then_execute(account_id)
    else:
        # High stakes, moderate confidence. Verify first.
        ask_user_to_confirm(account_id)
```

0.5 这条置信度地板拦住模型自报「真不确定」的情况。在这之上，不做确认就执行的门槛，对破坏性操作比对只读操作更高。风险容忍写在你的代码里。

> 正确的阈值取决于你的领域，以及模型在你这个用例上的表现。先用保守阈值，拿自己的数据测，观察结果再调。
