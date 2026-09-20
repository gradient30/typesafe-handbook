export type DocLink = {
  slug: string;
  title: string;
  description: string;
  href: string;
  official?: string;
};

export type NavNode =
  | { kind: "label"; title: string }
  | { kind: "link"; slug: string; title: string; href: string }
  | { kind: "folder"; title: string; children: DocLink[] };

function page(
  slug: string,
  title: string,
  description: string,
  official?: string,
): DocLink {
  const href = slug === "introduction" ? "/" : `/docs/${slug}`;
  return {
    slug,
    title,
    description,
    href,
    official: official === "" ? undefined : (official ?? `/${slug}`),
  };
}

export const PAGES: DocLink[] = [
  page("sync-log", "同步日志", "每次对照官网后单独记一条：改了什么、本站哪一页。", ""),
  page("sitemap", "对照表", "官网每一页的指纹、状态，以及对应的中文站位置。", ""),
  page("architecture", "本站架构", "汉化站怎么拼起来、如何自动对照官网并写同步日志。", ""),
  page("introduction", "简介", "Jev 是 TypeSafe 的旗舰 System One 模型：传入状态和类型化问题，直接拿结构化答案。"),
  page("introduction/quickstart", "快速开始", "Playground、HTTP API、Python SDK 与 Agent Skill 的最短上手路径。"),
  page("introduction/machine-learning-primer", "AI 入门", "为什么 TypeSafe 用校准概率训练决策模型，而不是优化生成文本。"),
  page("concepts/system-one", "System One", "System One 模型为软件做快速、结构化决策。Jev 是第一款。"),
  page("concepts/state", "State", "什么是 state、怎么组织它，以及如何给模型足够的上下文。"),
  page("confidence", "Confidence", "确定性如何报告、它与概率的差别，以及如何用它控制行为。"),
  page("concepts/how-to-build-with-system-one", "如何用 TypeSafe 构建", "代码掌控流程，把 System One 插在需要窄决策的地方。"),
  page("concepts/use-case-map", "用例地图", "按行业浏览 TypeSafe 用例，把想法变成软件工作流。"),
  page("primitives", "原语（问题）", "Choice、Score、Noul 三种问题类型，以及如何一次问多个。"),
  page("primitives/choice", "Choice", "从给定集合中选一项：返回选项、概率分布和置信度。"),
  page("primitives/score", "Score", "按有序、可描述的等级给内容打分。"),
  page("primitives/noul", "Noul", "是/否问题，返回「为真」的概率。"),
  page("primitives/advanced", "高级：结构", "instructions、选项、等级和 Noul 标准都接受 JSON 结构。"),
  page("patterns", "模式", "用 TypeSafe 搭建系统的架构模式。"),
  page("patterns/fan-out", "投机扇出", "一次调用发出许多问题，包括投机性的，由代码决定哪些有用。"),
  page("patterns/confidence-routing", "置信度门控路由", "答案告诉你「是什么」，置信度告诉你「要不要动手」。"),
  page("patterns/composite-scoring", "组合评分", "把复杂判断拆成原子分数，用代码里的权重合成。"),
  page("patterns/intent-routing", "意图路由", "分类请求，再路由到确定逻辑、专用 LLM 或人工。"),
  page("demos", "演示", "展示 TypeSafe 能力的交互示例。"),
  page("demos/smart-home", "智能家居助手", "用投机问题评估用户智能家居指令，必要时回退 LLM。"),
  page("sdk", "客户端 SDK", "安装 TypeSafe 客户端，在应用里使用类型化问题与答案。"),
  page("sdk/python", "Python SDK", "同步 / 异步 Python 客户端，默认调用 jev-latest。"),
  page("sdk/python/usage", "Python 用法", "调用方式、响应模型、环境变量与重试。"),
  page("sdk/python/api", "Python API 参考", "Client、问题类型、答案、重试、异常与常量。"),
  page("sdk/javascript", "JavaScript SDK", "Node 20+ 的 JS/TS 客户端，答案类型从问题推断。"),
  page("sdk/javascript/api", "JavaScript API 参考", "TypeSafeClient、choice/score/noul 工厂与错误类型。"),
  page("models", "模型", "Jev 1.13 价格、限流、上下文、别名与语言支持。"),
  page("api", "HTTP API", "POST /v1/systemone 的请求与响应形状。"),
  page("agent-skill", "Agent Skill", "给 Claude Code、Codex 等编码智能体的 TypeSafe 技能包。"),
  page("model-jaggedness/jev-1.13", "Jev 1.13 锯齿", "已知不擅长的边角，以及该怎么绕开。"),
  page("legal", "法律", "DPA、主客户协议、隐私政策与零数据留存。"),
  page("cookbooks", "食谱总览", "官方 cookbook：并行问题、护栏、重排序、函数调用等。", ""),
  page("cookbooks/parallel_questions", "并行问题", "13 个监管问题一次调用，比逐条便宜 12.2×、快 10×。"),
  page("cookbooks/consistency_noul_cookbook", "自洽：Noul", "把不确定的概率交给人工复核，同时保留原始 noul。"),
  page("cookbooks/consistency_choice_cookbook", "自洽：Choice", "给审核决策加「不确定」出口，对照自动动作比例。"),
  page("cookbooks/classification_using_confidence", "分类用置信度", "75 个行业组用 Choice，不够自信就升到上级部门。"),
  page("cookbooks/rerank_typesafe", "重排序", "BM25 短名单再用 TypeSafe 重排，法律检索 top-1 从 5% 到 18%。"),
  page("cookbooks/semantic_find", "逐行检索", "一次请求对 218 行 GitHub ToS 打分，并用 Noul 判断有没有答案。"),
  page("cookbooks/autoformat", "结构恢复", "两步请求把丢了格式的纯文本还原成 Markdown。"),
  page("cookbooks/function_calling", "函数调用", "把自然语言交易请求映射到带置信度的类型化函数调用。"),
  page("cookbooks/skill_suggestion", "技能建议", "从 182 个 Hermes 技能里最多挑一个给当前回合。"),
  page("cookbooks/entity_alignment", "实体对齐", "用一个 Score 决定 450 对啤酒目录候选是合并、不链还是交给策展人。"),
  page("cookbooks/classifying_rag_passages", "给 RAG 段落分类", "给检索段落打分，再在代码里决定哪些进回答模型。"),
  page("cookbooks/citation_check", "核对引用", "用 Choice 判断引文上下文是否支撑主张，低置信度送人工。"),
  page("cookbooks/llm_guardrails", "LLM 护栏", "进出 LLM 的每条消息用一轮 TypeSafe 筛危害与严重度。"),
  page("cookbooks/sde_cascade", "SDE 级联", "两段结构化抽取（mini → 校验 → 推理），接近大模型质量、成本更低。"),
  page("cookbooks/date_extraction_cookbook", "日期抽取", "让 TypeSafe 点名文档里的日期部件，再在代码里解析并按置信度复核。"),
  page("cookbooks/pre_parsed_value_extraction_cookbook", "预解析值抽取", "正则找候选邮箱/电话/金额，TypeSafe 选出要的那一段。"),
  page("cookbooks/hierarchical_classification", "层级分类", "在专利、零售、生物医学、源码层级上用并行束搜索分类。"),
  page("cookbooks/autoresearch_feature_discovery", "自动研究特征发现", "提出 TypeSafe 问题，把文本变成数值特征，改进监督回归。"),
];

