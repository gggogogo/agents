# SDK Documentation RAG System

基于 Qdrant 和火山引擎 Embedding 的 SDK 文档检索增强生成系统。（Node.js + TypeScript）

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入实际的 API Key 等配置
```

环境变量说明：

- `EMBED_API_KEY`: 火山引擎 API Key
- `EMBED_MODEL_NAME`: Embedding 模型端点 ID
- `EMBED_BASE_URL`: 火山引擎 OpenAI 兼容接口地址
- `EMBED_DIMENSION`: 向量维度（默认 1024）
- `QDRANT_URL`: Qdrant 服务地址
- `QDRANT_API_KEY`: Qdrant API Key（云服务需要）
- `QDRANT_COLLECTION`: 集合名称

### 3. 索引文档

```bash
# 索引 docs 目录下的所有 .md 文件
pnpm index --docs-dir ./docs
pnpm index --docs-dir ./docs/@crsec/tiny-utils

# 强制重新索引（清空旧数据）
pnpm index --docs-dir ./docs --force

# 详细日志
pnpm index --docs-dir ./docs --verbose
```

### 4. 启动 API 服务

```bash
# 开发模式（自动重载）
pnpm dev

# 生产模式
pnpm start
```

### 5. 测试 API

```bash
# 健康检查
curl http://localhost:3001/health

# 统计信息
curl http://localhost:3001/stats

# 搜索文档
curl -X POST http://localhost:3001/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "如何使用导航栏组件",
    "top_k": 3
  }'
```

## 项目结构

```
document-rag/
├── src/
│   ├── api/              # Koa REST API
│   │   └── main.ts
│   ├── config/           # 配置模块
│   │   └── settings.ts
│   ├── ingestion/        # 文档解析
│   │   └── parser.ts
│   ├── embeddings/       # 向量生成
│   │   └── embedder.ts
│   ├── storage/          # Qdrant 存储
│   │   └── vector-store.ts
│   └── cli/              # 命令行工具
│       └── index-docs.ts
├── docs/                 # SDK 文档（待索引）
├── package.json
├── tsconfig.json
└── .env.example
```

## API 接口

### POST /rag/search

搜索 SDK 文档。

**请求**：
```json
{
  "query": "如何使用按钮组件",
  "top_k": 5,
  "library": "@crsec/ui"
}
```

**响应**：
```json
{
  "query": "如何使用按钮组件",
  "results": [
    {
      "id": "crsec-ui-CrsecNav",
      "library": "@crsec/ui",
      "name": "CrsecNav 导航栏",
      "content": "# CrsecNav 导航栏...",
      "example": "import { CrsecNav } from '@crsec/ui'",
      "keywords": ["CrsecNav", "导航栏"],
      "similarity": 0.89
    }
  ],
  "total": 1
}
```

### GET /health

健康检查。

### GET /stats

获取系统统计信息。

## 技术栈

| 模块 | 技术 |
|------|------|
| **运行时** | Node.js + tsx |
| **Web 框架** | Koa |
| **数据验证** | Zod |
| **Embedding** | 火山引擎 (OpenAI 兼容) |
| **向量数据库** | Qdrant |
| **CLI** | Commander.js |
| **语言** | TypeScript |

## 维护

### 重新索引

```bash
pnpm index -- --docs-dir ./docs --force
```

### 类型检查

```bash
pnpm typecheck
```

### 构建

```bash
pnpm build
```
