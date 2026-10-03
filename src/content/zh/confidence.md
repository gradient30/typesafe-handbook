# Confidence

> 确定性如何报告、它与概率的差别，以及如何用它控制行为。

TypeSafe 的 Score 和 Choice 答案都带 `probabilities`：Choice 是各选项上的分布，Score 是各等级上的分布。分布的**形状**才告诉你模型有多确定——集中在一个结果上，答案自信；摊开，就不自信。

答案上的 `confidence` 把这形状压成 0 到 1 的一个数，你可以直接拿它设阈值，不必自己算。全部概率落在一个结果上时它是 1，均匀摊开时它是 0。（Noul 答案不带这个字段，见下方 [Noul](#noul)。）

## Confidence 从概率里算出来

`confidence` 是已有概率分布上的一个统计量。TypeSafe 替你算好，写在每一个 Choice 和 Score 答案上，常见用法不用你再动手。

对 [Choice](/primitives/choice)，分布是 `probabilities` 在各选项上。对 [Score](/primitives/score)，是在各等级上。两种情况下，更平坦的分布都意味着更低的置信度：Choice 上低置信度，常常是没有哪个选项明显压过其他；Score 上低置信度，常常是等级含糊、问题本身多维，或 state 里信息不够。

每种问题类型的公式见 [置信度如何计算](#置信度如何计算)，任意一个 `confidence` 都能从该答案自己的 `probabilities` 推回来。

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

## 置信度如何计算

每种问题类型概括分布的方式略有不同。Noul 只有两个结果，Choice 的选项数量不限且无序，Score 的等级有序，所以下面的公式一层层叠上去。

TypeSafe 的 `confidence` 是概括分布的一种合理方式，不是唯一方式。我们固定返回一个度量，是为了每个答案都带一个能用的默认值：从第一次调用起就可以在 `confidence` 上设门，所有问题共用 0 到 1 的刻度，不必先自己选一个统计量再验证。下面的公式是精确的，而且每个答案都带完整的 `probabilities`，所以你的应用更在意别的度量时，可以自己算。

### Noul

Noul 答案是「为是」的单一概率 $p$，TypeSafe 不为它另给 `confidence`。概率本身已经带着不确定：靠近 0.5 就是模型在说没把握。如何直接对它设阈值，见 [Noul](/primitives/noul)。

如果仍想要一个置信度风格的数，例如用同一段代码给 Noul 和 Choice 设门，可以用离 0.5 的距离：

$$
\text{confidence} = |2p - 1|
$$

$p = 0.5$ 时为 0，$p = 0$ 或 $p = 1$ 时为 1。这也是下面 Choice 公式用在是否二选一上的结果，所以和 Choice 的 confidence 同一把尺。

### Choice

Choice 把同一想法推广到任意多个选项。设选项数为 $n$，$p_{\max}$ 为选中项的概率：

$$
\text{confidence} = \frac{p_{\max} - \frac{1}{n}}{1 - \frac{1}{n}}
$$

它度量最高概率比均匀分配 $\frac{1}{n}$ 高出多少：均匀为 0，完全确定为 1。只看最高概率，所以 $(0.6, 0.3, 0.1)$ 和 $(0.6, 0.2, 0.2)$ 的 confidence 都是 0.4。

```python
def choice_confidence(probabilities: list[float]) -> float:
    n = len(probabilities)
    return (max(probabilities) - 1 / n) / (1 - 1 / n)


choice_confidence(list(answer.probabilities.values()))
```

三个选项时，这和 $(3 \times p_{\max} - 1) / 2$ 是同一个数。举例：概率 `[0.90, 0.06, 0.04]` 得到 0.85；均匀的 `[0.333, 0.333, 0.334]` 接近 0；没有明显赢家的 `[0.40, 0.33, 0.27]` 大约是 0.10。

同一份 `probabilities` 上，还有两个更简单的度量，实践里常常很好用，值得和 `confidence` 一起试：

* **最高概率** $p_{\max}$。可以直接读成「选中项有多可能」，阈值好讲。它的含义取决于选项个数：两个选项里 0.5 很弱，十个选项里 0.5 很强，所以阈值要按问题来设。
* **最高与次高之比** $p_{\max} / p_{\text{second}}$。它度量选中项比第二名清楚多少，不管其余质量怎么摊。很多真实决策就是前两名之间的事，这个比正好打在这一点上。

### Score

Score 的等级有序，公式还会算概率离最可能等级有多远。设等级数为 $n$，编号 $0$ 到 $n - 1$，$p_i$ 是等级 $i$ 的概率，$m$ 是最可能的等级：

$$
\text{confidence} = \max\left(0,\ 1 - \frac{\sum_i p_i \, |i - m|}{\text{MAD}_{\text{unif}}}\right)
\qquad
\text{MAD}_{\text{unif}} = \frac{1}{n} \sum_i \left| i - \frac{n - 1}{2} \right|
$$

分子是答案到最可能等级的、以概率加权的平均距离，单位是等级。$\text{MAD}_{\text{unif}}$ 是全部等级均匀摊开时、相对中间等级的同类平均距离。Confidence 比较这两者；答案至少和均匀分布一样散时，下限为 0。

落在相邻等级上的概率，比同样概率落在更远等级上，对置信度的拉低更小。三个等级时，$(0, 0.5, 0.5)$ 的 confidence 是 0.25，因为模型在两个相邻等级之间为难；$(0.5, 0, 0.5)$ 的 confidence 是 0，因为两端对立。Choice 公式会给这两种分布都打 0.25。

```python
def score_confidence(probabilities: list[float]) -> float:
    n = len(probabilities)
    m = probabilities.index(max(probabilities))
    spread = sum(p * abs(i - m) for i, p in enumerate(probabilities))
    even_spread = sum(abs(i - (n - 1) / 2) for i in range(n)) / n
    return max(0.0, 1 - spread / even_spread)


levels = sorted(answer.probabilities)
score_confidence([answer.probabilities[level] for level in levels])
```

[Score 响应示例](/primitives/score#response-structure) 里的 `bug_severity` 概率是 $(0, 0.57, 0.43)$。最可能等级是 1，spread 是 $0.43$，三个等级的 $\text{MAD}_{\text{unif}}$ 是 $\frac{2}{3}$，所以 confidence 是 $1 - 0.43 / \frac{2}{3} \approx 0.35$。
