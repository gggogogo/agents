# 多层级 GraphRAG 系统技术设计（一期：Shared-only）

## 1. 背景与目标
企业 AI 编程既需遵守统一规范，又希望兼容个人习惯。
一期目标：**只实现共享规范与组件知识的闭环能力**，个人习惯入库与检索通过开关关闭，接口保持兼容。

## 2. 目标与非目标
### 2.1 目标
- 构建 Shared 知识库（规范/组件/最佳实践）向量检索能力
- 构建组件依赖图谱能力
- 提供 MCP Server 接口对接编程工具
- 支持 RAG 推理流程（Shared-only）

### 2.2 非目标
- 不做个人习惯入库与个性化检索
- 不做权限体系与计费体系
- 不做多模型路由优化

## 3. 总体架构
```
[Shared Docs] --> Ingestion --> Qdrant (Shared)
                     |
                     +--> Neo4j (Component Graph)

[IDE/Claude Code] -- MCP --> RAG Service --> LLM
                          |            |
                          |            +--> Qdrant Shared
                          +--> Neo4j Graph
```

## 4. 配置与开关
- `ENABLE_PRIVATE_INGESTION=false`（默认）
- 行为规则：
  - 所有私有入库路径必须 guard
  - `get_personal_context` 返回空集合或“禁用说明”
  - Prompt 仅引用 Shared

## 5. 数据模型设计

### 5.1 Qdrant（Shared-only）
**Collection：`code_knowledge`**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| vector | float[] | embedding 向量 |
| payload.doc_type | string | 标准/组件/FAQ/示例 |
| payload.source | string | 来源文件或链接 |
| payload.language | string | 语言 |
| payload.tags | array | 标签 |
| payload.standard_level | string | 强制/推荐 |

### 5.2 Neo4j 图谱
**Nodes**
- `Component`：组件
- `Standard`：规范

**Relationships**
- `(Component)-[:DEPENDS_ON]->(Component)`
- `(Component)-[:COMPLIES_WITH]->(Standard)`

## 6. 入库流程（Shared-only）
1. 文档预处理（清洗/去噪/结构化）
2. 分块（Chunking）策略：按段落或 API 结构切分
3. 生成 embedding
4. 写入 Qdrant Shared
5. 依赖关系与规范映射写入 Neo4j

**验收标准**
- Shared 文档可检索命中
- 组件依赖可查询

## 7. 推理流程（RAG）
1. Query → Qdrant Shared 检索
2. 检索结果增强：Neo4j 依赖检查
3. Prompt 组装

**Prompt 模板关键约束**
- 规范优先
- 组件依赖必须遵守

## 8. MCP Server 接口（一期）
### 8.1 `retrieve_standards(query)`
- 输入：query
- 输出：Shared 规范/组件片段 TopK

### 8.2 `check_graph_dependency(component_name)`
- 输入：组件名
- 输出：上游/下游依赖

### 8.3 `get_personal_context(user_id, query)`
- 一期行为：返回空集合 + 禁用说明

## 9. API 规范（示例）
```json
{
  "query": "如何使用 Button 组件",
  "top_k": 5
}
```

返回：
```json
{
  "results": [
    {
      "text": "...",
      "source": "component-doc.md",
      "score": 0.82
    }
  ]
}
```

## 10. 评测与质量保障
- 指标：命中率、答案规范度、引用覆盖率
- 最小评测集：10-20 条核心规范问题

## 11. 里程碑
- M1：Shared 向量检索
- M2：Neo4j 图谱依赖
- M3：RAG 推理服务
- M4：MCP Server 对接
- M5：评测与回归

## 12. 风险与对策
- **风险**：规范文档结构不一致 → 需统一清洗规范
- **风险**：组件依赖缺失 → 必须补齐依赖映射表
- **风险**：检索噪声高 → 改进 chunk 与标签

---

# 13. 模块设计（Shared-only）

## 13.1 Ingestion Service（入库服务）
**职责**
- 文档清洗、分块、embedding 生成、写入 Qdrant
- 构建组件依赖与规范映射写入 Neo4j

**输入**
- 文档文件（markdown/HTML/JSON）

**输出**
- Qdrant: 向量 + payload
- Neo4j: `Component`、`Standard` 与依赖关系

**关键流程**
1. 解析文档 → 结构化片段
2. 分块 → chunk list
3. embedding 生成
4. 写入 Qdrant
5. 依赖映射写入 Neo4j

## 13.2 Retrieval Service（检索服务）
**职责**
- 处理 query
- 向 Qdrant 查询 TopK
- 结构化结果并返回

**输入**
- `query`, `top_k`

**输出**
- `results[]`（text, source, score）

## 13.3 Graph Service（图谱服务）
**职责**
- 组件依赖查询
- 组件规范查询
- 冲突校验（一期可选）

**输入**
- `component_name`

**输出**
- `upstream`, `downstream`, `standards`

## 13.4 RAG Service（推理服务）
**职责**
- 聚合检索 + 图谱
- 组装 Prompt
- 调用 LLM

**输出**
- 最终回答 + 引用

## 13.5 MCP Server
**职责**
- 提供标准 MCP 接口
- 适配 IDE / Claude Code

