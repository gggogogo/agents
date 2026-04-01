# 一期接口详细参数与错误码表

## 1. 公共约定

### 1.1 通用字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `request_id` | string | 请求追踪 id（可选） |
| `timestamp` | string | ISO8601 时间（可选） |

### 1.2 通用错误结构
```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "top_k must be between 1 and 20"
  }
}
```

---

## 2. `retrieve_standards`

### 2.1 请求
```json
{
  "query": "如何使用 Button 组件",
  "top_k": 5
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `query` | string | 是 | 用户问题 |
| `top_k` | int | 否 | 默认 5，范围 1-20 |

### 2.2 响应
```json
{
  "results": [
    {
      "text": "...",
      "source": "button.md",
      "score": 0.82,
      "doc_type": "component",
      "standard_level": "required"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `text` | string | 命中的片段文本 |
| `source` | string | 来源文件 |
| `score` | float | 相似度得分 |
| `doc_type` | string | component/standard/faq |
| `standard_level` | string | required/recommended |

---

## 3. `check_graph_dependency`

### 3.1 请求
```json
{
  "component_name": "Button"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `component_name` | string | 是 | 组件名称 |

### 3.2 响应
```json
{
  "component": "Button",
  "upstream": ["Theme"],
  "downstream": ["Modal"],
  "standards": ["UI-Consistency"]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `component` | string | 当前组件 |
| `upstream` | array | 上游依赖 |
| `downstream` | array | 下游依赖 |
| `standards` | array | 关联规范 |

---

## 4. `get_personal_context`（一期禁用）

### 4.1 请求
```json
{
  "user_id": "u123",
  "query": "如何写错误处理"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `user_id` | string | 是 | 用户 id |
| `query` | string | 是 | 用户问题 |

### 4.2 响应（一期）
```json
{
  "results": [],
  "message": "private ingestion disabled"
}
```

---

## 5. 错误码表

| code | 场景 | 说明 |
| --- | --- | --- |
| `INVALID_ARGUMENT` | 入参错误 | 如 `top_k` 超范围 |
| `NOT_FOUND` | 资源不存在 | 组件不存在 |
| `SERVICE_UNAVAILABLE` | 下游不可用 | Qdrant/Neo4j/LLM 不可用 |
| `INTERNAL_ERROR` | 未知错误 | 未捕获异常 |

---

## 6. 校验规则
- `query` 非空，长度 1-2000
- `top_k` 1-20
- `component_name` 必须是已登记组件
- `user_id` 格式为 `[a-zA-Z0-9_-]{3,64}`
