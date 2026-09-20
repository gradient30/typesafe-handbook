# AI 入门

> 为什么 TypeSafe 用校准概率训练决策模型，而不是优化生成文本。

多数 AI 产品围着「模型和人聊天」转。TypeSafe 从另一个判断出发：大规模自动化会由 AI 对 AI、AI 对软件主导，所以机器接口比聊天接口更重要。

> **我们称之为 Machine Native Intelligence：**
>
> 具备软件属性的 AI：结构、可靠、可观测、可测试、快、一致、成本低。

## 做生产系统，不是造神

TypeSafe 不打算做一个什么都会的模型。它面向生产系统：代码需要一次窄决策，而且这次决策要能被检查、被执行。

我们预期大规模 AI 自动化会接近 99% 机对机、1% 人对机。设计目标因此从「读起来舒服的回复」转到「在软件里行为可预期的输出」。

阅读 [TypeSafe 宣言](https://typesafe.ai/manifesto)。

## 三种后训练路线

预训练语言模型主要有两条适配路径。TypeSafe 加了第三条。这里列出 RLHF 和 RLVR 作为对照；TypeSafe 自己走的是 RLCD。

**RLHF。** Reinforcement learning from human feedback 把预训练模型变成聊天机器人。它训练模型去生成人更喜欢的回复。

**RLVR。** Reinforcement learning with verifiable rewards 做出了擅长数学一类任务的推理模型，但更慢、更贵。

**RLCD。** Reinforcement learning for calibrated decisions 训练 TypeSafe 返回决策和校准概率，而不是生成文本。

RLHF 用来训练过 InstructGPT 和 ChatGPT，由 TypeSafe 联合创始人 [Diogo Almeida 共同提出](https://scholar.google.com/citations?user=0T4y07QAAAAJ&hl=en)。

![预训练语言模型分出较淡的 RLHF、RLVR 路径，以及被强调的 RLCD 决策模型路径。](https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/training-paths-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=61898215ac31388d3be15bf583b743ee)

## RLCD 与校准决策

RLCD 优化的是另一套输出契约：

* 模型不生成文本。
* 它返回决策和概率。
* 更高的概率应对应更高的「答案正确」机会。

校准让不确定性能被软件使用。对一个校准良好的模型，在大量预测上：

* 标成 `0.2` 的结果，大约 20% 的时候会发生。
* 标成 `0.8` 的结果，大约 80% 的时候会发生。
* 标成 `1.0` 的结果，应当 100% 发生。

这些比例描述的是一组预测，不是对单次答案的保证。何时该自动执行、何时该升级，见 [Confidence](/confidence)。

## RLHF 的问题

RLHF 教模型说人爱听的话。这个目标很适合聊天机器人，但也会奖励谄媚和听起来很自信的幻觉。

偏好优化还会带来 **mode dropping（模态丢弃）**：模型学会偏向某一种风格（例如听话地跟指令走），同时压低其他可能输出的概率。

![基座模型的概率分布，对比 RLHF 之后变窄、发生 mode dropping 的分布。](https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/mode-dropping-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=d51758a6212b526fc243cc9a81572cc7)

> 一段输出可以对人很有说服力，却不够可靠到能无人值守地跑。人的偏好和机器的可信度，是两套优化目标。

Mode dropping 是更温和的 **mode collapse（模态崩塌）**。在经典的生成对抗网络失败模式里，生成器反复产出同一种东西，因为那种东西继续骗过判别器。

### 模态崩塌类比

![重复的角色形象，示意 GAN 陷入 mode collapse。](https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/mode-collapse-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=2896f125ad1a5835b31b088fbc64eff1)

RLHF 仍然适合对话模型。TypeSafe 的立场是：生产自动化需要另一套训练目标——围着受约束的决策和校准过的不确定性转。
