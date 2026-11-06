# LangChain RAG CLI Agent 设计说明

## 概述

基于 LangChain.js 构建一个 CLI RAG 个人知识库 agent，以 LangChain 自身的技术文档作为知识源，帮助理解 LangChain 框架的核心能力。

## 目标

- 覆盖 LangChain 核心能力：Document Loading、Splitting、Embeddings、VectorStore、Retrieval、LCEL Chain、Streaming、Memory
- 自动抓取 LangChain 官网文档，无需手动准备数据
- 持久化向量库，避免每次启动重新索引
- 简洁的 CLI 交互，支持多轮对话
- 自部署 DeepSeek 模型，从环境变量读取配置

## 技术栈

| 项目 | 选型 |
|---|---|
| 运行时 | Node.js (TypeScript) |
| 框架 | LangChain.js (`langchain` + `@langchain/community`) |
| LLM | DeepSeek (自部署)，兼容 OpenAI API |
| Embedding | DeepSeek (自部署)，兼容 OpenAI embedding API |
| LLM 配置 | 环境变量 `CRSEC_MODEL_BASE_URL`、`CRSEC_MODEL_NAME` |
| 向量存储 | MemoryVectorStore + JSON 文件序列化持久化 |
| 文档抓取 | CheerioWebBaseLoader / RecursiveUrlLoader |
| CLI | Node.js `readline` 模块 |
| 包管理 | npm + tsx (直接运行 .ts) |

> 注意：`RecursiveUrlLoader` 和 `CheerioWebBaseLoader` 来自 `@langchain/community`。

## 项目结构

```
src/
├── index.ts          # 入口 + CLI 交互循环 + 对话历史
├── loader.ts         # 文档抓取模块
├── splitter.ts       # 文档切分模块
├── vectorstore.ts    # 向量存储 + 持久化
├── chain.ts          # RAG 检索链 (LCEL)
└── config.ts         # 配置常量
```

## 组件职责

### config.ts — 配置
- LangChain 文档抓取的起始 URL 和深度
- chunk 大小和重叠参数
- 向量存储持久化路径
- 对话历史最大轮数

### loader.ts — 文档抓取
- 从 LangChain 官方文档站点抓取页面
- 支持配置抓取深度和最大页面数
- 输出 `Document[]`，携带 source/title 元数据
- 使用 `RecursiveUrlLoader`（首选）或 `CheerioWebBaseLoader`（备选）

### splitter.ts — 文档切分
- 使用 `RecursiveCharacterTextSplitter`
- chunkSize: 1000, chunkOverlap: 200
- 适配 Markdown/代码的递归切分策略
- 保留每个 chunk 的元数据（原始文档来源）

### vectorstore.ts — 向量存储
- Embedding：使用 DeepSeek 自部署接口（OpenAI-compatible embedding）
- 向量存储：`MemoryVectorStore`
- 持久化方案：将 memory vectors 导出为 JSON 文件保存
  - `initVectorStore(docs?)`: 有文档则索引并保存，无文档则从文件加载
  - `save()`: 将向量和元数据序列化写入本地文件
  - `load()`: 从文件反序列化恢复向量存储
  - `search(query, k)`: 相似度检索，返回 top-K Documents

### chain.ts — RAG 检索链
- 使用 **LCEL** 链式语法 (`|` 运算符)
- 链结构：
  1. `createHistoryAwareRetriever` — 结合历史改写问题后检索
  2. `createStuffDocumentsChain` — 将检索到的文档拼入 prompt
  3. `createRetrievalChain` — 组合上述两步
- 最终链：`question + chatHistory → retrieval → llm → StringOutputParser`
- 支持流式输出 (`.stream()`)
- Prompt 模板含：系统角色 + 上下文来源 + 对话历史 + 用户问题，要求标注引用来源

### index.ts — CLI 入口
- 启动流程：
  1. 检查本地向量库是否存在
  2. 不存在 → 抓取 → 切分 → 索引 → 持久化
  3. 存在 → 直接加载
  4. 启动 readline CLI 交互循环
- 命令支持：
  - 普通输入 → RAG 问答
  - `/clear` → 清空对话历史
  - `/stat` → 显示知识库统计
  - `/exit` → 退出
- 维护对话历史（最近 N 轮: `HumanMessage`/`AIMessage`）
- 流式输出答案，逐 chunk 打印

## 数据流

```
[启动]
  │
  ├─ 检查向量库文件是否存在
  │     │
  │     ├─ 否 ─→ loader.fetch() → splitter.split() → vectorstore.index() + save()
  │     │                                                  │
  │     └─ 是 ─────────────────────────────────────────────┘
  │                                                        │
  ▼                                                        ▼
向量库就绪 ◄────────────────────────────────────────────── 持久化文件
  │
  ▼
CLI 交互循环
  │
  ├─ 用户输入问题
  │     │
  │     ▼
  │   chain.invoke({ question, chatHistory })
  │     │
  │     │  (内部流程):
  │     │  1. history-aware retriever 结合历史改写问题
  │     │  2. vectorStore.search(rewrittenQuestion, k=4)
  │     │  3. stuff docs into prompt
  │     │  4. LLM 流式生成
  │     │  5. StringOutputParser 拼接输出
  │     │
  │     ▼
  │   流式输出 + 更新对话历史
  │     │
  │     └──→ 回到交互循环
  │
  └─ 特殊命令: /clear, /stat, /exit
```

## 错误处理
- 网络抓取失败：重试 2 次，仍失败则提示用户并退出
- LLM 调用失败：捕获异常，显示错误信息，不中断对话
- 向量库文件损坏：重新索引

## 测试策略

- 单元测试：每个模块独立测试
- 集成测试：完整 RAG 流程端到端测试
- 使用 vitest 作为测试框架
- Mock LLM/Embedding 避免依赖外部服务

## 实现注意事项

- **MemoryVectorStore 持久化**：MemoryVectorStore 不自带序列化。实现时将内存中的 `[embeddings[], documents[]]` 导出为 JSON（embedding 数组可存为普通数组，量级不大）。加载时通过 `MemoryVectorStore.fromDocuments/docs'` 重建索引；或直接用 `addVectors` 插入恢复。更优方案：使用 `FaissStore`（本地文件持久化无需服务）但不引入额外依赖。
- **chain.ts 中 retriever 实现**：由于使用自定义持久化的 MemoryVectorStore，且 LangChain 中 `createHistoryAwareRetriever` 要求 retriever 实现特定接口。若函数式 API 不直接兼容，则手动实现：将 vectorStore 包装为 retriever，history 改写问题后检索，再手工拼接成 stuff chain。
- **API 版本**：所有 LangChain API 调用以实际安装的 `langchain` 包版本为准，设计中的函数名（如 `createHistoryAwareRetriever`）在实现时需对照实际导出名称调整。
- **DeepSeek Embedding**：若 DeepSeek 自部署接口不支持 `/v1/embeddings` 端点，回退使用本地 embedding 模型（如 `@xenova/transformers` 的 MiniLM）或用 ChatModel 生成伪 embedding。

## 验收标准
1. `npm start` 能启动并自动抓取 LangChain 文档建立索引
2. 第二次启动直接加载本地向量库，无需重新索引
3. 能就 LangChain 相关概念（Chains, Agents, LCEL 等）给出正确回答并标注来源
4. 支持多轮对话，能结合上下文回答问题
5. `/clear` 清空历史，`/stat` 显示统计，`/exit` 退出
