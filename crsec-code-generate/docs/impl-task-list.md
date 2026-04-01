# 一期函数级任务拆解清单（AI 可执行）

> 目标：Shared-only 闭环（入库→检索→图谱→RAG→MCP）。

## 0. 全局约束
- `ENABLE_PRIVATE_INGESTION=false` 默认关闭
- 任何 private 写入/检索路径必须 guard
- `get_personal_context` 返回空集合或禁用说明

---

## 1. Ingestion Service（入库）

### 1.1 文档解析器
**函数**
- `parse_markdown(path) -> List[Section]`
- `parse_html(path) -> List[Section]`
- `parse_api_spec(path) -> List[Section]`

**任务**
- 解析标题层级、段落、代码块
- 统一输出 `Section{title, text, source, tags, doc_type, standard_level}`

**验收**
- 输入 1 份 md/HTML/API 文档 → 输出 Section 列表

### 1.2 分块器（Chunker）
**函数**
- `chunk_sections(sections, min_len=200, max_len=1200) -> List[Chunk]`

**任务**
- 按标题 + 段落切分
- 超长段落二次切分
- 附带 metadata（source/tags/doc_type/standard_level）

**验收**
- chunk 长度符合约束

### 1.3 Embedding 生成
**函数**
- `embed_chunks(chunks) -> List[Vector]`

**任务**
- 批量调用 embedding
- 失败重试（最多 3 次）

**验收**
- 向量维度正确且无空值

### 1.4 Qdrant 写入
**函数**
- `upsert_qdrant(chunks, vectors) -> None`

**任务**
- 生成 id（source + offset）
- 批量写入（单批 <= 200）

**验收**
- 可检索到写入的 chunk

### 1.5 Neo4j 写入
**函数**
- `upsert_components(components) -> None`
- `upsert_standards(standards) -> None`
- `upsert_dependencies(edges) -> None`

**任务**
- 创建 Component/Standard 节点
- 创建 DEPENDS_ON/COMPLIES_WITH 关系

**验收**
- Cypher 查询返回依赖关系

---

## 2. Retrieval Service（检索）

### 2.1 Query 入口
**函数**
- `retrieve_standards(query, top_k=5) -> List[Result]`

**任务**
- 校验 query 和 top_k
- 调用 Qdrant search
- 返回结构化结果

**验收**
- top_k 生效
- 结果包含 text/source/score

---

## 3. Graph Service（图谱）

### 3.1 依赖查询
**函数**
- `check_graph_dependency(component_name) -> DependencyGraph`

**任务**
- 查询 upstream/downstream
- 若组件不存在，返回明确错误

**验收**
- 对存在组件返回依赖
- 对不存在组件返回错误

---

## 4. RAG Service（推理）

### 4.1 Prompt 组装
**函数**
- `build_prompt(query, shared_results, graph_context) -> Prompt`

**任务**
- 拼接 System + Context + Rules
- 强制规范优先约束

**验收**
- Prompt 中包含引用来源

### 4.2 LLM 调用
**函数**
- `generate_answer(prompt) -> Answer`

**任务**
- 调用 LLM
- 返回文本 + 引用

**验收**
- 返回格式符合输出协议

---

## 5. MCP Server

### 5.1 工具注册
**函数**
- `register_tools()`

**任务**
- 注册三大工具
- 绑定对应 service 方法

**验收**
- MCP 调用可达

### 5.2 个人接口禁用
**函数**
- `get_personal_context(user_id, query) -> []`

**任务**
- 返回空集合 + message

**验收**
- 无个人数据输出

---

## 6. 测试清单（最小集）
- `test_chunker_limits`
- `test_qdrant_upsert_and_search`
- `test_graph_dependency_query`
- `test_prompt_contains_rules`
- `test_get_personal_context_disabled`

---

## 7. 交付物
- ingestion/retrieval/graph/rag/mcp 模块代码
- `docs/impl-task-list.md`
- 单元测试最小集
