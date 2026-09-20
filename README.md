# TypeSafe 中文手册

[TypeSafe](https://docs.typesafe.ai/introduction) 官方文档的中文阅读站：System One / Jev 原语、模式、SDK、API 与食谱，带官网同步日志。

**在线阅读：** [https://gradient30.github.io/typesafe-handbook/](https://gradient30.github.io/typesafe-handbook/)

- 官方文档：[docs.typesafe.ai](https://docs.typesafe.ai/introduction)
- 本仓库：**非官方**译本与阅读器。产品名、代码块、JSON 字段与官网路径对齐
- 发布：GitHub Pages（`main` 推送后自动构建；工作流 `.github/workflows/pages.yml`）
- 同步：每 6 小时对照 `docs.typesafe.ai/llms.txt` 和各页 Markdown。哈希一变，就新增一条[同步日志](src/content/zh/sync-log.md)，写明改了什么、中文站在侧栏哪一项
- 风格：明 / 暗 / 彩，切换结果保存在浏览器本地

## 首次启用 Pages（一次性）

仓库刚创建时需要在 GitHub 勾选发布源，之后每次推送和 6 小时对照都会自动更新：

1. 打开 [Settings → Pages](https://github.com/gradient30/typesafe-handbook/settings/pages)
2. Build and deployment → Source 选择 **GitHub Actions**
3. 到 [Actions](https://github.com/gradient30/typesafe-handbook/actions) 把最近一次 *Deploy GitHub Pages* 点 **Re-run jobs**

## 内容

| 部分 | 说明 |
| --- | --- |
| 入门 / 基础 / 原语 / 模式 | 概念页完整中文译本 |
| SDK / HTTP API / 模型 / Agent Skill | 安装、用法、请求形状、价格与限流 |
| 食谱 | 官方 cookbook 的架构、结论与关键代码（不是实验日志逐行搬运） |
| [同步日志](src/content/zh/sync-log.md) | 每次官网变动单独一条：改了什么、本站哪个 URL |
| [对照表](src/content/zh/sitemap.md) | 官网页 SHA-12 指纹与中文站位置 |
| [本站架构](src/content/zh/architecture.md) | 汉化站如何对照官网并写日志 |

常用入口：

- `/` — 简介
- `/docs/introduction/quickstart` — 快速开始
- `/docs/sync-log` — 同步日志（顶栏「同步」进入）
- `/docs/sitemap` — 对照表
- `/docs/architecture` — 本站架构

## 本地运行

```bash
npm install
npm run dev
```

对照官网：

```bash
npm run sync:docs
```

GitHub Pages 静态构建：

```bash
npm run build:pages
```

产物在 `.output/public`。

## 技术栈

TanStack Start + Vite + Tailwind v4。正文是 `src/content/zh/**/*.md`，由 `src/lib/docs/catalog.ts` 建目录、`src/components/docs/Markdown.tsx` 渲染（表格、代码、`mermaid` 架构图）。

## 许可与归属

TypeSafe / Jev / System One 是 [TypeSafe AI](https://typesafe.ai) 的产品。本仓库仅提供中文阅读与同步对照，不替代官方文档。
