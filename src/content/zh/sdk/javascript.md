# JavaScript SDK

> 安装 TypeSafe 的 JavaScript / TypeScript 客户端，发出第一次类型化请求。

[TypeSafe AI](https://typesafe.ai) 的 JavaScript 与 TypeScript SDK。

## 快速开始

安装 SDK（需要 Node.js 20 或更新）：

```sh
npm install @typesafe-ai/sdk
```

在环境里设置 `TYPESAFE_API_KEY`，然后创建并使用客户端：

```ts
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();
const response = await client.systemOne({
  state: { document: "I was charged twice. Please fix this ASAP." },
  questions: {
    category: choice("What is this ticket about?", {
      billing: null,
      technical: null,
      other: null,
    }),
  },
});

console.log(response.answers.category.choice);
```

答案类型从问题推断。包内含 ESM、CommonJS 和 TypeScript 声明。

## 文档

TypeSafe 能做什么，见 [简介](/introduction) 与 [HTTP API](/api)。
SDK 的 [client](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/client.ts) 与 [types](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/types.ts) 给出选项与默认值。本站摘要见 [JavaScript API 参考](/sdk/javascript/api)。变更记录见 [changelog](/sdk/javascript/changelog)。