**接口**
- `retrieve_standards`
- `check_graph_dependency`
- `get_personal_context`（一期返回空）

---

# 14. 目录结构建议
```
crsec-code-generate/
  ├─ ingestion/
  │   ├─ parser/
  │   ├─ chunker/
  │   ├─ embedder/
  │   └─ writer/
  ├─ retrieval/
  ├─ graph/
  ├─ rag/
  ├─ mcp/
  ├─ configs/
  ├─ scripts/
  └─ docs/
```

---

# 15. 关键接口与数据结构

## 15.1 Qdrant 写入结构
```json
{
  "id": "uuid",
  "vector": [0.1, 0.2, ...],
  "payload": {
    "doc_type": "component",
    "source": "button.md",
    "language": "typescript",
    "tags": ["ui", "button"],
    "standard_level": "required"
  }
}
```

## 15.2 检索返回结构
```json
{
  "results": [
    {
      "text": "...",
      "source": "button.md",
      "score": 0.83,
      "doc_type": "component"
    }
  ]
}
```

## 15.3 MCP 接口规范（伪代码）
```ts
retrieve_standards(query: string, top_k?: number): Result[]
check_graph_dependency(component_name: string): DependencyGraph
get_personal_context(user_id: string, query: string): Result[] // returns []
```

---

# 16. 图谱查询示例（Neo4j）

**依赖查询**
```cypher
MATCH (c:Component {name: $name})-[:DEPENDS_ON]->(d:Component)
RETURN d.name
```

**规范查询**
```cypher
MATCH (c:Component {name: $name})-[:COMPLIES_WITH]->(s:Standard)
RETURN s.name, s.level
```

---

# 17. Qdrant 索引策略（Shared-only）
- 单 collection `code_knowledge`
- 向量：embedding 模型维度（与 LLM embedding 一致）
- payload index：`doc_type`、`standard_level`、`language`

---

# 18. 配置项清单（一期）
```yaml
ENABLE_PRIVATE_INGESTION: false
QDRANT_URL: http://qdrant:6333
NEO4J_URL: bolt://neo4j:7687
EMBEDDING_MODEL: text-embedding-v4
TOP_K: 5
```

---

# 19. 部署拓扑（一期）
```
[Ingestion Service] --> Qdrant
                    --> Neo4j
[RAG Service] ------> Qdrant + Neo4j
[MCP Server] -------> RAG Service
```

---

# 20. 测试策略
- 单元测试：chunk/embedding/payload 映射
- 集成测试：Qdrant 入库与检索
- 回归测试：基准问题集

---

# 21. 监控与日志
- Qdrant：检索耗时、命中率
- Neo4j：查询耗时、失败率
- MCP：调用成功率

---

# 22. 二期展望（非一期范围）
- 开启 `ENABLE_PRIVATE_INGESTION`
- 添加用户维度 partition
- 在 RAG 中引入差分偏好

---

# 23. 详细实现设计

## 23.1 文档解析与分块
**目标**：将各种格式文档统一为结构化片段，并控制 chunk 颗粒度。

**规则**
- markdown：按标题层级 + 段落切分
- HTML：按 `h1-h3` + `p` 切分
- API 参考：按 endpoint/类/方法切分

**chunk 约束**
- 最小 200 字符，最大 1200 字符
- 超长段落强制再切分
- chunk 必须携带 `doc_type/source/tags/standard_level`

## 23.2 Embedding 生成
**输入**：chunk.text
**输出**：vector
**失败重试**：3 次，指数退避

## 23.3 Qdrant 写入策略
- 主键：uuid
- 批量写入：单批 <= 200
- 幂等：由 `source + offset` 生成 id

## 23.4 Neo4j 写入策略
- Component 节点：`name`, `category`, `version`
- Standard 节点：`name`, `level`
- 依赖关系：来自组件清单映射表

---

# 24. MCP Server 设计细节

## 24.1 输入校验
- `query`：非空字符串，最长 2000 字符
- `top_k`：1-20

## 24.2 错误返回
统一结构：
```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "top_k must be between 1 and 20"
  }
}
```

## 24.3 一期默认行为
- `get_personal_context`：返回 `results: []` + `message: "private ingestion disabled"`

---

# 25. RAG Prompt 设计
**System**
- 你是高级架构师
- 必须遵守企业规范

**Context**
- Shared 检索结果
- 组件依赖关系

**Rules**
1. 若规范冲突，必须以规范为准
2. 若依赖缺失，提示需要补齐组件
3. 给出引用来源

---

# 26. 数据治理与安全
- 文档来源需标记 `source`
- 不允许写入敏感数据
- 私有习惯数据一期禁止写入

---

# 27. 回滚与降级
- Qdrant 不可用 → 返回空结果 + 降级提示
- Neo4j 不可用 → 仅做向量检索
- LLM 不可用 → 返回检索结果摘要

---

# 28. 发布与灰度
- 仅内测使用
- 先对少量开发团队开放
- 监控指标稳定后扩大范围

---

# 29. 项目交付物清单
- `docs/tech-design-shared-only.md`
- 入库脚本 + README
- MCP Server 可运行版本
- 评测报告

---

# 30. 下一步（可选）
- 输出更细的模块级接口定义
- 细化到函数级实现任务清单
- 增加 PoC Demo
