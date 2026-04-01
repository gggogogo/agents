
# 多层级 GraphRAG 系统设计方案：千人千面的 AI 编程助手

## 1. 核心设计理念

本系统旨在解决企业 AI 编程中的矛盾：既要严格遵守全局统一的代码规范与组件标准，又要尊重并延续开发者的个人编码习惯。

- 公共层（Shared Layer）：企业级“法律法规”，包含标准库、规范和最佳实践。
    
- 个人层（Private Layer）：开发者“肌肉记忆”，包含独特的命名偏好、常用逻辑模式。
    
- 差分存储（Differential Storage）：仅当个人习惯与规范存在补充或允许范围内的偏差时，才进行记录。
    

## 2. 存储架构设计

### 2.1 向量数据库 (Qdrant) - 语义检索

使用 多租户分区索引 方案。

|            |                                   |                                |
| ---------- | --------------------------------- | ------------------------------ |
| 字段         | 存储内容                              | 检索策略                           |
| Shared 分区  | 官方文档、API 参考、Clean Code 规范、组件使用说明。 | 全员可见，作为 Prompt 的底座。            |
| Private 分区 | 用户的习惯片段（如特定注释风格、错误处理模板）。          | 仅对特定 user_id 开放，通过 Payload 过滤。 |

### 2.2 图数据库 (Neo4j) - 逻辑关联

构建 代码语义图谱，理清深层逻辑。

- 节点 (Nodes): User, Standard, Component, Pattern (代码模式)。
    
- 关系 (Relationships):
    

- (User)-[:ADHERES_TO]->(Standard): 记录用户对规范的遵循频率（用于评估熟练度）。
    
- (User)-[:PREFERRED_STYLE]->(Pattern): 关联个人的特定代码模式。
    
- (Component)-[:DEPENDS_ON]->(Component): 组件依赖链，防止生成孤立代码。
    

## 3. 智能入库流水线 (Smart Ingestion Pipeline)

系统通过 Git 钩子或 IDE 插件自动捕获习惯，流程如下：

1. 特征提取：利用 AST（抽象语法树）分析代码结构、命名习惯及异常处理逻辑。
    
2. 合规性比对 (The Compliance Filter)：
    

- 调用 LLM 将提取的特征与 Shared 库中的规范进行语义比对。
    
- 判定逻辑：
    

- 完全符合：仅在 Neo4j 中增加该用户的“规范熟练度”权重，不重复存入向量库。
    
- 存在偏好/差异：提取“差异化特征”，存入 Qdrant 个人分区。
    

3. 冲突检测：若个人习惯违反强制性规范（如安全限制），则标记为“违规”，不予入库并反馈给用户。
    

## 4. MCP Server 接口定义 (对接 Claude Code)

通过 Model Context Protocol (MCP) 将能力输出给编程工具：

### 核心 Tools：

- retrieve_standards(query)：从公共库搜索相关组件用法或代码规范。
    
- get_personal_context(user_id, query)：根据当前问题，从个人库提取相似的习惯代码片段。
    
- check_graph_dependency(component_name)：从 Neo4j 确认组件的上下游关系，确保代码生成不破坏现有架构。
    

## 5. 推理阶段的工作流 (RAG Workflow)

当用户通过 Claude Code 提问时，系统执行以下步骤：

1. 多路检索：同时在 Qdrant 的 Shared 和当前用户的 Private 分区进行相似度搜索。
    
2. 关系增强：在 Neo4j 中查找检索到的片段是否存在已知的冲突或依赖。
    
3. Prompt 动态组装：System Message:  
    你是一个高级架构师。请根据【企业规范】中的 API 限制，结合【用户的个人习惯】中的编码风格，回答用户的问题。  
    约束条件: 若习惯与规范冲突，必须以规范为准。
    

## 6. 技术栈推荐

- Embedding: 阿里云 text-embedding-v4 (维度 2048)。
    
- LLM: 通义千问 Qwen-Max 或 Claude 3.5 Sonnet。
    
- Vector DB: Qdrant (开启 is_tenant=True)。
    
- Graph DB: Neo4j (搭配 APOC 扩展)。
    
- Orchestration: LangGraph (用于处理复杂的 Ingestion 决策流)。