function byPrefix(prefix: string) {
  return PAGES.filter((p) => p.slug.startsWith(prefix) && p.slug !== prefix);
}

export const NAV: NavNode[] = [
  { kind: "label", title: "本站" },
  { kind: "link", slug: "sync-log", title: "同步日志", href: "/docs/sync-log" },
  { kind: "link", slug: "sitemap", title: "对照表", href: "/docs/sitemap" },
  { kind: "link", slug: "architecture", title: "本站架构", href: "/docs/architecture" },
  { kind: "label", title: "入门" },
  { kind: "link", slug: "introduction", title: "简介", href: "/" },
  { kind: "link", slug: "introduction/quickstart", title: "快速开始", href: "/docs/introduction/quickstart" },
  { kind: "link", slug: "introduction/machine-learning-primer", title: "AI 入门", href: "/docs/introduction/machine-learning-primer" },
  { kind: "label", title: "TypeSafe 基础" },
  { kind: "link", slug: "concepts/system-one", title: "System One", href: "/docs/concepts/system-one" },
  { kind: "link", slug: "concepts/state", title: "State", href: "/docs/concepts/state" },
  { kind: "link", slug: "confidence", title: "Confidence", href: "/docs/confidence" },
  { kind: "link", slug: "concepts/how-to-build-with-system-one", title: "如何构建", href: "/docs/concepts/how-to-build-with-system-one" },
  { kind: "link", slug: "concepts/use-case-map", title: "用例地图", href: "/docs/concepts/use-case-map" },
  { kind: "folder", title: "原语", children: [PAGES.find((p) => p.slug === "primitives")!, ...byPrefix("primitives/")] },
  { kind: "folder", title: "模式", children: [PAGES.find((p) => p.slug === "patterns")!, ...byPrefix("patterns/")] },
  { kind: "label", title: "演示" },
  { kind: "link", slug: "demos", title: "演示", href: "/docs/demos" },
  { kind: "link", slug: "demos/smart-home", title: "智能家居助手", href: "/docs/demos/smart-home" },
  { kind: "folder", title: "SDK", children: PAGES.filter((p) => p.slug === "sdk" || p.slug.startsWith("sdk/")) },
  { kind: "label", title: "参考" },
  { kind: "link", slug: "models", title: "模型", href: "/docs/models" },
  { kind: "link", slug: "api", title: "HTTP API", href: "/docs/api" },
  { kind: "link", slug: "agent-skill", title: "Agent Skill", href: "/docs/agent-skill" },
  { kind: "link", slug: "model-jaggedness/jev-1.13", title: "Jev 1.13 锯齿", href: "/docs/model-jaggedness/jev-1.13" },
  { kind: "link", slug: "legal", title: "法律", href: "/docs/legal" },
  { kind: "folder", title: "食谱", children: [PAGES.find((p) => p.slug === "cookbooks")!, ...byPrefix("cookbooks/")] },
];

