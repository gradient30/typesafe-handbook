# Agent Skill

> 给 Claude Code、Codex 等编码智能体环境的即装即用技能包。

TypeSafe agent skill 给 AI 编码智能体补全 TypeSafe API 的上下文：三种问题 [类型](/primitives)、架构 [模式](/patterns)，以及组织评估的最佳实践。

## 安装

### Claude Code

在终端运行这两条命令：

```bash
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai
```

### 其他智能体

```bash
npx skills add typesafe-ai/skills --skill typesafe-ai
```

按提示选择你的智能体。默认装到当前项目；加 `-g` 可全局安装。

### 复制给智能体

把这段提示贴进你的编码智能体：

```text
Install the TypeSafe skill. If you're in Claude Code, run `claude plugin marketplace add typesafe-ai/skills`, then `claude plugin install typesafe@typesafe-ai`. If you're in another agent, run `npx skills add typesafe-ai/skills --skill typesafe-ai` and select your agent. Use one installation method. You can read the skill directly at https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md (raw: https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md). Then use the TypeSafe skill when working on this project.
```

直接读 GitHub 上的 [SKILL.md](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md)，或拉取 [原始 Markdown](https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md)。手动安装时，把整个 [skills/typesafe-ai 目录](https://github.com/typesafe-ai/skills/tree/main/skills/typesafe-ai)（含参考文件）复制到智能体的 skills 目录。

只选一种安装方式，避免重复副本。

### 更新

Claude Code 插件执行：

```bash
claude plugin marketplace update typesafe-ai
claude plugin update typesafe@typesafe-ai
```

重启 Claude Code，或运行 `/reload-plugins` 加载更新。要自动更新：打开 `/plugin`，选 **Marketplaces → typesafe-ai → Enable auto-update**。

用 skills.sh 安装的，运行 `npx skills update`。手动复制的，用 GitHub 上的最新版本整目录替换。

## 示例提示

在提示里点名技能——「use the TypeSafe skill」——对任何智能体都有效，所以下面每条都这么写。Claude Code 插件也可以直接调用 `/typesafe:typesafe-ai`。

* 适合起步的是头脑风暴：先找出项目里最适合用 TypeSafe 的地方。

  ```text
  Using the TypeSafe skill, explore the project and find opportunities for using
  intelligent judgement to stand in for complex parsing or other fragile code.
  ```

* 也可以创建一把 [API key](https://console.typesafe.ai/keys)，让智能体用便宜的测试查询自己摸索用法。

  ```text
  Using the TypeSafe skill, run some experiments using the TypeSafe API key that I've
  exported to `TYPESAFE_API_KEY`. Propose changes based on the most promising results.
  ```

* 把智能体指向能解决你代码问题的 [具体食谱](/cookbooks/consistency_noul_cookbook)，或指向 [食谱总览](/cookbooks)，问有没有和你项目类似的模式。

  ```text
  Using the TypeSafe skill, analyze my code and see if there are any applicable
  cookbooks (https://console.typesafe.ai/docs/cookbooks) that show how I could
  refactor my code to be less fragile or complex.
  ```

## 靠谱的 vibe coding 原则

1. 先和智能体把事情谈清楚，上面的示例提示当起点。
2. 先审计划，确认说得通再动手实现。
3. 把常量（问题和阈值）放在同一个地方，方便审阅。智能体不太擅长写问题，预期要和它一起改。
4. 不要把断言当事实；鼓励智能体验证自己的假设。

## 常见问题

### 智能体没用上技能

Claude Code 插件调用 `/typesafe:typesafe-ai`。其他智能体请它「use the TypeSafe skill」。仍然不加载的话，确认安装器对准的是你正在用的智能体，然后重启。

### 路由结果和预期不一样

检查问题和阈值。阈值可能太高（漏报）或太低（误报）。也可能需要把问题写得更具体。

### 到处都在用置信度阈值

如果只关心选出最好的那一项，选置信度最高的选项即可（不必设阈值）。如果心里已经有一套统计算法，多半该用概率，而不是置信度。见 [Confidence](/confidence)。

### TypeSafe 代码不好审

人最该审的是问题和 TypeSafe 代码里用到的阈值常量。它们应定义在同一个源文件里，不用到处翻。

### 智能体捏造请求或响应字段

过期的 skill 会导致这个。按上面的安装方式更新后再试。
