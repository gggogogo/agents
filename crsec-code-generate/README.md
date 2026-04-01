# Shared-Only GraphRAG（一期）

本实现遵循 Shared-only GraphRAG 设计。一期默认禁用个人习惯入库与检索，并在代码中加 guard。

## 功能特性
- Shared-only 入库与检索，Qdrant 仅使用单一 collection：`code_knowledge`
- Neo4j 组件/规范依赖图（Component、Standard、DEPENDS_ON、COMPLIES_WITH）
- RAG Prompt 构建：规范优先 + 依赖约束
- MCP 工具：`retrieve_standards`、`check_graph_dependency`、`get_personal_context`（禁用）
- Qdrant/Neo4j 不可用时的降级行为

## 快速开始（真实调用）
依赖真实 Qdrant/Neo4j 与 embedding/LLM 服务。

```bash
export ENABLE_PRIVATE_INGESTION=false
python -m graphrag.scripts.run_api_examples
```

## 本地目录入库（Shared-only）
参考 `docs/ingestion-local-folder.md`，可使用脚本扫描本地文档目录并入库：

```bash
python -m graphrag.scripts.ingest_local_docs --path /Users/guowei/Documents/project/agent/crsec-code-generate/data/docs
```

可选：传入组件/规范/依赖映射（JSON）：

```bash
python -m graphrag.scripts.ingest_local_docs \\
  --path /Users/guowei/Documents/project/agent/crsec-code-generate/data/docs \\
  --graph-mapping /Users/guowei/Documents/project/agent/crsec-code-generate/data/graph-mapping.json
```

## 环境变量
- `ENABLE_PRIVATE_INGESTION`（默认：false）- 一期始终禁用个人入库/检索。
- `QDRANT_URL`、`QDRANT_API_KEY` - 使用真实 Qdrant 时必填。
- `NEO4J_URI`、`NEO4J_USERNAME`、`NEO4J_PASSWORD` - 使用真实 Neo4j 时必填。
- `EMBED_BASE_URL`、`EMBED_API_KEY`、`EMBED_MODEL_NAME` - 真实 embedding 服务必填。
- `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL_ID` - 真实 LLM 服务必填。
- `QDRANT_VECTOR_SIZE` - embedding 维度（默认 512）。
- `TOP_K` - 默认检索 top_k（默认 5）。
- `HYBRID_ENABLE`（默认 true）- 启用混合检索（向量召回 + 关键词重排）。
- `HYBRID_ALPHA`（默认 0.7）- 混合权重，越大越偏向向量相似度。
- `HYBRID_RERANK_TOP_K`（默认 30）- 混合重排的候选数上限。

注意：为满足 Shared-only 约束，`QDRANT_COLLECTION` 固定为 `code_knowledge`。

## 测试
任务清单要求的最小测试集（5 个）：

```bash
python -m unittest discover -s /Users/guowei/Documents/project/agent/crsec-code-generate/graphrag/tests
```

## API 示例
以下脚本输出与 `docs/api-examples.md` 一致（mock 数据）：

```bash
export USE_IN_MEMORY_STORES=1
python -m graphrag.scripts.run_api_examples
```

## 降级行为
- Qdrant 不可用：检索返回 `SERVICE_UNAVAILABLE`。
- Neo4j 不可用：依赖查询返回 `SERVICE_UNAVAILABLE`。
- LLM 不可用：RAG 返回带引用的回退摘要。

## 备注
- Shared-only：`get_personal_context` 始终返回空数组 + `\"private ingestion disabled\"`。
- 所有日志为英文；代码默认 ASCII（README 为中文说明）。