export function pageBySlug(slug: string): DocLink | undefined {
  const key = slug === "" || slug === "docs" || slug === "index" ? "introduction" : slug.replace(/\/$/, "");
  return PAGES.find((p) => p.slug === key);
}

export function neighbors(slug: string): { prev?: DocLink; next?: DocLink } {
  const key = slug === "index" ? "introduction" : slug;
  const i = PAGES.findIndex((p) => p.slug === key);
  if (i < 0) return {};
  return { prev: PAGES[i - 1], next: PAGES[i + 1] };
}

export function handbookHref(slug: string): string {
  return slug === "introduction" || slug === "index" ? "/" : `/docs/${slug}`;
}

export function officialHref(path: string): string {
  const clean = path.replace(/^\//, "").replace(/\.md$/, "");
  return `https://docs.typesafe.ai/${clean}`;
}

export function webLocation(slug: string): string {
  const page = pageBySlug(slug);
  const href = handbookHref(slug);
  if (!page) return `本站 ${href}`;
  const folder = NAV.find((n) => n.kind === "folder" && n.children.some((c) => c.slug === page.slug));
  const label = NAV.find((n) => n.kind === "link" && n.slug === page.slug);
  if (folder && folder.kind === "folder") return `侧栏「${folder.title}」→「${page.title}」· 本站 ${href}`;
  if (label) {
    // find preceding label
    const idx = NAV.indexOf(label);
    let section = "";
    for (let i = idx; i >= 0; i--) {
      const n = NAV[i];
      if (n?.kind === "label") {
        section = n.title;
        break;
      }
    }
    return section ? `侧栏「${section}」→「${page.title}」· 本站 ${href}` : `「${page.title}」· 本站 ${href}`;
  }
  return `「${page.title}」· 本站 ${href}`;
}
