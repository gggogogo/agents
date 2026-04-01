# 一期 API 请求-响应示例全集（Shared-only）

> 以下示例用于联调与自动化测试。

---

## 1. `retrieve_standards`

### 1.1 请求
```json
{
  "query": "如何使用 Button 组件",
  "top_k": 5
}
```

### 1.2 成功响应
```json
{
  "results": [
    {
      "text": "Button 组件用于触发主要动作...",
      "source": "ui/button.md",
      "score": 0.86,
      "doc_type": "component",
      "standard_level": "required"
    }
  ]
}
```

### 1.3 失败响应（参数错误）
```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "top_k must be between 1 and 20"
  }
}
```

---

## 2. `check_graph_dependency`

### 2.1 请求
```json
{
  "component_name": "Button"
}
```

### 2.2 成功响应
```json
{
  "component": "Button",
  "upstream": ["Theme"],
  "downstream": ["Modal"],
  "standards": ["UI-Consistency", "Accessibility"]
}
```

### 2.3 失败响应（资源不存在）
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "component not found: Button"
  }
}
```

---

## 3. `get_personal_context`（一期禁用）

### 3.1 请求
```json
{
  "user_id": "u123",
  "query": "如何写错误处理"
}
```

### 3.2 响应
```json
{
  "results": [],
  "message": "private ingestion disabled"
}
```

---

## 4. 降级响应示例

### 4.1 Qdrant 不可用
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "vector store unavailable"
  }
}
```

### 4.2 Neo4j 不可用（降级为纯检索）
```json
{
  "results": [
    {
      "text": "...",
      "source": "ui/button.md",
      "score": 0.79,
      "doc_type": "component"
    }
  ],
  "message": "graph dependency check skipped"
}
```
