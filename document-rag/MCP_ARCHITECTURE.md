# MCP Server 架构设计

## 1. 概述

将现有 SDK Documentation RAG 系统封装为 **MCP (Model Context Protocol) Server**，使 AI Agent（Claude Code、Cursor、VS Code Copilot 等）能通过标准化协议直接检索内部 SDK 文档。

### 核心目标

| 目标 | 说明 |
|------|------|
| Agent 可直接调用 | 通过 MCP Tools 暴露搜索能力，Agent 无需学习 REST API |
| 零配置接入 | 团队成员只需在 `.mcp.json` 声明即可使用 |
| 复用现有能力 | 直接复用 `EmbeddingGenerator`、`VectorStore` 等模块 |
| 双传输支持 | stdio（本地 Agent）+ Streamable HTTP（远程/共享） |

### 整体架构

```
┌─────────────────────────────────────────────────────┐
│  MCP Host (Claude Code / Cursor / VS Code Copilot)  │
│                                                     │
│  ┌─────────────┐                                    │
│  │  MCP Client  │ ← JSON-RPC 2.0 over stdio/HTTP → │
│  └──────┬──────┘                                    │
└─────────┼───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  MCP Server  (src/mcp/server.ts)            │
│                                             │
│  ┌────────────────────────────────────┐     │
│  │  Tools                             │     │
│  │  ├─ search_sdk_docs               │     │
│  │  ├─ list_libraries                │     │
│  │  └─ get_doc_detail                │     │
│  └──────────────┬─────────────────────┘     │
│                 │                           │
│  ┌──────────────▼─────────────────────┐     │
│  │  Shared Services                   │     │
│  │  ├─ EmbeddingGenerator             │     │
│  │  └─ VectorStore                    │     │
│  └────────────────────────────────────┘     │
│                 │                           │
│  ┌──────────────▼─────────────────────┐     │
│  │  External                          │     │
│  │  ├─ 火山引擎 Embedding API          │     │
│  │  └─ Qdrant Cloud                   │     │
│  └────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

## 2. MCP Tools 定义

### 2.1 `search_sdk_docs` — 搜索 SDK 文档

最核心的 Tool，Agent 在需要查找组件用法、API 参数、代码示例时调用。

```json
{
  "name": "search_sdk_docs",
  "description": "Search internal SDK documentation. Supports vector semantic search, keyword search, and hybrid search (default). Returns matching component docs with code examples.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query, e.g. 'dialog component usage' or 'semverGTE version comparison'"
      },
      "mode": {
        "type": "string",
        "enum": ["vector", "keyword", "hybrid"],
        "default": "hybrid",
        "description": "Search mode: vector (semantic), keyword (full-text), hybrid (both + RRF fusion)"
      },
      "top_k": {
        "type": "number",
        "default": 5,
        "description": "Number of results to return (1-20)"
      },
      "library": {
        "type": "string",
        "description": "Filter by library, e.g. '@crsec/ui' or '@crsec/tiny-utils'"
      }
    },
    "required": ["query"]
  }
}
```

**返回格式：** 文本摘要 + 完整 Markdown 内容，方便 Agent 直接引用。

### 2.2 `list_libraries` — 列出所有已索引的库

Agent 在不确定有哪些库时调用，获取可选的 library 过滤值。

```json
{
  "name": "list_libraries",
  "description": "List all indexed SDK libraries with document counts. Use this to discover available libraries before searching.",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

**返回格式：** 库名 + 文档数量列表。

### 2.3 `get_doc_detail` — 获取文档详情

Agent 已知文档 ID 时直接获取完整内容（避免重复搜索）。

```json
{
  "name": "get_doc_detail",
  "description": "Get full documentation content by document ID. Use when you already know the exact document ID from a previous search result.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "doc_id": {
        "type": "string",
        "description": "Document ID, e.g. 'crsec-ui-CrsecDialog'"
      }
    },
    "required": ["doc_id"]
  }
}
```

## 3. 传输模式

### 3.1 stdio（本地开发首选）

Agent 通过 `spawn` 子进程启动 MCP Server，通过 stdin/stdout 交换 JSON-RPC 消息。

- **场景**：Claude Code、Cursor 本地使用
- **入口**：`tsx src/mcp/server.ts`
- **特点**：零网络延迟，进程随 Agent 生命周期管理

```
Agent ─── stdin (JSON-RPC) ──→ MCP Server Process
Agent ←── stdout (JSON-RPC) ── MCP Server Process
```

### 3.2 Streamable HTTP（团队共享 / 远程）

MCP Server 作为 HTTP 服务运行，多个 Agent 可同时连接。

- **场景**：团队共享部署、CI/CD 集成
- **入口**：`tsx src/mcp/server.ts --http --port 3002`
- **端点**：`POST /mcp` (JSON-RPC)，`GET /mcp` (SSE stream)

```
Agent A ─── HTTP POST ──→ ┌──────────────┐
Agent B ─── HTTP POST ──→ │  MCP Server   │ ← Qdrant Cloud
Agent C ─── SSE ────────→ │  :3002/mcp    │ ← 火山引擎 API
                          └──────────────┘
```

## 4. 文件结构

```
src/mcp/
├── server.ts        # MCP Server 入口，注册 Tools，处理传输
├── tools.ts         # Tool handlers 实现（search_sdk_docs, list_libraries, get_doc_detail）
└── stdio.ts         # stdio 传输适配（可选，SDK 内置支持）
```

### 新增依赖

```
@modelcontextprotocol/sdk    # MCP TypeScript SDK
```

### package.json 新增脚本

```json
{
  "scripts": {
    "mcp": "tsx src/mcp/server.ts",
    "mcp:http": "tsx src/mcp/server.ts --http --port 3002"
  }
}
```

## 5. 代码结构

### 5.1 server.ts — 入口

```typescript
// 职责：
// 1. 初始化 EmbeddingGenerator + VectorStore（复用现有模块）
// 2. 创建 McpServer 实例，声明 capabilities: { tools: {} }
// 3. 注册所有 Tools（来自 tools.ts）
// 4. 根据命令行参数选择传输模式（stdio / HTTP）
// 5. 启动并保持运行
```

### 5.2 tools.ts — Tool 实现

```typescript
// 职责：
// 1. 导出 registerTools(server, embedder, vectorStore) 函数
// 2. search_sdk_docs: 调用 embedder.embedQuery + vectorStore.hybridSearch/search/keywordSearch
// 3. list_libraries: scrollAll → 聚合 library 字段去重计数
// 4. get_doc_detail: 通过 ID scroll 查找 → 返回完整 payload

// 返回格式统一为 MCP content:
// { content: [{ type: "text", text: "..." }] }
```

## 6. Agent 集成配置

### 6.1 `.mcp.json`（Claude Code 项目级配置）

放在项目根目录，团队成员 clone 后自动生效：

```json
{
  "mcpServers": {
    "sdk-docs": {
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"],
      "cwd": "/path/to/document-rag",
      "env": {
        "QDRANT_URL": "https://xxx.gcp.cloud.qdrant.io",
        "QDRANT_API_KEY": "${QDRANT_API_KEY}",
        "EMBED_API_KEY": "${EMBED_API_KEY}",
        "EMBED_MODEL_NAME": "${EMBED_MODEL_NAME}",
        "EMBED_BASE_URL": "https://ark.cn-beijing.volces.com/api/v3",
        "EMBED_DIMENSION": "2048",
        "QDRANT_COLLECTION": "cluster-1"
      }
    }
  }
}
```

> 敏感值（API Keys）使用 `${ENV_VAR}` 引用，从用户环境变量读取，不硬编码。

### 6.2 Cursor 配置

Cursor 支持在 Settings → MCP Servers 中添加，等价于：

```json
{
  "mcpServers": {
    "sdk-docs": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/document-rag/src/mcp/server.ts"]
    }
  }
}
```

### 6.3 VS Code + Copilot 配置

`.vscode/mcp.json`：

```json
{
  "servers": {
    "sdk-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"],
      "cwd": "${workspaceFolder}/../document-rag"
    }
  }
}
```

### 6.4 远程 HTTP 模式

对于团队共享部署，客户端配置指向远程端点：

```json
{
  "mcpServers": {
    "sdk-docs": {
      "url": "http://mcp-server.internal:3002/mcp"
    }
  }
}
```

## 7. SKILL.md — Agent 使用指南

`SKILL.md` 是给 Agent（而非人类）阅读的文档，用于声明何时、如何调用本 MCP Server。

```markdown
<skill>
  <name>SDK Documentation RAG</name>
  <description>
    Search internal SDK documentation for @crsec scoped packages.
    Use this when you need to find component APIs, usage examples,
    or implementation details for @crsec/ui or @crsec/tiny-utils libraries.
  </description>
  <when-to-use>
    - User asks about @crsec component usage (CrsecDialog, CrsecNav, etc.)
    - Need to look up utility function signatures (query, semverGTE, etc.)
    - Writing code that imports from @crsec/* packages
    - Verifying API parameters or return types for @crsec libraries
  </when-to-use>
  <tools>
    - search_sdk_docs: Primary search tool. Use hybrid mode by default.
    - list_libraries: Discover available libraries before filtering search.
    - get_doc_detail: Retrieve full doc when you know the ID from search results.
  </tools>
</skill>
```

## 8. 执行计划

| 步骤 | 任务 | 产出 |
|------|------|------|
| 1 | 安装 `@modelcontextprotocol/sdk` | 依赖就绪 |
| 2 | 实现 `src/mcp/tools.ts` | Tool handlers |
| 3 | 实现 `src/mcp/server.ts` | MCP Server 入口（stdio + HTTP） |
| 4 | 添加 `mcp` / `mcp:http` 脚本 | package.json |
| 5 | 生成 `.mcp.json` | Claude Code 配置 |
| 6 | 编写 `SKILL.md` | Agent 使用指南 |
| 7 | 测试 stdio 模式 | 验证 MCP Inspector 或 Claude Code 可连接 |
