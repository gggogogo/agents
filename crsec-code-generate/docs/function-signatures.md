# 一期函数签名与数据结构定义（Shared-only）

> 目标：为实现落地提供明确的函数级契约与数据结构。

---

## 1. 通用数据结构

### 1.1 Section
```ts
export interface Section {
  title: string;
  text: string;
  source: string;
  tags: string[];
  doc_type: "standard" | "component" | "faq" | "example";
  standard_level: "required" | "recommended";
}
```

### 1.2 Chunk
```ts
export interface Chunk {
  id: string; // source + offset 生成
  text: string;
  source: string;
  tags: string[];
  doc_type: string;
  standard_level: string;
  offset: number; // 原文位置
}
```

### 1.3 Vector
```ts
export interface Vector {
  id: string;
  values: number[]; // embedding
}
```

### 1.4 Result
```ts
export interface Result {
  text: string;
  source: string;
  score: number;
  doc_type: string;
  standard_level?: string;
}
```

### 1.5 DependencyGraph
```ts
export interface DependencyGraph {
  component: string;
  upstream: string[];
  downstream: string[];
  standards: string[];
}
```

---

## 2. Ingestion Service

### 2.1 解析器
```ts
export function parse_markdown(path: string): Section[];
export function parse_html(path: string): Section[];
export function parse_api_spec(path: string): Section[];
```

### 2.2 分块器
```ts
export function chunk_sections(
  sections: Section[],
  min_len?: number,
  max_len?: number
): Chunk[];
```

### 2.3 Embedding
```ts
export async function embed_chunks(chunks: Chunk[]): Promise<Vector[]>;
```

### 2.4 Qdrant 写入
```ts
export async function upsert_qdrant(
  chunks: Chunk[],
  vectors: Vector[]
): Promise<void>;
```

### 2.5 Neo4j 写入
```ts
export function upsert_components(components: string[]): Promise<void>;
export function upsert_standards(standards: string[]): Promise<void>;
export function upsert_dependencies(edges: Array<[string, string]>): Promise<void>;
```

---

## 3. Retrieval Service
```ts
export function retrieve_standards(
  query: string,
  top_k?: number
): Promise<Result[]>;
```

---

## 4. Graph Service
```ts
export function check_graph_dependency(
  component_name: string
): Promise<DependencyGraph>;
```

---

## 5. RAG Service

### 5.1 Prompt 构建
```ts
export function build_prompt(
  query: string,
  shared_results: Result[],
  graph_context: DependencyGraph
): string;
```

### 5.2 LLM 调用
```ts
export function generate_answer(prompt: string): Promise<string>;
```

---

## 6. MCP Server

### 6.1 工具注册
```ts
export function register_tools(): void;
```

### 6.2 MCP 工具方法
```ts
export async function mcp_retrieve_standards(args: {
  query: string;
  top_k?: number;
}): Promise<{ results: Result[] }>;

export async function mcp_check_graph_dependency(args: {
  component_name: string;
}): Promise<DependencyGraph>;

export async function mcp_get_personal_context(args: {
  user_id: string;
  query: string;
}): Promise<{ results: []; message: string }>; // 一期禁用
```
